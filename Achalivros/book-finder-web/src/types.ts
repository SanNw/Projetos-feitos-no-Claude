// Para adicionar uma nova fonte de livros de domínio público, veja o
// comentário no array `sources` em `src/lib/searchBooks.ts` — é lá que uma
// nova API é registrada, junto com o passo a passo completo.
export type BookSource = "gutenberg" | "google" | "openlibrary" | "archive" | "standardebooks" | "libgen";

export interface BookResult {
  /** Stable key across renders: `${source}:${sourceId}` */
  id: string;
  source: BookSource;
  title: string;
  authors: string[];
  publishedDate?: string;
  description?: string;
  /** Cover image URL, if the source has one. */
  thumbnail?: string;
  /** ISO 639-1 code (e.g. "en", "pt"), normalized from whatever the source uses — see src/lib/languages.ts. */
  language?: string;
  /** Subject/genre tags, as reported by the source. */
  categories?: string[];
  /** External link with more information about the book (bonus feature). */
  infoLink: string;
  downloads?: {
    epub?: string[];
    pdf?: string[];
  };
}
