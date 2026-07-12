import { listFavorites, listPushTokens, markFavoriteNotified, resetFavoriteAlertState } from "./cache.js";
import { getCalendar } from "./priceService.js";
import { sendPushNotifications } from "./pushNotifications.js";
import { formatBRL } from "../utils/currency.js";

export interface TriggeredAlert {
  favoriteId: string;
  origin: string;
  destination: string;
  price: number;
  threshold: number;
}

/**
 * Job periódico: atualiza o cache das rotas favoritas, identifica alertas de preço
 * disparados e envia push (Expo Push API) para os dispositivos registrados.
 *
 * Debounce: só reenvia notificação para a mesma rota se o preço mais barato caiu
 * ainda mais desde o último push enviado (`last_alert_price`). Se o preço volta a
 * ficar acima do limite, o estado é resetado para que a próxima queda notifique
 * de novo.
 */
export async function checkFavoriteAlerts(): Promise<TriggeredAlert[]> {
  const favorites = listFavorites().filter((f) => f.alertThreshold !== null);
  const triggered: TriggeredAlert[] = [];

  for (const favorite of favorites) {
    const threshold = favorite.alertThreshold as number;
    const calendar = await getCalendar(favorite.origin, favorite.destination, 90);
    const lowest = calendar.reduce<number | null>(
      (min, day) => (min === null || day.price < min ? day.price : min),
      null
    );
    if (lowest === null) continue;

    if (lowest > threshold) {
      if (favorite.lastAlertPrice != null) resetFavoriteAlertState(favorite.id);
      continue;
    }

    triggered.push({ favoriteId: favorite.id, origin: favorite.origin, destination: favorite.destination, price: lowest, threshold });

    const alreadyNotifiedForThisPrice = favorite.lastAlertPrice != null && lowest >= favorite.lastAlertPrice;
    if (alreadyNotifiedForThisPrice) continue;

    const tokens = listPushTokens();
    if (tokens.length > 0) {
      await sendPushNotifications(
        tokens.map((token) => ({
          to: token,
          title: "Preço baixou! ✈️",
          body: `${favorite.origin} → ${favorite.destination} agora por ${formatBRL(lowest)} (seu limite: ${formatBRL(threshold)})`,
          data: { favoriteId: favorite.id, origin: favorite.origin, destination: favorite.destination },
        }))
      );
    }
    markFavoriteNotified(favorite.id, lowest);
  }

  return triggered;
}
