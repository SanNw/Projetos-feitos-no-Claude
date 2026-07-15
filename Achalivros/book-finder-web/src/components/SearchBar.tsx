import { useId, useState } from "react";
import "./SearchBar.css";

interface Props {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: Props) {
  const [value, setValue] = useState("");
  const inputId = useId();

  return (
    <form
      className="search-bar"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value);
      }}
    >
      <label htmlFor={inputId} className="search-bar__label">
        Título, autor ou assunto
      </label>
      <div className="search-bar__row">
        <input
          id={inputId}
          type="search"
          className="search-bar__input"
          placeholder="Ex.: Machado de Assis, Dom Casmurro…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="search-bar__button" disabled={isLoading || !value.trim()}>
          {isLoading ? "Buscando…" : "Buscar"}
        </button>
      </div>
    </form>
  );
}
