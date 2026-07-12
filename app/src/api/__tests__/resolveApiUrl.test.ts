import Constants from "expo-constants";
import { DEFAULT_API_URL, resolveApiUrl } from "../resolveApiUrl";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: {}, hostUri: undefined } },
}));

function setExpoConfig(extra: Record<string, unknown>, hostUri?: string) {
  (Constants as unknown as { expoConfig: unknown }).expoConfig = { extra, hostUri };
}

describe("resolveApiUrl", () => {
  const originalDev = (global as { __DEV__?: boolean }).__DEV__;

  afterEach(() => {
    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
  });

  it("usa a URL configurada quando é diferente do placeholder padrão (ex.: backend hospedado)", () => {
    setExpoConfig({ apiUrl: "https://api.minhaapp.com" }, "192.168.1.5:8081");
    expect(resolveApiUrl()).toBe("https://api.minhaapp.com");
  });

  it("em dev, deriva o host do Metro bundler quando apiUrl está no placeholder padrão", () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;
    setExpoConfig({ apiUrl: DEFAULT_API_URL }, "10.0.2.2:8081"); // ex.: emulador Android
    expect(resolveApiUrl()).toBe("http://10.0.2.2:4000");
  });

  it("em dev, funciona igual com o IP de um dispositivo físico na rede local", () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;
    setExpoConfig({ apiUrl: DEFAULT_API_URL }, "192.168.0.42:8081");
    expect(resolveApiUrl()).toBe("http://192.168.0.42:4000");
  });

  it("cai no placeholder padrão quando não há hostUri disponível", () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;
    setExpoConfig({ apiUrl: DEFAULT_API_URL }, undefined);
    expect(resolveApiUrl()).toBe(DEFAULT_API_URL);
  });

  it("fora de dev, não tenta derivar do Metro mesmo com hostUri presente", () => {
    (global as { __DEV__?: boolean }).__DEV__ = false;
    setExpoConfig({ apiUrl: DEFAULT_API_URL }, "10.0.2.2:8081");
    expect(resolveApiUrl()).toBe(DEFAULT_API_URL);
  });
});
