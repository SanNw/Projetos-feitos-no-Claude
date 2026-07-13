import { useCallback, useRef, useState } from "react";
import type { BookResult, BookSource } from "../types";
import { searchBooks } from "../lib/searchBooks";

export type SearchStatus = "idle" | "loading" | "success" | "error";

interface State {
  status: SearchStatus;
  results: BookResult[];
  failedSources: BookSource[];
  query: string;
}

export function useBookSearch() {
  const [state, setState] = useState<State>({
    status: "idle",
    results: [],
    failedSources: [],
    query: "",
  });
  // Guards against an older in-flight search overwriting a newer one's result.
  const requestId = useRef(0);

  const search = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const id = ++requestId.current;
    setState((prev) => ({ ...prev, status: "loading", query: trimmed }));

    try {
      const { results, failedSources } = await searchBooks(trimmed);
      if (id !== requestId.current) return;
      setState({
        status: results.length > 0 || failedSources.length < 3 ? "success" : "error",
        results,
        failedSources,
        query: trimmed,
      });
    } catch {
      if (id !== requestId.current) return;
      setState((prev) => ({ ...prev, status: "error", results: [], failedSources: ["gutenberg", "google", "openlibrary"] }));
    }
  }, []);

  return { ...state, search };
}
