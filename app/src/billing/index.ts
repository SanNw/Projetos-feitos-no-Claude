import type { PurchaseProvider } from "./types";
import { mockProvider } from "./mockProvider";

/**
 * Provider ativo de compras. Hoje é sempre o mock (ver mockProvider.ts) —
 * sem processamento de pagamento real, mas com o fluxo de paywall completo e
 * testável em Expo Go.
 *
 * Para conectar pagamentos de verdade (RevenueCat + App Store/Play Store):
 * 1. `npx expo install expo-dev-client` e `npm install react-native-purchases`
 *    — a partir daqui o app deixa de rodar no Expo Go puro e passa a precisar
 *    de um dev client customizado (`npx expo run:ios` / `run:android` ou EAS
 *    Build). Essa é uma mudança de fluxo de desenvolvimento deliberada, então
 *    não foi feita automaticamente aqui.
 * 2. Configure os produtos de assinatura no App Store Connect e no Google
 *    Play Console, e o projeto correspondente no dashboard da RevenueCat.
 * 3. Implemente um `revenueCatProvider.ts` seguindo a interface
 *    `PurchaseProvider` (types.ts) e troque a exportação abaixo.
 */
export const provider: PurchaseProvider = mockProvider;

export type { PurchaseProvider, Offerings, PurchasePackage } from "./types";
