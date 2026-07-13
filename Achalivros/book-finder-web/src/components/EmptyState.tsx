import "./EmptyState.css";

interface Props {
  variant: "initial" | "no-results";
  query?: string;
}

export function EmptyState({ variant, query }: Props) {
  return (
    <div className="empty-state" role="status">
      <svg
        className="empty-state__ornament"
        viewBox="0 0 24 24"
        width="40"
        height="40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M2 5.5c2.5-1.3 5.2-1.3 8 0v13c-2.8-1.3-5.5-1.3-8 0v-13Z" />
        <path d="M22 5.5c-2.5-1.3-5.2-1.3-8 0v13c2.8-1.3 5.5-1.3 8 0v-13Z" />
      </svg>
      {variant === "initial" ? (
        <>
          <h2 className="empty-state__title">Comece uma busca</h2>
          <p className="empty-state__text">
            Digite um título, autor ou assunto acima para encontrar livros — com capa, edição e
            downloads gratuitos em PDF/EPUB quando disponíveis.
          </p>
        </>
      ) : (
        <>
          <h2 className="empty-state__title">Nenhum livro encontrado</h2>
          <p className="empty-state__text">
            Não encontramos resultados para "{query}". Tente outro título, autor ou termo mais
            geral.
          </p>
        </>
      )}
    </div>
  );
}
