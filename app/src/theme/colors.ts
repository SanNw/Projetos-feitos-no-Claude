import type { PriceTag } from "@/types";

// Paleta com bom contraste em tema claro; cada preço também carrega um selo/ícone
// (ver PriceBadge) para não depender só de cor, conforme requisito de acessibilidade.
export const colors = {
  background: "#0B1220",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F5F9",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  border: "#E2E8F0",
  brand: "#2563EB",

  cheap: "#15803D",
  cheapBg: "#DCFCE7",
  medium: "#B45309",
  mediumBg: "#FEF3C7",
  expensive: "#B91C1C",
  expensiveBg: "#FEE2E2",
};

export const tagMeta: Record<PriceTag, { label: string; icon: string; color: string; bg: string }> = {
  cheap: { label: "Mais barato", icon: "▼", color: colors.cheap, bg: colors.cheapBg },
  medium: { label: "Preço médio", icon: "●", color: colors.medium, bg: colors.mediumBg },
  expensive: { label: "Mais caro", icon: "▲", color: colors.expensive, bg: colors.expensiveBg },
};
