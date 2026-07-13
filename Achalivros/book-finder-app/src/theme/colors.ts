export interface Palette {
  bg: string;
  bgAlt: string;
  fg: string;
  fgMuted: string;
  primary: string;
  accent: string;
  accentFg: string;
  border: string;
  destructive: string;
}

export const lightPalette: Palette = {
  bg: "#FFFBEB",
  bgAlt: "#F5EEDC",
  fg: "#241C15",
  fgMuted: "#6B5C47",
  primary: "#92400E",
  accent: "#D97706",
  accentFg: "#FFFBEB",
  border: "#D8CCA8",
  destructive: "#B3261E",
};

export const darkPalette: Palette = {
  bg: "#1B140D",
  bgAlt: "#241B12",
  fg: "#F3E9D2",
  fgMuted: "#C2AC89",
  primary: "#E8A33D",
  accent: "#E8A33D",
  accentFg: "#1B140D",
  border: "#4A3B28",
  destructive: "#EF5350",
};

export const fonts = {
  display: "AbrilFatface_400Regular",
  body: "Merriweather_400Regular",
  bodyBold: "Merriweather_700Bold",
  bodyItalic: "Merriweather_400Regular_Italic",
};

export const space = {
  1: 4,
  2: 8,
  3: 16,
  4: 24,
  5: 32,
  6: 48,
};

export const radius = 8;
