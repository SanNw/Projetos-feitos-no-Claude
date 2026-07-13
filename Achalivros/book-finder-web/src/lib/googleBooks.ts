import type { BookResult } from "../types";

interface GoogleVolume {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    infoLink?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
  accessInfo?: {
    epub?: { isAvailable?: boolean; downloadLink?: string };
    pdf?: { isAvailable?: boolean; downloadLink?: string };
  };
}

interface GoogleBooksResponse {
  items?: GoogleVolume[];
}

function toHttps(url: string | undefined): string | undefined {
  return url?.replace(/^http:\/\//, "https://");
}

export async function searchGoogleBooks(
  query: string,
  maxResults = 20,
): Promise<BookResult[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
  });
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  if (apiKey) params.set("key", apiKey);

  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
  );
  if (!res.ok) throw new Error(`Google Books API respondeu ${res.status}`);
  const data: GoogleBooksResponse = await res.json();

  return (data.items ?? []).map((item): BookResult => {
    const info = item.volumeInfo ?? {};
    return {
      id: `google:${item.id}`,
      source: "google",
      title: info.title ?? "Título desconhecido",
      authors: info.authors ?? [],
      publishedDate: info.publishedDate,
      description: info.description,
      thumbnail: toHttps(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
      infoLink: toHttps(info.infoLink) ?? `https://books.google.com/books?id=${item.id}`,
      downloads: {
        epub: item.accessInfo?.epub?.isAvailable ? toHttps(item.accessInfo.epub.downloadLink) : undefined,
        pdf: item.accessInfo?.pdf?.isAvailable ? toHttps(item.accessInfo.pdf.downloadLink) : undefined,
      },
    };
  });
}
