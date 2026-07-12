import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { provider, type Offerings, type PurchasePackage } from "@/billing";

interface PremiumContextValue {
  isPremium: boolean;
  loading: boolean;
  offerings: Offerings | null;
  purchase: (identifier: PurchasePackage["identifier"]) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue | undefined>(undefined);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offerings, setOfferings] = useState<Offerings | null>(null);

  const refresh = useCallback(async () => {
    const [premium, offers] = await Promise.all([provider.isPremium(), provider.getOfferings()]);
    setIsPremium(premium);
    setOfferings(offers);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const purchase = async (identifier: PurchasePackage["identifier"]) => {
    const success = await provider.purchase(identifier);
    if (success) setIsPremium(true);
    return success;
  };

  const restore = async () => {
    const restored = await provider.restorePurchases();
    setIsPremium(restored);
    return restored;
  };

  const value = useMemo(
    () => ({ isPremium, loading, offerings, purchase, restore, refresh }),
    [isPremium, loading, offerings]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium deve ser usado dentro de PremiumProvider");
  return ctx;
}
