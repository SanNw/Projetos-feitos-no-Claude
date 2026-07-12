import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  addFavorite,
  addPushToken,
  getCachedRecords,
  getPriceHistory,
  listFavorites,
  listPushTokens,
  markFavoriteNotified,
  recordHistoryPoint,
  removeFavorite,
  removePushToken,
  resetFavoriteAlertState,
  updateFavoriteThreshold,
  upsertRecords,
} from "../src/services/cache.js";
import type { FlightPriceRecord } from "../src/types.js";

function fakeRecord(overrides: Partial<FlightPriceRecord> = {}): FlightPriceRecord {
  return {
    origin: "GRU",
    destination: "TEST",
    date: "2026-11-11",
    price: 500,
    currencyOriginal: "BRL",
    priceOriginal: 500,
    airline: "Companhia Teste",
    link: "https://example.test",
    ...overrides,
  };
}

describe("upsertRecords / getCachedRecords", () => {
  it("insere um registro novo e o devolve via getCachedRecords", () => {
    const record = fakeRecord({ destination: "UPSERT1" });
    upsertRecords([record]);
    const result = getCachedRecords(record.origin, record.destination, [record.date]);
    expect(result).toEqual([record]);
  });

  it("é idempotente: chamar de novo com a mesma chave atualiza em vez de duplicar", () => {
    const record = fakeRecord({ destination: "UPSERT2", price: 500 });
    upsertRecords([record]);
    upsertRecords([{ ...record, price: 999, airline: "Outra Companhia" }]);

    const result = getCachedRecords(record.origin, record.destination, [record.date]);
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(999);
    expect(result[0].airline).toBe("Outra Companhia");
  });

  it("expira registros do cache depois do TTL de 6h", () => {
    const record = fakeRecord({ destination: "TTLTEST1" });
    upsertRecords([record]);
    expect(getCachedRecords(record.origin, record.destination, [record.date])).toHaveLength(1);

    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(Date.now() + 7 * 60 * 60 * 1000));
      expect(getCachedRecords(record.origin, record.destination, [record.date])).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("favoritos", () => {
  it("cria, lista, atualiza o limite de alerta e remove", () => {
    const id = randomUUID();
    addFavorite({ id, origin: "GRU", destination: "FAVTEST1", alertThreshold: 300, createdAt: new Date().toISOString() });

    let favorites = listFavorites();
    const created = favorites.find((f) => f.id === id);
    expect(created?.alertThreshold).toBe(300);
    expect(created?.lastAlertPrice ?? null).toBeNull();

    expect(updateFavoriteThreshold(id, 250)).toBe(true);
    favorites = listFavorites();
    expect(favorites.find((f) => f.id === id)?.alertThreshold).toBe(250);

    expect(updateFavoriteThreshold(randomUUID(), 100)).toBe(false);

    expect(removeFavorite(id)).toBe(true);
    expect(listFavorites().some((f) => f.id === id)).toBe(false);
    expect(removeFavorite(id)).toBe(false);
  });

  it("marca e reseta o estado de debounce de alerta", () => {
    const id = randomUUID();
    addFavorite({ id, origin: "GRU", destination: "FAVTEST2", alertThreshold: 300, createdAt: new Date().toISOString() });

    markFavoriteNotified(id, 199.9);
    let favorite = listFavorites().find((f) => f.id === id);
    expect(favorite?.lastAlertPrice).toBe(199.9);
    expect(favorite?.lastAlertSentAt).toBeTruthy();

    resetFavoriteAlertState(id);
    favorite = listFavorites().find((f) => f.id === id);
    expect(favorite?.lastAlertPrice ?? null).toBeNull();
    expect(favorite?.lastAlertSentAt ?? null).toBeNull();
  });
});

describe("push tokens", () => {
  it("adiciona, lista (sem duplicar) e remove tokens", () => {
    const token = `ExponentPushToken[${randomUUID()}]`;
    addPushToken(token);
    addPushToken(token); // INSERT OR IGNORE — não deve duplicar

    const tokens = listPushTokens();
    expect(tokens.filter((t) => t === token)).toHaveLength(1);

    expect(removePushToken(token)).toBe(true);
    expect(listPushTokens()).not.toContain(token);
    expect(removePushToken(token)).toBe(false);
  });
});

describe("price_history", () => {
  it("mantém o menor preço do dia (MIN) em vez de sobrescrever com um valor pior", () => {
    const origin = "GRU";
    const destination = "HISTCACHE1";

    recordHistoryPoint(origin, destination, 300);
    recordHistoryPoint(origin, destination, 150); // mais barato: deve substituir
    recordHistoryPoint(origin, destination, 400); // mais caro: não deve substituir

    const history = getPriceHistory(origin, destination, 90);
    const today = new Date().toISOString().slice(0, 10);
    expect(history.find((h) => h.date === today)?.price).toBe(150);
  });

  it("getPriceHistory só devolve pontos dentro da janela de dias pedida", () => {
    // getPriceHistory usa a função date('now', ...) do SQLite, que lê o
    // relógio real do sistema (vi.setSystemTime só finge o Date do JS) — por
    // isso a data é "fabricada no passado" via recordHistoryPoint (JS Date,
    // esse sim afetado pelo fake timer) e a leitura acontece com o relógio
    // real restaurado.
    const origin = "GRU";
    const destination = "HISTCACHE2";

    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(Date.now() - 100 * 24 * 60 * 60 * 1000));
      recordHistoryPoint(origin, destination, 250);
    } finally {
      vi.useRealTimers();
    }

    expect(getPriceHistory(origin, destination, 90)).toHaveLength(0);
    expect(getPriceHistory(origin, destination, 110)).toHaveLength(1);
  });
});
