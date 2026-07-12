export type PriceTag = "cheap" | "medium" | "expensive";

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  /** Airports that share this group are offered together as "the same city" (e.g. GRU/CGH/VCP = São Paulo). */
  cityGroup: string;
  international: boolean;
}

/** Canonical shape for a single collected fare, as produced by any price source (scraper or simulator). */
export interface FlightPriceRecord {
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD
  price: number; // always BRL, already converted
  currencyOriginal: string; // ISO code of the currency the fare was originally quoted in
  priceOriginal: number;
  airline: string;
  link: string;
}

export interface CalendarDay extends FlightPriceRecord {
  tag: PriceTag;
}

export interface FavoriteRoute {
  id: string;
  origin: string;
  destination: string;
  alertThreshold: number | null;
  createdAt: string;
}
