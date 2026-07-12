import Constants from "expo-constants";

export const DEFAULT_API_URL = "http://localhost:4000";
const DEV_API_PORT = 4000;

function getDevServerHost(): string | null {
  // hostUri é o host:porta do Metro que o dispositivo atual já está usando pra
  // se conectar — o mesmo host serve pra falar com o backend, então isso
  // resolve emulador Android (10.0.2.2), simulador iOS (localhost) e
  // dispositivo físico (IP da rede local) automaticamente, sem editar app.json.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  if (!hostUri) return null;
  const host = hostUri.split(":")[0];
  return host || null;
}

/**
 * Resolve a URL da API do backend.
 *
 * - Se `expo.extra.apiUrl` foi configurado para algo diferente do placeholder
 *   padrão (ex.: um backend hospedado em produção), essa configuração sempre
 *   vence, em dev ou produção.
 * - Caso contrário, em desenvolvimento (Expo Go / dev client), deriva o host
 *   a partir do Metro bundler (ver getDevServerHost) — cobre emulador,
 *   simulador e dispositivo físico sem configuração manual.
 * - Fora disso, cai no placeholder padrão (`http://localhost:4000`).
 */
export function resolveApiUrl(): string {
  const configured = Constants.expoConfig?.extra?.apiUrl as string | undefined;

  if (configured && configured !== DEFAULT_API_URL) {
    return configured;
  }

  if (__DEV__) {
    const host = getDevServerHost();
    if (host) return `http://${host}:${DEV_API_PORT}`;
  }

  return configured ?? DEFAULT_API_URL;
}
