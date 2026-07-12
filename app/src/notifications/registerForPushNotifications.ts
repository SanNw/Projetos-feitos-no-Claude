import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { registerPushToken } from "@/api/client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Pede permissão, obtém o Expo push token deste dispositivo e registra no
 * backend (que usa esse token para enviar os alertas de preço via Expo Push
 * API — ver server/src/services/pushNotifications.ts). Falha silenciosamente
 * em qualquer etapa (emulador, permissão negada, backend fora do ar): alertas
 * por push são um extra, nunca devem bloquear o uso do app.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    return null; // notificações push exigem um dispositivo físico
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    await registerPushToken(token);
    return token;
  } catch {
    return null;
  }
}
