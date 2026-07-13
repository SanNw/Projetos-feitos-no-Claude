import { ThemeToggle } from "./ThemeToggle";
import "./Header.css";

export function Header() {
  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__ornament" aria-hidden="true">
          ✦
        </span>
        <div>
          <h1 className="header__title">Achalivros</h1>
          <p className="header__subtitle">Book Finder — ache livros, capas e leituras grátis</p>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
