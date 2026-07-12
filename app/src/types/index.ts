export type PriceTag = "cheap" | "medium" | "expensive";

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  cityGroup: string;
  international: boolean;
}

export interface FlightPriceRecord {
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD
  price: number; // BRL
  currencyOriginal: string;
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
  lowestPrice?: number | null;
}

export interface Route {
  origin: string;
  destination: string;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
}
