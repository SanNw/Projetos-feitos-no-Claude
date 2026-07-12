import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Offerings, PurchaseProvider } from "./types";
import { ANNUAL_PRICE_LABEL, ANNUAL_SAVINGS_LABEL, MONTHLY_PRICE_LABEL } from "./constants";

const STORAGE_KEY = "@monitor-passagens/is-premium";

/**
 * Provider padrão (e único ativo hoje — ver index.ts): simula compras sem
 * nenhuma dependência nativa, então roda em Expo Go sem restrição. "Assinar"
 * marca um flag local como premium; não processa pagamento de verdade.
 * Existe para o paywall funcionar e ser demonstrável fim-a-fim antes de uma
 * integração real (RevenueCat) ser conectada.
 */
export const mockProvider: PurchaseProvider = {
  name: "mock",

  async getOfferings(): Promise<Offerings> {
    return {
      monthly: { identifier: "monthly", title: "Mensal", priceLabel: MONTHLY_PRICE_LABEL },
      annual: {
        identifier: "annual",
        title: "Anual",
        priceLabel: ANNUAL_PRICE_LABEL,
        savingsLabel: ANNUAL_SAVINGS_LABEL,
      },
    };
  },

  async isPremium(): Promise<boolean> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw === "true";
  },

  async purchase(): Promise<boolean> {
    // Simula latência de uma compra real para a UI de loading fazer sentido.
    await new Promise((resolve) => setTimeout(resolve, 600));
    await AsyncStorage.setItem(STORAGE_KEY, "true");
    return true;
  },

  async restorePurchases(): Promise<boolean> {
    return mockProvider.isPremium();
  },
};

/** Só para a tela de paywall oferecer um jeito de desfazer a simulação em dev. */
export async function mockSetPremium(value: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, value ? "true" : "false");
}
