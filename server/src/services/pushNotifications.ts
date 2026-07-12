const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Envia notificações via Expo Push API (https://exp.host). Não requer Firebase/APNs
 * configurados manualmente para funcionar em dev/Expo Go — a Expo intermedia a
 * entrega para os dois sistemas operacionais.
 */
export async function sendPushNotifications(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
    const json = (await res.json()) as { data?: Array<{ status: string; message?: string }> };
    const errors = (json.data ?? []).filter((entry) => entry.status === "error");
    if (errors.length > 0) {
      console.warn(`[push] ${errors.length} notificação(ões) falharam:`, errors.map((e) => e.message));
    }
  } catch (err) {
    console.warn("[push] falha ao chamar a Expo Push API:", (err as Error).message);
  }
}
