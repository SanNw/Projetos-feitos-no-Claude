import type { BookResult, BookSource } from "../types";
import type { SearchStatus } from "../hooks/useBookSearch";
import { BookCard } from "./BookCard";
import { SkeletonCard } from "./SkeletonCard";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import "./BookList.css";

const SOURCE_LABEL: Record<BookSource, string> = {
  gutenberg: "Project Gutenberg",
  google: "Google Books",
  openlibrary: "Open Library",
};

interface Props {
  status: SearchStatus;
  results: BookResult[];
  query: string;
  failedSources: BookSource[];
  onRetry: () => void;
}

export function BookList({ status, results, query, failedSources, onRetry }: Props) {
  if (status === "idle") return <EmptyState variant="initial" />;
  if (status === "error") return <ErrorState onRetry={onRetry} />;

  return (
    <div className="book-list-wrap">
      {failedSources.length > 0 && status === "success" && (
        <p className="book-list__warning" role="status">
          {failedSources.map((s) => SOURCE_LABEL[s]).join(", ")} não respondeu desta vez — mostrando
          resultados das demais fontes.
        </p>
      )}

      {status === "loading" && (
        <ul className="book-list" aria-busy="true" aria-label="Buscando livros">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <SkeletonCard />
            </li>
          ))}
        </ul>
      )}

      {status === "success" && results.length === 0 && (
        <EmptyState variant="no-results" query={query} />
      )}

      {status === "success" && results.length > 0 && (
        <ul className="book-list">
          {results.map((book) => (
            <li key={book.id}>
              <BookCard book={book} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
