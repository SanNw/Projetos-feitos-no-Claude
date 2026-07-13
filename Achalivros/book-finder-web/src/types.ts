export type BookSource = "gutenberg" | "google" | "openlibrary";

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
  /** External link with more information about the book (bonus feature). */
  infoLink: string;
  /** Direct download links — only ever set for legally free/public-domain works. */
  downloads?: {
    epub?: string;
    pdf?: string;
  };
}
