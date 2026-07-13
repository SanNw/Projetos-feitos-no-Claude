import type { BookResult } from "../types";

interface OpenLibraryDoc {
  key: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

interface OpenLibraryResponse {
  docs?: OpenLibraryDoc[];
}

export async function searchOpenLibrary(
  query: string,
  limit = 20,
): Promise<BookResult[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`);
  if (!res.ok) throw new Error(`Open Library respondeu ${res.status}`);
  const data: OpenLibraryResponse = await res.json();

  return (data.docs ?? []).map((doc): BookResult => ({
    id: `openlibrary:${doc.key}`,
    source: "openlibrary",
    title: doc.title ?? "Título desconhecido",
    authors: doc.author_name ?? [],
    publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
    thumbnail: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : undefined,
    infoLink: `https://openlibrary.org${doc.key}`,
  }));
}
