// O pacote "amadeus" (SDK oficial) não publica typings. Declaração mínima e permissiva
// apenas para o que usamos em services/scraper/liveSource.ts.
declare module "amadeus" {
  interface AmadeusResponse<T = any> {
    data: T;
    result: any;
    body: string;
  }

  interface AmadeusOptions {
    clientId: string;
    clientSecret: string;
    hostname?: "test" | "production";
  }

  export default class Amadeus {
    constructor(options: AmadeusOptions);
    shopping: {
      flightOffersSearch: { get(params: Record<string, string>): Promise<AmadeusResponse> };
      flightDates: { get(params: Record<string, string>): Promise<AmadeusResponse> };
    };
  }
}
