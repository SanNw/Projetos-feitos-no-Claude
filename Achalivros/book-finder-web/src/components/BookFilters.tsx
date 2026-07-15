import { useMemo } from "react";
import type { BookResult } from "../types";
import { languageName } from "../lib/languages";
import "./BookFilters.css";

interface Props {
  results: BookResult[];
  language: string;
  category: string;
  onLanguageChange: (language: string) => void;
  onCategoryChange: (category: string) => void;
}

export function BookFilters({ results, language, category, onLanguageChange, onCategoryChange }: Props) {
  const languages = useMemo(() => {
    const codes = new Set(results.map((b) => b.language).filter((l): l is string => Boolean(l)));
    return Array.from(codes).sort((a, b) => languageName(a).localeCompare(languageName(b), "pt"));
  }, [results]);

  const categories = useMemo(() => {
    const names = new Set(results.flatMap((b) => b.categories ?? []));
    return Array.from(names).sort((a, b) => a.localeCompare(b, "pt"));
  }, [results]);

  if (languages.length < 2 && categories.length < 2) return null;

  return (
    <div className="book-filters" role="group" aria-label="Filtrar resultados">
      {languages.length > 1 && (
        <label className="book-filters__field">
          <span>Idioma</span>
          <select value={language} onChange={(e) => onLanguageChange(e.target.value)}>
            <option value="">Todos</option>
            {languages.map((code) => (
              <option key={code} value={code}>
                {languageName(code)}
              </option>
            ))}
          </select>
        </label>
      )}
      {categories.length > 1 && (
        <label className="book-filters__field">
          <span>Categoria</span>
          <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
            <option value="">Todas</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
