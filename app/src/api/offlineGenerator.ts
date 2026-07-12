import type { CalendarDay, FlightPriceRecord, PriceTag } from "@/types";
import { findAirport } from "@/data/airports";

/**
 * Réplica leve do simulador do backend (server/src/services/priceGenerator.ts),
 * usada apenas como fallback quando o app não consegue falar com a API (ex.: offline
 * ou testando a UI sem o servidor rodando). Mantém a mesma lógica determinística para
 * que o comportamento visual seja parecido em ambos os casos.
 */

const DOMESTIC_AIRLINES = ["LATAM", "GOL", "Azul"];
const INTERNATIONAL_AIRLINES = ["LATAM", "American Airlines", "United", "Air France", "TAP Portugal", "Iberia"];
const FX_TO_BRL: Record<string, number> = { BRL: 1, USD: 5.35, EUR: 5.8 };

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function generateRecord(origin: string, destination: string, date: string): FlightPriceRecord {
  const international = Boolean(findAirport(origin)?.international || findAirport(destination)?.international);
  const rng = mulberry32(hashString(`${origin}|${destination}|${date}`));
  const airlinePool = international ? INTERNATIONAL_AIRLINES : DOMESTIC_AIRLINES;
  const airline = airlinePool[Math.floor(rng() * airlinePool.length)];
  const currencyOriginal = international ? (rng() > 0.5 ? "USD" : "EUR") : "BRL";
  const basePrice = international ? 2200 + rng() * 3500 : 280 + rng() * 900;
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  const weekendFactor = dow === 5 || dow === 6 || dow === 0 ? 1.18 : dow === 2 || dow === 3 ? 0.85 : 1.0;
  const promoFactor = rng() < 0.12 ? 0.6 + rng() * 0.15 : 1;
  const noise = 0.9 + rng() * 0.2;
  const priceOriginal = Math.round(basePrice * weekendFactor * promoFactor * noise * 100) / 100;
  const priceBRL = Math.round(priceOriginal * FX_TO_BRL[currencyOriginal] * 100) / 100;

  return {
    origin,
    destination,
    date,
    price: priceBRL,
    currencyOriginal,
    priceOriginal,
    airline,
    link: `https://www.google.com/travel/flights?q=voos%20de%20${origin}%20para%20${destination}%20em%20${date}`,
  };
}

function tag(records: FlightPriceRecord[]): CalendarDay[] {
  if (records.length === 0) return [];
  const sorted = [...records].map((r) => r.price).sort((a, b) => a - b);
  const cheapCutoff = sorted[Math.floor(sorted.length * 0.3)];
  const expensiveCutoff = sorted[Math.floor(sorted.length * 0.7)];
  return records.map((r) => {
    let t: PriceTag = "medium";
    if (r.price <= cheapCutoff) t = "cheap";
    else if (r.price >= expensiveCutoff) t = "expensive";
    return { ...r, tag: t };
  });
}

function dateRange(days: number): string[] {
  const dates: string[] = [];
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function offlineCalendar(origin: string, destination: string, days = 90): CalendarDay[] {
  return tag(dateRange(days).map((date) => generateRecord(origin, destination, date)));
}

export function offlineDay(origin: string, destination: string, date: string): CalendarDay[] {
  const target = new Date(`${date}T00:00:00Z`);
  const dates: string[] = [];
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(target);
    d.setUTCDate(d.getUTCDate() + offset);
    dates.push(d.toISOString().slice(0, 10));
  }
  return tag(dates.map((d) => generateRecord(origin, destination, d)));
}
