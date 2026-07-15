import type { BookResult } from "../types";
import { normalizeLanguageCode } from "./languages";

interface GutendexAuthor {
  name: string;
}

interface GutendexBook {
  id: number;
  title: string;
  authors?: GutendexAuthor[];
  formats?: Record<string, string>;
  languages?: string[];
  subjects?: string[];
}

interface GutendexResponse {
  results?: GutendexBook[];
}

/**
 * Project Gutenberg, via the free public Gutendex API (gutendex.com) — no key
 * required. Every result here is public domain, so it always has a real
 * direct EPUB/PDF download link (unlike Google Books/Open Library, where a
 * download is the exception, not the rule).
 */
export async function searchGutenberg(
  query: string,
  limit = 20,
): Promise<BookResult[]> {
  const params = new URLSearchParams({ search: query });
  const res = await fetch(`https://gutendex.com/books?${params.toString()}`);
  if (!res.ok) throw new Error(`Gutendex respondeu ${res.status}`);
  const data: GutendexResponse = await res.json();

  return (data.results ?? []).slice(0, limit).map((book): BookResult => {
    const formats = book.formats ?? {};
    return {
      id: `gutenberg:${book.id}`,
      source: "gutenberg",
      title: book.title,
      authors: (book.authors ?? []).map((a) => a.name),
      thumbnail: formats["image/jpeg"],
      language: book.languages?.[0] ? normalizeLanguageCode(book.languages[0]) : undefined,
      categories: book.subjects?.slice(0, 3),
      infoLink: `https://www.gutenberg.org/ebooks/${book.id}`,
      downloads: {
        epub: formats["application/epub+zip"] ? [formats["application/epub+zip"]] : undefined,
        pdf: formats["application/pdf"] ? [formats["application/pdf"]] : undefined,
      },
    };
  });
}
