import type { BookResult } from "../types";
import "./BookCard.css";

const SOURCE_LABEL: Record<BookResult["source"], string> = {
  gutenberg: "Domínio público",
  google: "Google Books",
  openlibrary: "Open Library",
};

interface Props {
  book: BookResult;
}

export function BookCard({ book }: Props) {
  const authors = book.authors.length > 0 ? book.authors.join(", ") : "Autor desconhecido";

  return (
    <article className="book-card">
      <div className="book-card__cover-wrap">
        {book.thumbnail ? (
          <img
            className="book-card__cover"
            src={book.thumbnail}
            alt={`Capa de ${book.title}`}
            loading="lazy"
            width={128}
            height={192}
          />
        ) : (
          <div className="book-card__cover book-card__cover--placeholder" aria-hidden="true">
            <span>{book.title.slice(0, 1).toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="book-card__body">
        <span className={`book-card__badge book-card__badge--${book.source}`}>
          {SOURCE_LABEL[book.source]}
        </span>
        <h3 className="book-card__title">{book.title}</h3>
        <p className="book-card__meta">
          {authors}
          {book.publishedDate ? ` · ${book.publishedDate}` : ""}
        </p>
        {book.description && <p className="book-card__description">{book.description}</p>}

        <div className="book-card__actions">
          <a
            className="book-card__link"
            href={book.infoLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            Mais informações ↗
          </a>
          {book.downloads?.epub && (
            <a
              className="book-card__download"
              href={book.downloads.epub}
              target="_blank"
              rel="noopener noreferrer"
            >
              EPUB
            </a>
          )}
          {book.downloads?.pdf && (
            <a
              className="book-card__download"
              href={book.downloads.pdf}
              target="_blank"
              rel="noopener noreferrer"
            >
              PDF
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
