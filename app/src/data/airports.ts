import type { Airport } from "@/types";

export const DEFAULT_ORIGIN = "GRU";
export const DEFAULT_DESTINATION = "CAC";

export const AIRPORTS: Airport[] = [
  { code: "GRU", name: "Guarulhos", city: "São Paulo", country: "Brasil", cityGroup: "São Paulo", international: false },
  { code: "CGH", name: "Congonhas", city: "São Paulo", country: "Brasil", cityGroup: "São Paulo", international: false },
  { code: "VCP", name: "Viracopos", city: "Campinas", country: "Brasil", cityGroup: "São Paulo", international: false },

  { code: "CAC", name: "Regional de Cascavel", city: "Cascavel", country: "Brasil", cityGroup: "Cascavel", international: false },

  { code: "GIG", name: "Galeão", city: "Rio de Janeiro", country: "Brasil", cityGroup: "Rio de Janeiro", international: false },
  { code: "SDU", name: "Santos Dumont", city: "Rio de Janeiro", country: "Brasil", cityGroup: "Rio de Janeiro", international: false },
  { code: "BSB", name: "Brasília", city: "Brasília", country: "Brasil", cityGroup: "Brasília", international: false },
  { code: "CNF", name: "Confins", city: "Belo Horizonte", country: "Brasil", cityGroup: "Belo Horizonte", international: false },
  { code: "CWB", name: "Afonso Pena", city: "Curitiba", country: "Brasil", cityGroup: "Curitiba", international: false },
  { code: "POA", name: "Salgado Filho", city: "Porto Alegre", country: "Brasil", cityGroup: "Porto Alegre", international: false },
  { code: "SSA", name: "Deputado Luís Eduardo Magalhães", city: "Salvador", country: "Brasil", cityGroup: "Salvador", international: false },
  { code: "REC", name: "Guararapes", city: "Recife", country: "Brasil", cityGroup: "Recife", international: false },
  { code: "FOR", name: "Pinto Martins", city: "Fortaleza", country: "Brasil", cityGroup: "Fortaleza", international: false },
  { code: "FLN", name: "Hercílio Luz", city: "Florianópolis", country: "Brasil", cityGroup: "Florianópolis", international: false },
  { code: "MAO", name: "Eduardo Gomes", city: "Manaus", country: "Brasil", cityGroup: "Manaus", international: false },
  { code: "BEL", name: "Val de Cans", city: "Belém", country: "Brasil", cityGroup: "Belém", international: false },
  { code: "IGU", name: "Foz do Iguaçu", city: "Foz do Iguaçu", country: "Brasil", cityGroup: "Foz do Iguaçu", international: false },

  { code: "MIA", name: "Miami Intl", city: "Miami", country: "Estados Unidos", cityGroup: "Miami", international: true },
  { code: "JFK", name: "John F. Kennedy", city: "Nova York", country: "Estados Unidos", cityGroup: "Nova York", international: true },
  { code: "MCO", name: "Orlando Intl", city: "Orlando", country: "Estados Unidos", cityGroup: "Orlando", international: true },
  { code: "LIS", name: "Humberto Delgado", city: "Lisboa", country: "Portugal", cityGroup: "Lisboa", international: true },
  { code: "MAD", name: "Adolfo Suárez Madrid-Barajas", city: "Madri", country: "Espanha", cityGroup: "Madri", international: true },
  { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "França", cityGroup: "Paris", international: true },
  { code: "EZE", name: "Ministro Pistarini", city: "Buenos Aires", country: "Argentina", cityGroup: "Buenos Aires", international: true },
  { code: "SCL", name: "Arturo Merino Benítez", city: "Santiago", country: "Chile", cityGroup: "Santiago", international: true },
];

export function findAirport(code: string): Airport | undefined {
  return AIRPORTS.find((a) => a.code === code.toUpperCase());
}

export function airportLabel(code: string): string {
  const airport = findAirport(code);
  return airport ? `${airport.city} (${airport.code})` : code;
}
