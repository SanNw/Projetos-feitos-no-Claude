import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { FavoriteRoute, FlightPriceRecord } from "../types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "cache.sqlite"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS price_cache (
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    date TEXT NOT NULL,
    price REAL NOT NULL,
    currency_original TEXT NOT NULL,
    price_original REAL NOT NULL,
    airline TEXT NOT NULL,
    link TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    PRIMARY KEY (origin, destination, date)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    alert_threshold REAL,
    created_at TEXT NOT NULL,
    last_alert_price REAL,
    last_alert_sent_at TEXT
  );

  CREATE TABLE IF NOT EXISTS push_tokens (
    token TEXT PRIMARY KEY,
    created_at TEXT NOT NULL
  );

  -- Um ponto por (rota, dia de observação): o menor preço encontrado no
  -- calendário de 90 dias naquele dia. Ao longo de várias aberturas do app em
  -- dias diferentes, isso forma a série de tendência (ver services/priceService.ts).
  CREATE TABLE IF NOT EXISTS price_history (
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    date TEXT NOT NULL,
    price REAL NOT NULL,
    recorded_at TEXT NOT NULL,
    PRIMARY KEY (origin, destination, date)
  );
`);

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h - simula o intervalo do job periódico de atualização

export function getCachedRecords(origin: string, destination: string, dates: string[]): FlightPriceRecord[] {
  const placeholders = dates.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT * FROM price_cache WHERE origin = ? AND destination = ? AND date IN (${placeholders}) AND fetched_at > ?`
    )
    .all(origin, destination, ...dates, new Date(Date.now() - CACHE_TTL_MS).toISOString()) as any[];

  return rows.map(rowToRecord);
}

export function upsertRecords(records: FlightPriceRecord[]): void {
  const stmt = db.prepare(`
    INSERT INTO price_cache (origin, destination, date, price, currency_original, price_original, airline, link, fetched_at)
    VALUES (@origin, @destination, @date, @price, @currencyOriginal, @priceOriginal, @airline, @link, @fetchedAt)
    ON CONFLICT(origin, destination, date) DO UPDATE SET
      price = excluded.price,
      currency_original = excluded.currency_original,
      price_original = excluded.price_original,
      airline = excluded.airline,
      link = excluded.link,
      fetched_at = excluded.fetched_at
  `);
  const fetchedAt = new Date().toISOString();
  const insertMany = db.transaction((items: FlightPriceRecord[]) => {
    for (const item of items) {
      stmt.run({ ...item, fetchedAt });
    }
  });
  insertMany(records);
}

function rowToRecord(row: any): FlightPriceRecord {
  return {
    origin: row.origin,
    destination: row.destination,
    date: row.date,
    price: row.price,
    currencyOriginal: row.currency_original,
    priceOriginal: row.price_original,
    airline: row.airline,
    link: row.link,
  };
}

export function listFavorites(): FavoriteRoute[] {
  const rows = db.prepare(`SELECT * FROM favorites ORDER BY created_at DESC`).all() as any[];
  return rows.map((row) => ({
    id: row.id,
    origin: row.origin,
    destination: row.destination,
    alertThreshold: row.alert_threshold,
    createdAt: row.created_at,
    lastAlertPrice: row.last_alert_price,
    lastAlertSentAt: row.last_alert_sent_at,
  }));
}

export function addFavorite(favorite: FavoriteRoute): void {
  db.prepare(
    `INSERT OR REPLACE INTO favorites (id, origin, destination, alert_threshold, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(favorite.id, favorite.origin, favorite.destination, favorite.alertThreshold, favorite.createdAt);
}

export function updateFavoriteThreshold(id: string, alertThreshold: number | null): boolean {
  const result = db.prepare(`UPDATE favorites SET alert_threshold = ? WHERE id = ?`).run(alertThreshold, id);
  return result.changes > 0;
}

export function removeFavorite(id: string): boolean {
  const result = db.prepare(`DELETE FROM favorites WHERE id = ?`).run(id);
  return result.changes > 0;
}

// Debounce de alerta: registra o preço que motivou o último push enviado para
// essa rota favorita, para não notificar de novo enquanto o preço não cair
// ainda mais (ver services/alertChecker.ts).
export function markFavoriteNotified(id: string, price: number): void {
  db.prepare(`UPDATE favorites SET last_alert_price = ?, last_alert_sent_at = ? WHERE id = ?`).run(
    price,
    new Date().toISOString(),
    id
  );
}

export function resetFavoriteAlertState(id: string): void {
  db.prepare(`UPDATE favorites SET last_alert_price = NULL, last_alert_sent_at = NULL WHERE id = ?`).run(id);
}

export function addPushToken(token: string): void {
  db.prepare(`INSERT OR IGNORE INTO push_tokens (token, created_at) VALUES (?, ?)`).run(token, new Date().toISOString());
}

export function listPushTokens(): string[] {
  return (db.prepare(`SELECT token FROM push_tokens`).all() as Array<{ token: string }>).map((r) => r.token);
}

export function removePushToken(token: string): boolean {
  const result = db.prepare(`DELETE FROM push_tokens WHERE token = ?`).run(token);
  return result.changes > 0;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

// Guarda o menor preço do dia; se a rota já foi observada hoje com um preço
// menor, mantém o menor (MIN), em vez de sobrescrever com um valor pior.
export function recordHistoryPoint(origin: string, destination: string, price: number): void {
  const today = new Date().toISOString().slice(0, 10);
  db.prepare(
    `INSERT INTO price_history (origin, destination, date, price, recorded_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(origin, destination, date) DO UPDATE SET
       price = MIN(price_history.price, excluded.price),
       recorded_at = excluded.recorded_at`
  ).run(origin, destination, today, price, new Date().toISOString());
}

export function getPriceHistory(origin: string, destination: string, days: number): PriceHistoryPoint[] {
  return db
    .prepare(
      `SELECT date, price FROM price_history
       WHERE origin = ? AND destination = ? AND date >= date('now', ?)
       ORDER BY date ASC`
    )
    .all(origin, destination, `-${days} days`) as PriceHistoryPoint[];
}
