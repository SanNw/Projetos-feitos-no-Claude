// Sources disagree on how they encode language: Gutendex/Google Books use
// ISO 639-1 ("en", "pt"), Open Library uses ISO 639-2/B ("eng", "por"), and
// Internet Archive's metadata is free text, often the full English name
// ("English", "Portuguese"). Everything is normalized to ISO 639-1 so
// dedup/merge and the language filter can compare codes directly.

const ISO_639_2_TO_1: Record<string, string> = {
  eng: "en", por: "pt", spa: "es", fre: "fr", fra: "fr", ger: "de", deu: "de",
  ita: "it", lat: "la", gre: "el", grc: "el", rus: "ru", chi: "zh", zho: "zh",
  jpn: "ja", ara: "ar", heb: "he", dut: "nl", nld: "nl", swe: "sv", nor: "no",
  dan: "da", fin: "fi", pol: "pl", tur: "tr", hin: "hi", kor: "ko", cze: "cs",
  ces: "cs", ukr: "uk", rum: "ro", ron: "ro", cat: "ca",
};

const NAME_TO_CODE: Record<string, string> = {
  english: "en", portuguese: "pt", spanish: "es", french: "fr", german: "de",
  italian: "it", latin: "la", greek: "el", russian: "ru", chinese: "zh",
  japanese: "ja", arabic: "ar", hebrew: "he", dutch: "nl", swedish: "sv",
  norwegian: "no", danish: "da", finnish: "fi", polish: "pl", turkish: "tr",
  hindi: "hi", korean: "ko", czech: "cs", ukrainian: "uk", romanian: "ro",
  catalan: "ca",
};

export function normalizeLanguageCode(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length === 2) return trimmed;
  return NAME_TO_CODE[trimmed] ?? ISO_639_2_TO_1[trimmed] ?? trimmed;
}

let displayNames: Intl.DisplayNames | undefined;
function getDisplayNames(): Intl.DisplayNames | undefined {
  if (displayNames) return displayNames;
  try {
    displayNames = new Intl.DisplayNames(["pt"], { type: "language" });
  } catch {
    displayNames = undefined;
  }
  return displayNames;
}

/** Human-readable (Portuguese) name for a language code/name from any source. */
export function languageName(code: string): string {
  const normalized = normalizeLanguageCode(code);
  try {
    const name = getDisplayNames()?.of(normalized);
    if (name && name.toLowerCase() !== normalized) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  } catch {
    // Intl.DisplayNames throws for tags it doesn't recognize — fall back below.
  }
  return normalized.toUpperCase();
}
