import type { BookResult, BookSource } from "@/types";
import { searchGoogleBooks } from "./googleBooks";
import { searchOpenLibrary } from "./openLibrary";
import { searchGutenberg } from "./gutendex";

export interface SearchBooksResult {
  results: BookResult[];
  /** Sources that errored out — the search still returns whatever succeeded. */
  failedSources: BookSource[];
}

function normalizeKey(book: BookResult): string {
  return `${book.title.trim().toLowerCase()}|${(book.authors[0] ?? "").trim().toLowerCase()}`;
}

/**
 * Gutenberg is listed first: it's the only source that can always back up
 * "PDF e EPUB" with a real, legal direct download (public domain). Google
 * Books/Open Library follow for broader catalog coverage and cover art.
 */
export async function searchBooks(query: string): Promise<SearchBooksResult> {
  const sources: { name: BookSource; run: () => Promise<BookResult[]> }[] = [
    { name: "gutenberg", run: () => searchGutenberg(query) },
    { name: "google", run: () => searchGoogleBooks(query) },
    { name: "openlibrary", run: () => searchOpenLibrary(query) },
  ];

  const settled = await Promise.allSettled(sources.map((s) => s.run()));

  const results: BookResult[] = [];
  const seen = new Set<string>();
  const failedSources: BookSource[] = [];

  settled.forEach((outcome, i) => {
    if (outcome.status === "rejected") {
      failedSources.push(sources[i].name);
      return;
    }
    for (const book of outcome.value) {
      const key = normalizeKey(book);
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(book);
    }
  });

  return { results, failedSources };
}
