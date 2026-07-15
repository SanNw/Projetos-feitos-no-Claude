import { BookResult } from "../types";
import { normalizeLanguageCode } from "./languages";
interface LibgenBook {
  id?: string;
  title?: string;
  author?: string;
  year?: string;
  language?: string;
  infoLink?: string;
}

export async function searchLibgen(
  query: string,
  limit = 20,
): Promise<BookResult[]> {

  const response = await fetch(
    `http://localhost:3000/api/libgen?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error(`LibGen respondeu ${response.status}`);
  }

  const books = await response.json();

  return books
    .slice(0, limit)
    .map((book: LibgenBook): BookResult => ({

      id: `libgen:${book.id ?? book.infoLink}`,

      source: "libgen",

      title: book.title ?? "Título desconhecido",
     
      authors: book.author
        ? [book.author]
        : [],

      publishedDate: book.year || undefined,

      language: book.language
        ? normalizeLanguageCode(book.language)
        : undefined,

      infoLink: book.infoLink
        ? book.infoLink
        : "#",

    }));
}