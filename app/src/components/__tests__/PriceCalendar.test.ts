import { groupByMonth } from "../PriceCalendar";
import type { CalendarDay } from "@/types";

function fakeDay(date: string): CalendarDay {
  return {
    origin: "GRU",
    destination: "CAC",
    date,
    price: 300,
    currencyOriginal: "BRL",
    priceOriginal: 300,
    airline: "Teste",
    link: "https://example.test",
    tag: "medium",
  };
}

describe("groupByMonth", () => {
  it("agrupa dias em meses separados, na ordem em que aparecem", () => {
    const days = ["2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02"].map(fakeDay);
    const groups = groupByMonth(days);

    expect(groups).toHaveLength(2);
    expect(groups[0].days.map((d) => d.date)).toEqual(["2026-08-30", "2026-08-31"]);
    expect(groups[1].days.map((d) => d.date)).toEqual(["2026-09-01", "2026-09-02"]);
  });

  it("rotula cada grupo com o mês/ano por extenso em português", () => {
    const days = ["2026-08-30", "2026-09-01"].map(fakeDay);
    const groups = groupByMonth(days);

    expect(groups[0].label).toBe("agosto de 2026");
    expect(groups[1].label).toBe("setembro de 2026");
  });

  it("calcula leadingBlanks a partir do dia da semana do primeiro dia de cada grupo", () => {
    // 2026-08-30 é domingo (0); 2026-09-01 é terça-feira (2) — verificado via Date nativo.
    const days = ["2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02"].map(fakeDay);
    const groups = groupByMonth(days);

    expect(groups[0].leadingBlanks).toBe(0);
    expect(groups[1].leadingBlanks).toBe(2);
  });

  it("devolve uma lista vazia quando não há dias", () => {
    expect(groupByMonth([])).toEqual([]);
  });
});
