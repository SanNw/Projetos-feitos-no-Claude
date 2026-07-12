import type { FlightPriceRecord } from "../../types.js";

/**
 * Contrato que qualquer fonte de preços (simulada ou real) precisa implementar.
 * Uma futura fonte real (ex.: via skill just-scrape) deve raspar sites de busca de
 * passagens respeitando os termos de uso e devolver os dados já neste formato.
 */
export interface PriceSource {
  name: string;
  fetchPrices(origin: string, destination: string, dates: string[]): Promise<FlightPriceRecord[]>;
}
