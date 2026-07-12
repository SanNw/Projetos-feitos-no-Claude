import type { Airport, CalendarDay, FavoriteRoute, FlightPriceRecord, PriceHistoryPoint } from "@/types";
import { offlineCalendar, offlineDay } from "./offlineGenerator";
import { resolveApiUrl } from "./resolveApiUrl";
import { AIRPORTS, DEFAULT_DESTINATION, DEFAULT_ORIGIN } from "@/data/airports";

const API_URL = resolveApiUrl();
const REQUEST_TIMEOUT_MS = 5000;

async function request<T>(pathAndQuery: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${pathAndQuery}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAirports(): Promise<Airport[]> {
  try {
    const data = await request<{ airports: Airport[] }>("/api/airports");
    return data.airports;
  } catch {
    // Sem conexão com a API: usa a lista embutida no app.
    return AIRPORTS;
  }
}

export async function fetchDefaultRoute(): Promise<{ origin: string; destination: string }> {
  try {
    return await request("/api/airports/default-route");
  } catch {
    return { origin: DEFAULT_ORIGIN, destination: DEFAULT_DESTINATION };
  }
}

export async function fetchCalendar(origin: string, destination: string, days = 90): Promise<CalendarDay[]> {
  try {
    const data = await request<{ calendar: CalendarDay[] }>(
      `/api/prices/calendar?origin=${origin}&destination=${destination}&days=${days}`
    );
    return data.calendar;
  } catch {
    return offlineCalendar(origin, destination, days);
  }
}

export async function fetchBestDays(
  origin: string,
  destination: string,
  days = 90,
  limit = 10
): Promise<CalendarDay[]> {
  try {
    const data = await request<{ bestDays: CalendarDay[] }>(
      `/api/prices/best?origin=${origin}&destination=${destination}&days=${days}&limit=${limit}`
    );
    return data.bestDays;
  } catch {
    return [...offlineCalendar(origin, destination, days)].sort((a, b) => a.price - b.price).slice(0, limit);
  }
}

export async function fetchDay(origin: string, destination: string, date: string): Promise<CalendarDay[]> {
  try {
    const data = await request<{ days: CalendarDay[] }>(
      `/api/prices/day?origin=${origin}&destination=${destination}&date=${date}`
    );
    return data.days;
  } catch {
    return offlineDay(origin, destination, date);
  }
}

export async function fetchHistory(origin: string, destination: string, days = 90): Promise<PriceHistoryPoint[]> {
  try {
    const data = await request<{ history: PriceHistoryPoint[] }>(
      `/api/prices/history?origin=${origin}&destination=${destination}&days=${days}`
    );
    return data.history;
  } catch {
    // Histórico é dado real acumulado ao longo do tempo — não dá pra simular
    // offline com sentido. Sem API, a tela mostra o estado vazio.
    return [];
  }
}

export async function fetchCompareOrigins(
  origins: string[],
  destination: string,
  date: string
): Promise<Record<string, FlightPriceRecord | null>> {
  try {
    const data = await request<{ comparison: Record<string, FlightPriceRecord | null> }>(
      `/api/prices/compare-origins?origins=${origins.join(",")}&destination=${destination}&date=${date}`
    );
    return data.comparison;
  } catch {
    const result: Record<string, FlightPriceRecord | null> = {};
    for (const origin of origins) {
      const [record] = offlineDay(origin, destination, date).filter((d) => d.date === date);
      result[origin] = record ?? null;
    }
    return result;
  }
}

export async function fetchFavorites(): Promise<FavoriteRoute[]> {
  const data = await request<{ favorites: FavoriteRoute[] }>("/api/favorites");
  return data.favorites;
}

export async function createFavorite(
  origin: string,
  destination: string,
  alertThreshold: number | null
): Promise<FavoriteRoute> {
  const res = await fetch(`${API_URL}/api/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destination, alertThreshold }),
  });
  const data = await res.json();
  return data.favorite;
}

export async function updateFavoriteAlert(id: string, threshold: number | null): Promise<void> {
  await fetch(`${API_URL}/api/favorites/${id}/alert`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threshold }),
  });
}

export async function deleteFavorite(id: string): Promise<void> {
  await fetch(`${API_URL}/api/favorites/${id}`, { method: "DELETE" });
}

export async function registerPushToken(token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/push-tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
    // Melhor esforço: se o backend estiver fora do ar, o app segue funcionando
    // normalmente, só sem alertas por push até o próximo registro bem-sucedido.
  }
}
