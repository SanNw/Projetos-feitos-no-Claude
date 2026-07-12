export interface PurchasePackage {
  identifier: "monthly" | "annual";
  title: string;
  priceLabel: string;
  /** Só para o pacote anual: texto de economia comparado a 12x o mensal. */
  savingsLabel?: string;
}

export interface Offerings {
  monthly: PurchasePackage;
  annual: PurchasePackage;
}

/**
 * Contrato que qualquer provedor de compras (mock ou real) precisa implementar.
 * Ver billing/index.ts para qual implementação está ativa e por quê.
 */
export interface PurchaseProvider {
  name: string;
  getOfferings(): Promise<Offerings>;
  isPremium(): Promise<boolean>;
  purchase(identifier: PurchasePackage["identifier"]): Promise<boolean>;
  restorePurchases(): Promise<boolean>;
}
