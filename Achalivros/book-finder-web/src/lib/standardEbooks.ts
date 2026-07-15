import type { BookResult } from "../types";

const BASE_URL = "https://standardebooks.org";


export async function searchStandardEbooks(
  query: string,
  limit = 20,
): Promise<BookResult[]> {
  const params = new URLSearchParams({ query, "per-page": String(limit) });
  const res = await fetch(`${BASE_URL}/ebooks?${params.toString()}`);
  if (!res.ok) throw new Error(`Standard Ebooks respondeu ${res.status}`);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  return Array.from(doc.querySelectorAll('li[typeof="schema:Book"]')).map((li): BookResult => {
    const slug = li.getAttribute("about") ?? "";
    const title = li.querySelector('[property="schema:name"]')?.textContent?.trim() ?? "Título desconhecido";
    const author = li.querySelector(".author")?.textContent?.trim();
    const cover = li.querySelector("img")?.getAttribute("src");
    const filename = slug.replace(/^\/ebooks\//, "").replace(/\//g, "_");

    return {
      id: `standardebooks:${slug}`,
      source: "standardebooks",
      title,
      authors: author ? [author] : [],
      thumbnail: cover ? `${BASE_URL}${cover}` : undefined,
      // Standard Ebooks only publishes English-language editions (originals
      // and translations alike) — there's no per-item language field to read.
      language: "en",
      infoLink: `${BASE_URL}${slug}`,
      downloads: {
        epub: filename ? [`${BASE_URL}${slug}/downloads/${filename}.epub`] : undefined,
      },
    };
  });
}
