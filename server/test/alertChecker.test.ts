import { randomUUID } from "node:crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../src/services/pushNotifications.js", () => ({
  sendPushNotifications: vi.fn().mockResolvedValue(undefined),
}));

import { sendPushNotifications } from "../src/services/pushNotifications.js";
import { checkFavoriteAlerts } from "../src/services/alertChecker.js";
import { addFavorite, addPushToken, listFavorites, upsertRecords } from "../src/services/cache.js";
import type { FlightPriceRecord } from "../src/types.js";

function next90Days(): string[] {
  const dates: string[] = [];
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < 90; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function seedFlatCalendar(origin: string, destination: string, price: number) {
  const records: FlightPriceRecord[] = next90Days().map((date) => ({
    origin,
    destination,
    date,
    price,
    currencyOriginal: "BRL",
    priceOriginal: price,
    airline: "Companhia Teste",
    link: "https://example.test",
  }));
  upsertRecords(records);
}

beforeEach(() => {
  vi.mocked(sendPushNotifications).mockClear();
});

describe("checkFavoriteAlerts", () => {
  it("dispara e envia push quando o preço está abaixo do limite", async () => {
    const id = randomUUID();
    const destination = "ALERT1";
    seedFlatCalendar("GRU", destination, 100);
    addFavorite({ id, origin: "GRU", destination, alertThreshold: 200, createdAt: new Date().toISOString() });
    addPushToken(`ExponentPushToken[${randomUUID()}]`);

    const triggered = await checkFavoriteAlerts();

    expect(triggered.some((t) => t.favoriteId === id && t.price === 100)).toBe(true);
    expect(sendPushNotifications).toHaveBeenCalledTimes(1);
    const [messages] = vi.mocked(sendPushNotifications).mock.calls[0];
    expect(messages[0].body).toContain("GRU");
    expect(messages[0].body).toContain(destination);
  });

  it("não dispara quando o preço está acima do limite", async () => {
    const id = randomUUID();
    const destination = "ALERT2";
    seedFlatCalendar("GRU", destination, 900);
    addFavorite({ id, origin: "GRU", destination, alertThreshold: 200, createdAt: new Date().toISOString() });
    addPushToken(`ExponentPushToken[${randomUUID()}]`);

    const triggered = await checkFavoriteAlerts();

    expect(triggered.some((t) => t.favoriteId === id)).toBe(false);
    expect(sendPushNotifications).not.toHaveBeenCalled();
  });

  it("debounce: não reenvia push se o preço não caiu mais desde o último aviso", async () => {
    const id = randomUUID();
    const destination = "ALERT3";
    seedFlatCalendar("GRU", destination, 150);
    addFavorite({ id, origin: "GRU", destination, alertThreshold: 200, createdAt: new Date().toISOString() });
    addPushToken(`ExponentPushToken[${randomUUID()}]`);

    await checkFavoriteAlerts();
    expect(sendPushNotifications).toHaveBeenCalledTimes(1);

    await checkFavoriteAlerts();
    expect(sendPushNotifications).toHaveBeenCalledTimes(1); // não repetiu

    const favorite = listFavorites().find((f) => f.id === id);
    expect(favorite?.lastAlertPrice).toBe(150);
  });

  it("reenvia push se o preço cair ainda mais depois do primeiro aviso", async () => {
    const id = randomUUID();
    const destination = "ALERT4";
    seedFlatCalendar("GRU", destination, 150);
    addFavorite({ id, origin: "GRU", destination, alertThreshold: 200, createdAt: new Date().toISOString() });
    addPushToken(`ExponentPushToken[${randomUUID()}]`);

    await checkFavoriteAlerts();
    expect(sendPushNotifications).toHaveBeenCalledTimes(1);

    seedFlatCalendar("GRU", destination, 90); // cai mais
    await checkFavoriteAlerts();
    expect(sendPushNotifications).toHaveBeenCalledTimes(2);
  });

  it("reseta o debounce quando o preço volta a subir acima do limite", async () => {
    const id = randomUUID();
    const destination = "ALERT5";
    seedFlatCalendar("GRU", destination, 150);
    addFavorite({ id, origin: "GRU", destination, alertThreshold: 200, createdAt: new Date().toISOString() });
    addPushToken(`ExponentPushToken[${randomUUID()}]`);

    await checkFavoriteAlerts();
    expect(listFavorites().find((f) => f.id === id)?.lastAlertPrice).toBe(150);

    seedFlatCalendar("GRU", destination, 900); // sobe acima do limite
    await checkFavoriteAlerts();
    expect(listFavorites().find((f) => f.id === id)?.lastAlertPrice ?? null).toBeNull();

    seedFlatCalendar("GRU", destination, 150); // cai de novo, mesmo preço de antes
    await checkFavoriteAlerts();
    expect(sendPushNotifications).toHaveBeenCalledTimes(2); // primeiro aviso + este novo, já que o estado foi resetado
  });
});
