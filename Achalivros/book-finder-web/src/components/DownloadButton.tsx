import { useState } from "react";
import { findWorkingLink } from "../lib/downloadLinkCheck";

interface Props {
  label: string;
  /** Candidate URLs for this format, ordered by preference — see BookResult.downloads. */
  candidates: string[];
}

type Status = "idle" | "checking" | "unavailable";

/**
 * Renders as a plain link but verifies the download on click instead of
 * navigating straight away: if the first candidate link is dead, it
 * automatically tries the next one (see `findWorkingLink`) before giving up.
 */
export function DownloadButton({ label, candidates }: Props) {
  const [status, setStatus] = useState<Status>("idle");

  if (candidates.length === 0) return null;

  async function handleClick() {
    setStatus("checking");
    const working = await findWorkingLink(candidates);
    if (working) {
      window.open(working, "_blank", "noopener,noreferrer");
      setStatus("idle");
    } else {
      setStatus("unavailable");
      setTimeout(() => setStatus("idle"), 4000);
    }
  }

  return (
    <button
      type="button"
      className="book-card__download"
      onClick={handleClick}
      disabled={status === "checking"}
      aria-busy={status === "checking"}
    >
      {status === "checking" ? "Verificando…" : status === "unavailable" ? "Indisponível" : label}
    </button>
  );
}
