import type { CalendarDay, FlightPriceRecord, PriceTag } from "../types.js";
import { getCachedRecords, upsertRecords } from "./cache.js";
import { liveSource } from "./scraper/liveSource.js";

// liveSource consulta a Amadeus Self-Service API quando AMADEUS_CLIENT_ID/SECRET
// estão configuradas, e cai para o simulador (server/src/services/priceGenerator.ts)
// automaticamente quando não há credenciais ou quando a API falha/não cobre a rota.
const source = liveSource;

function dateRange(days: number, startOffset = 0): string[] {
  const dates: string[] = [];
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() + startOffset);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

async function getRecords(origin: string, destination: string, dates: string[]): Promise<FlightPriceRecord[]> {
  const cached = getCachedRecords(origin, destination, dates);
  const cachedDates = new Set(cached.map((r) => r.date));
  const missingDates = dates.filter((d) => !cachedDates.has(d));

  if (missingDates.length > 0) {
    const fresh = await source.fetchPrices(origin, destination, missingDates);
    upsertRecords(fresh);
    cached.push(...fresh);
  }

  const byDate = new Map(cached.map((r) => [r.date, r]));
  return dates.map((d) => byDate.get(d)!).filter(Boolean);
}

function tagRecords(records: FlightPriceRecord[]): CalendarDay[] {
  if (records.length === 0) return [];
  const sorted = [...records].map((r) => r.price).sort((a, b) => a - b);
  const cheapCutoff = sorted[Math.floor(sorted.length * 0.3)];
  const expensiveCutoff = sorted[Math.floor(sorted.length * 0.7)];

  return records.map((r) => {
    let tag: PriceTag = "medium";
    if (r.price <= cheapCutoff) tag = "cheap";
    else if (r.price >= expensiveCutoff) tag = "expensive";
    return { ...r, tag };
  });
}

export async function getCalendar(origin: string, destination: string, days = 90): Promise<CalendarDay[]> {
  const dates = dateRange(days);
  const records = await getRecords(origin, destination, dates);
  return tagRecords(records);
}

export async function getBestDays(
  origin: string,
  destination: string,
  days = 90,
  limit = 10
): Promise<CalendarDay[]> {
  const calendar = await getCalendar(origin, destination, days);
  return [...calendar].sort((a, b) => a.price - b.price).slice(0, limit);
}

export async function getDayWithNeighbors(
  origin: string,
  destination: string,
  date: string
): Promise<CalendarDay[]> {
  const target = new Date(`${date}T00:00:00Z`);
  const dates: string[] = [];
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(target);
    d.setUTCDate(d.getUTCDate() + offset);
    dates.push(d.toISOString().slice(0, 10));
  }
  const records = await getRecords(origin, destination, dates);
  return tagRecords(records);
}

export async function compareOrigins(
  origins: string[],
  destination: string,
  date: string
): Promise<Record<string, FlightPriceRecord | null>> {
  const result: Record<string, FlightPriceRecord | null> = {};
  await Promise.all(
    origins.map(async (origin) => {
      const [record] = await getRecords(origin, destination, [date]);
      result[origin] = record ?? null;
    })
  );
  return result;
}
