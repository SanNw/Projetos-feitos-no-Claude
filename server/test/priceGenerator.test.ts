import { describe, expect, it } from "vitest";
import { generatePriceRecord } from "../src/services/priceGenerator.js";

const FX_TO_BRL: Record<string, number> = { USD: 5.35, EUR: 5.8 };

describe("generatePriceRecord", () => {
  it("é determinístico: mesma origem/destino/data sempre gera o mesmo preço", () => {
    const a = generatePriceRecord("GRU", "CAC", "2026-09-15");
    const b = generatePriceRecord("GRU", "CAC", "2026-09-15");
    expect(a).toEqual(b);
  });

  it("gera preços diferentes para datas diferentes da mesma rota", () => {
    const a = generatePriceRecord("GRU", "CAC", "2026-09-15");
    const b = generatePriceRecord("GRU", "CAC", "2026-09-16");
    expect(a.price).not.toBe(b.price);
  });

  it("rotas domésticas (BR-BR) sempre cotam em BRL, sem conversão", () => {
    const record = generatePriceRecord("GRU", "CAC", "2026-09-15");
    expect(record.currencyOriginal).toBe("BRL");
    expect(record.price).toBe(record.priceOriginal);
  });

  it("rotas domésticas usam apenas companhias domésticas", () => {
    const airlines = new Set<string>();
    for (let day = 1; day <= 28; day++) {
      const date = `2026-09-${String(day).padStart(2, "0")}`;
      airlines.add(generatePriceRecord("GRU", "CAC", date).airline);
    }
    expect([...airlines].every((a) => ["LATAM", "GOL", "Azul"].includes(a))).toBe(true);
  });

  it("rotas internacionais cotam em USD ou EUR e convertem corretamente para BRL", () => {
    let sawInternationalCurrency = false;
    for (let day = 1; day <= 28; day++) {
      const date = `2026-09-${String(day).padStart(2, "0")}`;
      const record = generatePriceRecord("GRU", "MIA", date);
      expect(["USD", "EUR"]).toContain(record.currencyOriginal);
      sawInternationalCurrency = true;

      const expectedPrice = Math.round(record.priceOriginal * FX_TO_BRL[record.currencyOriginal] * 100) / 100;
      expect(record.price).toBeCloseTo(expectedPrice, 2);
    }
    expect(sawInternationalCurrency).toBe(true);
  });

  it("preços de terça/quarta tendem a ser mais baratos que sexta/sábado/domingo (mesma rota, amostra grande)", () => {
    // 2026-09-01 é uma terça-feira. Varia destino e semana para diversificar a
    // seed do PRNG e diluir o efeito de "promoções" (12% de chance por data).
    const destinations = ["CAC", "GIG", "BSB", "CNF", "CWB", "POA", "SSA", "REC", "FOR", "FLN", "MAO", "BEL", "IGU", "VCP"];
    const cheapPrices: number[] = [];
    const expensivePrices: number[] = [];

    for (const destination of destinations) {
      for (let week = 0; week < 8; week++) {
        const tuesday = new Date(Date.UTC(2026, 8, 1 + week * 7));
        const friday = new Date(tuesday);
        friday.setUTCDate(friday.getUTCDate() + 3);

        cheapPrices.push(generatePriceRecord("GRU", destination, tuesday.toISOString().slice(0, 10)).price);
        expensivePrices.push(generatePriceRecord("GRU", destination, friday.toISOString().slice(0, 10)).price);
      }
    }

    const avg = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
    expect(avg(cheapPrices)).toBeLessThan(avg(expensivePrices));
  });

  it("o link de referência contém origem, destino e data", () => {
    const record = generatePriceRecord("GRU", "CAC", "2026-09-15");
    expect(record.link).toContain("GRU");
    expect(record.link).toContain("CAC");
    expect(record.link).toContain("2026-09-15");
  });
});
