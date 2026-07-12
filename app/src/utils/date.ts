const WEEKDAY_LABELS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTH_LABELS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00Z`);
}

export function formatDayMonth(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return `${d.getUTCDate()} de ${MONTH_LABELS[d.getUTCMonth()]}`;
}

export function formatWeekdayShort(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return WEEKDAY_LABELS[d.getUTCDay()];
}

export function formatFullDate(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return `${WEEKDAY_LABELS[d.getUTCDay()]}, ${d.getUTCDate()} de ${MONTH_LABELS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

export function monthLabel(year: number, monthIndex: number): string {
  return `${MONTH_LABELS[monthIndex]} de ${year}`;
}

export const MONTHS_PT = MONTH_LABELS;
