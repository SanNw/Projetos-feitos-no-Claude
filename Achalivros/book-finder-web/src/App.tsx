import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { BookList } from "./components/BookList";
import { useBookSearch } from "./hooks/useBookSearch";

export default function App() {
  const { status, results, failedSources, query, search } = useBookSearch();

  return (
    <>
      <Header />
      <SearchBar onSearch={search} isLoading={status === "loading"} />
      <BookList
        status={status}
        results={results}
        query={query}
        failedSources={failedSources}
        onRetry={() => search(query)}
      />
    </>
  );
}
