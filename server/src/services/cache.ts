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
    created_at TEXT NOT NULL
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
