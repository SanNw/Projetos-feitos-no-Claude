import "./ErrorState.css";

interface Props {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: Props) {
  return (
    <div className="error-state" role="alert">
      <h2 className="error-state__title">Não foi possível buscar agora</h2>
      <p className="error-state__text">
        As três fontes de livros falharam (rede instável ou fora do ar). Verifique sua conexão e
        tente de novo.
      </p>
      <button type="button" className="error-state__button" onClick={onRetry}>
        Tentar novamente
      </button>
    </div>
  );
}
