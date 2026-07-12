import type { FlightPriceRecord } from "../types.js";
import { findAirport } from "../data/airports.js";

/**
 * NOTA IMPORTANTE:
 * Este módulo é um simulador determinístico de preços, usado como fonte de dados padrão
 * (ver services/scraper/simulatedSource.ts). Ele NÃO faz scraping real de nenhum site.
 * Para dados reais, implemente `services/scraper/liveSource.ts` seguindo a interface
 * `PriceSource` (services/scraper/types.ts) e ligue-o em `priceService.ts` no lugar de
 * `simulatedSource`, respeitando os termos de uso das fontes escolhidas.
 */

const DOMESTIC_AIRLINES = ["LATAM", "GOL", "Azul"];
const INTERNATIONAL_AIRLINES = ["LATAM", "American Airlines", "United", "Air France", "TAP Portugal", "Iberia"];

// Taxas de câmbio fixas apenas para fins de simulação/demonstração.
const FX_TO_BRL: Record<string, number> = {
  BRL: 1,
  USD: 5.35,
  EUR: 5.8,
  ARS: 0.0055,
  CLP: 0.0056,
};

// PRNG determinístico (mulberry32) para que o mesmo par origem/destino/data sempre gere o mesmo preço
// dentro de uma janela de cache, evitando "piscar" preços diferentes a cada refresh.
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

function dayOfWeek(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

export function generatePriceRecord(origin: string, destination: string, date: string): FlightPriceRecord {
  const originAirport = findAirport(origin);
  const destAirport = findAirport(destination);
  const international = Boolean(originAirport?.international || destAirport?.international);

  const rng = mulberry32(hashString(`${origin}|${destination}|${date}`));

  const airlinePool = international ? INTERNATIONAL_AIRLINES : DOMESTIC_AIRLINES;
  const airline = airlinePool[Math.floor(rng() * airlinePool.length)];

  const currencyOriginal = international ? (rng() > 0.5 ? "USD" : "EUR") : "BRL";

  // Base de preço: doméstico curto x internacional longo
  const basePrice = international ? 2200 + rng() * 3500 : 280 + rng() * 900;

  // Fins de semana (sexta/sábado/domingo) tendem a ser mais caros; terça/quarta mais baratos.
  const dow = dayOfWeek(date);
  const weekendFactor = dow === 5 || dow === 6 || dow === 0 ? 1.18 : dow === 2 || dow === 3 ? 0.85 : 1.0;

  // "Promoções" ocasionais para dar variação real ao heatmap.
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
