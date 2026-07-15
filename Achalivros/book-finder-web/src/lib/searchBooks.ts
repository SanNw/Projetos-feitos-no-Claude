import type { BookResult, BookSource } from "../types";
import { searchGoogleBooks } from "./googleBooks";
import { searchLibgen } from "./libgen";
import { searchOpenLibrary } from "./openLibrary";
import { searchGutenberg } from "./gutendex";
import { searchInternetArchive } from "./internetArchive";
import { searchStandardEbooks } from "./standardEbooks";

export interface SearchBooksResult {
  results: BookResult[];
  /** Sources that errored out — the search still returns whatever succeeded. */
  failedSources: BookSource[];
}

function normalizeAuthor(name: string): string {
  return name
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

function normalizeKey(book: BookResult): string {
  return `${book.title.trim().toLowerCase()}|${normalizeAuthor(book.authors[0] ?? "")}`;
}

/** Concatenates candidate links from both duplicates, de-duplicated, order preserved. */
function mergeDownloadLinks(a?: string[], b?: string[]): string[] | undefined {
  const merged = [...(a ?? []), ...(b ?? [])];
  const unique = Array.from(new Set(merged));
  return unique.length > 0 ? unique : undefined;
}

/** Same idea as mergeDownloadLinks, capped so a title tagged by multiple sources doesn't balloon into a wall of chips. */
function mergeCategories(a?: string[], b?: string[]): string[] | undefined {
  const merged = [...(a ?? []), ...(b ?? [])];
  const unique = Array.from(new Set(merged));
  return unique.length > 0 ? unique.slice(0, 5) : undefined;
}

function mergeBook(into: BookResult, from: BookResult): BookResult {
  return {
    ...into,
    thumbnail: into.thumbnail ?? from.thumbnail,
    description: into.description ?? from.description,
    publishedDate: into.publishedDate ?? from.publishedDate,
    language: into.language ?? from.language,
    categories: mergeCategories(into.categories, from.categories),
    downloads: {
      epub: mergeDownloadLinks(into.downloads?.epub, from.downloads?.epub),
      pdf: mergeDownloadLinks(into.downloads?.pdf, from.downloads?.pdf),
    },
  };
}


export async function searchBooks(query: string): Promise<SearchBooksResult> {
  const sources: { name: BookSource; run: () => Promise<BookResult[]> }[] = [
    { name: "gutenberg", run: () => searchGutenberg(query) },
    { name: "archive", run: () => searchInternetArchive(query) },
    { name: "standardebooks", run: () => searchStandardEbooks(query) },
    { name: "libgen", run: () => searchLibgen(query) },
    { name: "google", run: () => searchGoogleBooks(query) },
    { name: "openlibrary", run: () => searchOpenLibrary(query) },

    // ─────────────────────────────────────────────────────────────────────
    // NOVA FONTE DE DOMÍNIO PÚBLICO: registre aqui (ex.: HathiTrust,
    // Wikisource, Domínio Público...). Passo a passo:.
    //   1. Importe a função no topo deste arquivo e adicione
    //      `{ name: "suaFonte", run: () => search<SuaFonte>(query) }` nesta
    //      lista.
    //   2. Adicione o nome em `BookSource` (`src/types.ts`) e um rótulo em
    //      `SOURCE_LABEL` (`src/components/BookCard.tsx` e `BookList.tsx`).
    // Nenhuma outra mudança é necessária: dedupe (`normalizeKey`), o merge
    // de links (`mergeDownloadLinks`) e a verificação automática de link
    // quebrado (`findWorkingLink`, em `downloadLinkCheck.ts`) já consideram
    // qualquer quantidade de fontes.
    // ─────────────────────────────────────────────────────────────────────
  ];

  const settled = await Promise.allSettled(
    sources.map((source) => source.run())
  );

  const results: BookResult[] = [];
  const byKey = new Map<string, BookResult>();
  const failedSources: BookSource[] = [];

  settled.forEach((outcome, i) => {
    if (outcome.status === "rejected") {
      failedSources.push(sources[i].name);
      return;
    }

    for (const book of outcome.value) {
      const key = normalizeKey(book);
      const existing = byKey.get(key);

      if (existing) {
        const merged = mergeBook(existing, book);
        byKey.set(key, merged);
        results[results.indexOf(existing)] = merged;
      } else {
        byKey.set(key, book);
        results.push(book);
      }
    }
  });

  return {
    results,
    failedSources,
  };
}