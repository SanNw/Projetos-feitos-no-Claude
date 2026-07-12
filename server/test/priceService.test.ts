import { describe, expect, it } from "vitest";
import {
  getCalendar,
  getBestDays,
  getDayWithNeighbors,
  compareOrigins,
  getHistory,
} from "../src/services/priceService.js";
import { upsertRecords } from "../src/services/cache.js";

describe("getCalendar / tagRecords", () => {
  it("marca o dia mais barato como 'cheap' e o mais caro como 'expensive'", async () => {
    const calendar = await getCalendar("GRU", "TAGTEST1", 90);
    expect(calendar).toHaveLength(90);

    const cheapest = [...calendar].sort((a, b) => a.price - b.price)[0];
    const priciest = [...calendar].sort((a, b) => b.price - a.price)[0];

    expect(cheapest.tag).toBe("cheap");
    expect(priciest.tag).toBe("expensive");
  });

  it("respeita os cortes de percentil 30/70 de forma consistente", async () => {
    const calendar = await getCalendar("GRU", "TAGTEST2", 90);
    const sorted = [...calendar.map((d) => d.price)].sort((a, b) => a - b);
    const cheapCutoff = sorted[Math.floor(sorted.length * 0.3)];
    const expensiveCutoff = sorted[Math.floor(sorted.length * 0.7)];

    for (const day of calendar) {
      if (day.price <= cheapCutoff) expect(day.tag).toBe("cheap");
      else if (day.price >= expensiveCutoff) expect(day.tag).toBe("expensive");
      else expect(day.tag).toBe("medium");
    }
  });
});

describe("getBestDays", () => {
  it("devolve os N dias mais baratos, em ordem crescente de preço", async () => {
    const best = await getBestDays("GRU", "BESTTEST1", 90, 5);
    expect(best).toHaveLength(5);
    for (let i = 1; i < best.length; i++) {
      expect(best[i].price).toBeGreaterThanOrEqual(best[i - 1].price);
    }

    const fullCalendar = await getCalendar("GRU", "BESTTEST1", 90);
    const globalCheapest = Math.min(...fullCalendar.map((d) => d.price));
    expect(best[0].price).toBe(globalCheapest);
  });
});

describe("getDayWithNeighbors", () => {
  it("devolve exatamente os 7 dias de uma janela ±3, cruzando a virada de ano", async () => {
    const days = await getDayWithNeighbors("GRU", "NEIGHTEST1", "2027-01-01");
    expect(days.map((d) => d.date)).toEqual([
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
      "2027-01-04",
    ]);
  });

  it("cruza a virada de mês corretamente", async () => {
    const days = await getDayWithNeighbors("GRU", "NEIGHTEST2", "2026-03-01");
    expect(days.map((d) => d.date)).toEqual([
      "2026-02-26",
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
      "2026-03-04",
    ]);
  });
});

describe("compareOrigins", () => {
  it("devolve um registro por origem, para a mesma data/destino", async () => {
    const result = await compareOrigins(["GRU", "CGH", "VCP"], "CMPTEST1", "2026-08-05");
    expect(Object.keys(result).sort()).toEqual(["CGH", "GRU", "VCP"]);
    for (const origin of ["GRU", "CGH", "VCP"]) {
      expect(result[origin]?.origin).toBe(origin);
      expect(result[origin]?.destination).toBe("CMPTEST1");
      expect(result[origin]?.date).toBe("2026-08-05");
    }
  });
});

describe("cache: getCalendar prefere dados já cacheados a gerar de novo", () => {
  it("usa o preço já salvo no cache para uma data específica", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const origin = "GRU";
    const destination = "CACHETEST1";

    upsertRecords([
      {
        origin,
        destination,
        date: today,
        price: 1.23,
        currencyOriginal: "BRL",
        priceOriginal: 1.23,
        airline: "Companhia de Teste",
        link: "https://example.test/seeded",
      },
    ]);

    const calendar = await getCalendar(origin, destination, 1);
    expect(calendar).toHaveLength(1);
    expect(calendar[0].price).toBe(1.23);
    expect(calendar[0].airline).toBe("Companhia de Teste");
  });
});

describe("getHistory", () => {
  it("registra um ponto de histórico com o menor preço do calendário ao chamar getCalendar", async () => {
    const origin = "GRU";
    const destination = "HISTTEST1";
    const calendar = await getCalendar(origin, destination, 90);
    const lowest = Math.min(...calendar.map((d) => d.price));

    const history = getHistory(origin, destination, 90);
    expect(history.length).toBeGreaterThan(0);
    const today = new Date().toISOString().slice(0, 10);
    const todayPoint = history.find((h) => h.date === today);
    expect(todayPoint?.price).toBe(lowest);
  });
});
