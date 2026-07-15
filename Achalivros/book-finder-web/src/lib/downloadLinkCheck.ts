/**
 * Best-effort reachability check for a direct book download link.
 *
 * Caveat: this is a backend-less SPA, so this can only ever be best-effort.
 * Most public-domain hosts (gutenberg.org, archive.org, etc.) don't send
 * CORS headers for a plain `fetch`, so a thrown error here doesn't always
 * mean the link is dead — it can also mean the browser blocked our JS from
 * reading the response. We first try a normal CORS `HEAD` (gives a real
 * status when the host allows it); if that's blocked, we fall back to a
 * `no-cors` `HEAD`, which can't read the status but still surfaces genuine
 * network failures (offline, DNS, connection refused, timeout). This won't
 * catch a host that returns a "soft 404" page under a 200 status, but it
 * does catch the common case of a stale/removed link.
 */
async function isReachable(url: string, timeoutMs = 4000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { method: "HEAD", mode: "cors", signal: controller.signal });
    return res.ok;
  } catch {
    try {
      // Opaque response: we can't read the status, so treat "didn't throw" as reachable.
      await fetch(url, { method: "HEAD", mode: "no-cors", signal: controller.signal });
      return true;
    } catch {
      return false;
    }
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Tries each candidate URL in order (as collected from every source that
 * offered this book/format — see `mergeBook` in `searchBooks.ts`) and
 * returns the first one that responds. Returns `undefined` if none do.
 */
export async function findWorkingLink(candidates: string[]): Promise<string | undefined> {
  for (const url of candidates) {
    if (await isReachable(url)) return url;
  }
  return undefined;
}
