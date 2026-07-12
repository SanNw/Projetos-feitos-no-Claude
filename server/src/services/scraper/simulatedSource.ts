import type { PriceSource } from "./types.js";
import { generatePriceRecord } from "../priceGenerator.js";

/**
 * Fonte padrão do MVP: gera preços de forma determinística (sem rede) para que o app
 * funcione fim-a-fim antes de existir uma integração real de coleta.
 *
 * Para plugar uma fonte real, crie `liveSource.ts` implementando `PriceSource` (por
 * exemplo usando a skill just-scrape sobre buscadores de passagens) e troque a
 * importação em `priceService.ts`.
 */
export const simulatedSource: PriceSource = {
  name: "simulated",
  async fetchPrices(origin, destination, dates) {
    return dates.map((date) => generatePriceRecord(origin, destination, date));
  },
};
