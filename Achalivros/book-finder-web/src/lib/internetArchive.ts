import type { BookResult } from "../types";
import { normalize } from "./textMatch";
import { normalizeLanguageCode } from "./languages";

interface IASearchDoc {
  identifier: string;
  title?: string;
  creator?: string | string[];
  year?: string;
  "access-restricted-item"?: string;
  format?: string[];
  language?: string | string[];
  subject?: string | string[];
}

interface IASearchResponse {
  response?: { docs?: IASearchDoc[] };
}

interface IAFile {
  name: string;
  format?: string;
}

interface IAMetadata {
  metadata?: { "access-restricted-item"?: string };
  files?: IAFile[];
}

const EPUB_FORMAT = "EPUB";
const PDF_FORMATS = new Set(["PDF", "Text PDF"]);

function isOpenAccess(restricted?: string): boolean {
  return restricted !== "true";
}

function toAuthors(creator: string | string[] | undefined): string[] {
  if (!creator) return [];
  return Array.isArray(creator) ? creator : [creator];
}

function firstOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toCategories(subject: string | string[] | undefined): string[] | undefined {
  if (!subject) return undefined;
  const list = Array.isArray(subject) ? subject : [subject];
  return list.slice(0, 3);
}

const GENERIC_STOPWORDS = new Set(["a", "an", "the", "of", "and", "or", "e", "de", "da", "do", "la", "le", "el"]);

/**
 * A busca da IA (`advancedsearch.php`) casa por texto livre — inclui OCR,
 * descrição, coleção etc., não só título/autor. Isso deixa passar itens sem
 * nenhuma relação real com a busca (ex: um upload de terceiros cujo
 * `creator` é uma URL genérica, "casando" só porque a descrição do item
 * menciona o nome buscado de passagem). Exigir que as palavras da busca
 * apareçam de fato no título ou autor do item corta esse ruído.
 */
function matchesQuery(query: string, doc: IASearchDoc): boolean {
  const words = normalize(query)
    .split(" ")
    .filter((word) => word.length > 1 && !GENERIC_STOPWORDS.has(word));
  if (words.length === 0) return true;

  const haystack = normalize(`${doc.title ?? ""} ${toAuthors(doc.creator).join(" ")}`);
  return words.every((word) => haystack.includes(word));
}

/**
 * The search index doesn't expose real per-file names (they're set by
 * whoever uploaded the scan, not derived from the identifier), so we can't
 * build a download URL by guessing. This confirms the item is still open
 * access and finds its actual EPUB/PDF file name via the metadata API.
 */
async function resolveDownloads(identifier: string): Promise<BookResult["downloads"] | undefined> {
  const res = await fetch(`https://archive.org/metadata/${identifier}`);
  if (!res.ok) return undefined;
  const data: IAMetadata = await res.json();
  if (!isOpenAccess(data.metadata?.["access-restricted-item"])) return undefined;

  const files = data.files ?? [];
  const epubFile = files.find((f) => f.format === EPUB_FORMAT);
  const pdfFile = files.find((f) => f.format && PDF_FORMATS.has(f.format));
  if (!epubFile && !pdfFile) return undefined;

  // File names are set by whoever uploaded the scan — often with spaces,
  // accents, commas, parentheses — so they need percent-encoding to be a
  // valid URL.
  return {
    epub: epubFile
      ? [`https://archive.org/download/${identifier}/${encodeURIComponent(epubFile.name)}`]
      : undefined,
    pdf: pdfFile
      ? [`https://archive.org/download/${identifier}/${encodeURIComponent(pdfFile.name)}`]
      : undefined,
  };
}

/**
 * Internet Archive's "texts" collection — millions of scanned books, but
 * most are lending-only (Controlled Digital Lending: a DRM'd, time-limited
 * borrow — not a real download, even though "EPUB"/"PDF" still show up in
 * their format list as "LCP/ACS Encrypted"). The search index's
 * `access-restricted-item` flag is archive.org's own gate for that
 * distinction, so results are filtered on it — twice, once from the search
 * index and again from the per-item metadata — before we ever consider
 * offering a download. Same rule as every other source here: never a link
 * for a restricted/commercial work.
 *
 * Confirming a real, unencrypted EPUB/PDF exists (and getting its exact
 * file name) needs one extra `metadata` call per candidate, since names
 * aren't predictable from the identifier. Done in parallel and only for a
 * pre-filtered shortlist, so it doesn't meaningfully slow the search down.
 * Items with no downloadable file after that check are dropped entirely —
 * Open Library already covers "just metadata, no download" territory.
 */
export async function searchInternetArchive(
  query: string,
  limit = 12,
): Promise<BookResult[]> {
  const params = new URLSearchParams({
    q: `${query} AND mediatype:texts`,
    output: "json",
    rows: "40",
  });
  ["identifier", "title", "creator", "year", "access-restricted-item", "format", "language", "subject"].forEach((f) =>
    params.append("fl[]", f),
  );

  const res = await fetch(`https://archive.org/advancedsearch.php?${params.toString()}`);
  if (!res.ok) throw new Error(`Internet Archive respondeu ${res.status}`);
  const data: IASearchResponse = await res.json();
  const docs = data.response?.docs ?? [];

  const candidates = docs
    .filter((doc) => isOpenAccess(doc["access-restricted-item"]))
    .filter((doc) => (doc.format ?? []).some((f) => f === EPUB_FORMAT || PDF_FORMATS.has(f)))
    .filter((doc) => matchesQuery(query, doc))
    .slice(0, limit);

  const resolved = await Promise.allSettled(
    candidates.map(async (doc): Promise<BookResult | undefined> => {
      const downloads = await resolveDownloads(doc.identifier);
      if (!downloads) return undefined;
      return {
        id: `archive:${doc.identifier}`,
        source: "archive",
        title: doc.title ?? "Título desconhecido",
        authors: toAuthors(doc.creator),
        publishedDate: doc.year,
        thumbnail: `https://archive.org/services/img/${doc.identifier}`,
        language: firstOf(doc.language) ? normalizeLanguageCode(firstOf(doc.language)!) : undefined,
        categories: toCategories(doc.subject),
        infoLink: `https://archive.org/details/${doc.identifier}`,
        downloads,
      };
    }),
  );

  return resolved
    .filter((r): r is PromiseFulfilledResult<BookResult | undefined> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((book): book is BookResult => book !== undefined);
}
