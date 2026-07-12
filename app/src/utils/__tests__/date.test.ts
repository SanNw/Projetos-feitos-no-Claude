import {
  formatDayMonth,
  formatFullDate,
  formatWeekdayShort,
  monthLabel,
  parseDateKey,
  toDateKey,
} from "../date";

describe("toDateKey / parseDateKey", () => {
  it("faz o round-trip de uma data para string e de volta ao mesmo dia", () => {
    const original = new Date(Date.UTC(2026, 7, 4)); // 4 de agosto de 2026
    const key = toDateKey(original);
    expect(key).toBe("2026-08-04");

    const parsed = parseDateKey(key);
    expect(parsed.getUTCFullYear()).toBe(2026);
    expect(parsed.getUTCMonth()).toBe(7);
    expect(parsed.getUTCDate()).toBe(4);
  });
});

describe("formatDayMonth", () => {
  it("formata o primeiro dia do ano", () => {
    expect(formatDayMonth("2026-01-01")).toBe("1 de janeiro");
  });

  it("formata o último dia do ano corretamente (sem vazar para o ano seguinte)", () => {
    expect(formatDayMonth("2026-12-31")).toBe("31 de dezembro");
  });
});

describe("formatWeekdayShort", () => {
  it("identifica o dia da semana correto na virada de ano", () => {
    // 2026-12-31 é quinta-feira; 2027-01-04 é segunda-feira (verificado via Date nativo).
    expect(formatWeekdayShort("2026-12-31")).toBe("qui");
    expect(formatWeekdayShort("2027-01-04")).toBe("seg");
  });
});

describe("formatFullDate", () => {
  it("inclui dia da semana, dia, mês por extenso e ano", () => {
    expect(formatFullDate("2026-01-01")).toBe("qui, 1 de janeiro de 2026");
  });
});

describe("monthLabel", () => {
  it("formata mês e ano por extenso", () => {
    expect(monthLabel(2026, 0)).toBe("janeiro de 2026");
    expect(monthLabel(2026, 11)).toBe("dezembro de 2026");
  });
});
