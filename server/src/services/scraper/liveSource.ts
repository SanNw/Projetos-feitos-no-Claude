import Amadeus from "amadeus";
import type { PriceSource } from "./types.js";
import type { FlightPriceRecord } from "../../types.js";
import { generatePriceRecord } from "../priceGenerator.js";

/**
 * Fonte real de preços via Amadeus for Developers (Self-Service API):
 * https://developers.amadeus.com — gratuito para criar credenciais de teste.
 *
 * Por que Amadeus e não raspar HTML de Google Flights/Skyscorner/Decolar?
 * Essas plataformas proíbem scraping automatizado em seus termos de uso e são
 * tecnicamente frágeis (renderização pesada em JS, anti-bot, CAPTCHAs). O
 * Amadeus Self-Service é uma API pública feita justamente para consumo
 * programático de dados de voos, então é a via correta para "dados reais".
 *
 * IMPORTANTE — LIMITAÇÕES:
 * - Sem AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET configuradas, esta fonte
 *   fica inativa e cai 100% no simulador (mesmo comportamento de antes).
 * - O ambiente padrão ("test", grátis) usa um dataset estático/limitado de
 *   voos: aeroportos regionais pequenos (ex.: CAC/Cascavel, a rota padrão do
 *   app) muito provavelmente NÃO terão dados reais aí. É preciso o ambiente
 *   de produção (AMADEUS_ENV=production, conta paga) para cobertura ampla.
 * - Qualquer falha (rota sem cobertura, rate limit, erro de rede, resposta
 *   inesperada) faz a busca cair para o simulador **por data individual**,
 *   nunca quebrando o app.
 */

const FX_TO_BRL: Record<string, number> = { BRL: 1, USD: 5.35, EUR: 5.8, GBP: 6.7 };

// Acima desse número de datas por chamada, usamos o endpoint de calendário
// (1 request cobre o range todo) em vez de 1 request por data, para não
// estourar cota/rate limit da API ao carregar 90 dias de heatmap.
const SINGLE_DATE_LOOKUP_LIMIT = 8;

let client: Amadeus | null = null;
let clientInitAttempted = false;

function getClient(): Amadeus | null {
  if (!clientInitAttempted) {
    clientInitAttempted = true;
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
    if (clientId && clientSecret) {
      client = new Amadeus({
        clientId,
        clientSecret,
        hostname: process.env.AMADEUS_ENV === "production" ? "production" : "test",
      });
    }
  }
  return client;
}

export function isLiveSourceConfigured(): boolean {
  return getClient() !== null;
}

function toBRL(amount: number, currency: string): number {
  const rate = FX_TO_BRL[currency.toUpperCase()] ?? 1;
  return Math.round(amount * rate * 100) / 100;
}

function fallbackLink(origin: string, destination: string, date: string): string {
  return `https://www.google.com/travel/flights?q=voos%20de%20${origin}%20para%20${destination}%20em%20${date}`;
}

// O SDK "amadeus" rejeita com um ResponseError próprio (code/description/response),
// não um Error padrão — .message normalmente vem undefined.
function describeAmadeusError(err: unknown): string {
  const e = err as any;
  return e?.description ?? e?.code ?? e?.response?.statusCode ?? (err instanceof Error ? err.message : String(err));
}

async function fetchSingleDateOffer(
  amadeus: Amadeus,
  origin: string,
  destination: string,
  date: string
): Promise<FlightPriceRecord | null> {
  const response = await amadeus.shopping.flightOffersSearch.get({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate: date,
    adults: "1",
    currencyCode: "BRL",
    max: "5",
  });

  const offers = (response.data ?? []) as any[];
  if (offers.length === 0) return null;

  const cheapest = offers.reduce((min, offer) => (Number(offer.price?.total) < Number(min.price?.total) ? offer : min));

  const carrierCode: string | undefined =
    cheapest.validatingAirlineCodes?.[0] ?? cheapest.itineraries?.[0]?.segments?.[0]?.carrierCode;
  const carrierDictionary = response.result?.dictionaries?.carriers ?? {};
  const airline = (carrierCode && carrierDictionary[carrierCode]) || carrierCode || "Companhia não identificada";

  const currency: string = cheapest.price?.currency ?? "BRL";
  const total = Number(cheapest.price?.total ?? 0);
  if (!Number.isFinite(total) || total <= 0) return null;

  return {
    origin,
    destination,
    date,
    price: currency.toUpperCase() === "BRL" ? Math.round(total * 100) / 100 : toBRL(total, currency),
    currencyOriginal: currency,
    priceOriginal: total,
    airline,
    link: fallbackLink(origin, destination, date),
  };
}

async function fetchDateRangePrices(
  amadeus: Amadeus,
  origin: string,
  destination: string,
  dates: string[]
): Promise<Map<string, number>> {
  const sorted = [...dates].sort();
  const departureDate = sorted.length === 1 ? sorted[0] : `${sorted[0]},${sorted[sorted.length - 1]}`;

  const response = await amadeus.shopping.flightDates.get({ origin, destination, departureDate });

  const map = new Map<string, number>();
  for (const entry of (response.data ?? []) as any[]) {
    const total = Number(entry.price?.total);
    if (entry.departureDate && Number.isFinite(total) && total > 0) {
      // O endpoint de cheapest-date-search não documenta currencyCode de forma
      // confiável; o ambiente de teste tipicamente responde em EUR.
      map.set(entry.departureDate, toBRL(total, "EUR"));
    }
  }
  return map;
}

export const liveSource: PriceSource = {
  name: "amadeus",
  async fetchPrices(origin, destination, dates) {
    const amadeus = getClient();
    if (!amadeus) {
      return dates.map((date) => generatePriceRecord(origin, destination, date));
    }

    if (dates.length <= SINGLE_DATE_LOOKUP_LIMIT) {
      return Promise.all(
        dates.map(async (date) => {
          try {
            const record = await fetchSingleDateOffer(amadeus, origin, destination, date);
            return record ?? generatePriceRecord(origin, destination, date);
          } catch (err) {
            console.warn(`[amadeus] sem dados para ${origin}-${destination} em ${date}, usando simulado:`, describeAmadeusError(err));
            return generatePriceRecord(origin, destination, date);
          }
        })
      );
    }

    try {
      const priceByDate = await fetchDateRangePrices(amadeus, origin, destination, dates);
      return dates.map((date) => {
        const price = priceByDate.get(date);
        if (price === undefined) return generatePriceRecord(origin, destination, date);
        return {
          origin,
          destination,
          date,
          price,
          currencyOriginal: "EUR",
          priceOriginal: Math.round((price / FX_TO_BRL.EUR) * 100) / 100,
          airline: "Diversas companhias",
          link: fallbackLink(origin, destination, date),
        };
      });
    } catch (err) {
      console.warn(`[amadeus] falha ao consultar calendário ${origin}-${destination}, usando simulado:`, describeAmadeusError(err));
      return dates.map((date) => generatePriceRecord(origin, destination, date));
    }
  },
};
