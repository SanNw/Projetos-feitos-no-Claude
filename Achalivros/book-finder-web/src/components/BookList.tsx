import { useEffect, useMemo, useState } from "react";
import type { BookResult, BookSource } from "../types";
import type { SearchStatus } from "../hooks/useBookSearch";
import { BookCard } from "./BookCard";
import { BookFilters } from "./BookFilters";
import { SkeletonCard } from "./SkeletonCard";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import "./BookList.css";

const SOURCE_LABEL: Record<BookSource, string> = {
  gutenberg: "Project Gutenberg",
  archive: "Internet Archive",
  standardebooks: "Standard Ebooks",
  libgen: "Library Genesis",
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
  const [language, setLanguage] = useState("");
  const [category, setCategory] = useState("");

  // A new search invalidates whatever filters were picked for the previous one.
  useEffect(() => {
    setLanguage("");
    setCategory("");
  }, [query]);

  const filteredResults = useMemo(
    () =>
      results.filter((book) => {
        if (language && book.language !== language) return false;
        if (category && !(book.categories ?? []).includes(category)) return false;
        return true;
      }),
    [results, language, category],
  );

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

      {status === "success" && results.length > 0 && (
        <BookFilters
          results={results}
          language={language}
          category={category}
          onLanguageChange={setLanguage}
          onCategoryChange={setCategory}
        />
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

      {status === "success" && results.length > 0 && filteredResults.length === 0 && (
        <p className="book-list__warning" role="status">
          Nenhum resultado para os filtros selecionados.
        </p>
      )}

      {status === "success" && filteredResults.length > 0 && (
        <ul className="book-list">
          {filteredResults.map((book) => (
            <li key={book.id}>
              <BookCard book={book} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
