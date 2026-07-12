import { listFavorites } from "./cache.js";
import { getCalendar } from "./priceService.js";

/**
 * Job periódico: atualiza o cache das rotas favoritas e verifica se algum preço caiu
 * abaixo do limite definido pelo usuário. Entrega real de push fica a cargo do app
 * (via Expo push notifications) consumindo o resultado retornado aqui; este servidor
 * apenas identifica os "gatilhos" de alerta.
 */
export async function checkFavoriteAlerts(): Promise<
  Array<{ favoriteId: string; origin: string; destination: string; price: number; threshold: number }>
> {
  const favorites = listFavorites().filter((f) => f.alertThreshold !== null);
  const triggered: Array<{ favoriteId: string; origin: string; destination: string; price: number; threshold: number }> = [];

  for (const favorite of favorites) {
    const calendar = await getCalendar(favorite.origin, favorite.destination, 90);
    const lowest = calendar.reduce<number | null>(
      (min, day) => (min === null || day.price < min ? day.price : min),
      null
    );
    if (lowest !== null && favorite.alertThreshold !== null && lowest <= favorite.alertThreshold) {
      triggered.push({
        favoriteId: favorite.id,
        origin: favorite.origin,
        destination: favorite.destination,
        price: lowest,
        threshold: favorite.alertThreshold,
      });
    }
  }

  return triggered;
}
