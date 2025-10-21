// Minimal helper for Deezer Simple API (search + browse).
// Works natively (direct) and on web via an optional proxy (Supabase Edge Function).

const DEEZER_BASE = "https://api.deezer.com";

// If you set this env, we’ll use it on all platforms (needed for Web due to CORS).
// Example: http://127.0.0.1:54321/functions/v1  (local)
//          https://<your-ref>.functions.supabase.co (prod)
const FUNCTIONS_BASE = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL || "";

const USE_PROXY = !!FUNCTIONS_BASE;

function buildUrl(base: string, pathOrEmpty: string, params?: Record<string, any>) {
  const clean = pathOrEmpty.replace(/^\/+/, "");
  const qs = params
    ? "?" +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  // handle base only (for proxy route with ?path=... only)
  return clean ? `${base}/${clean}${qs}` : `${base}${qs}`;
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Public API

export async function searchTracks(q: string, limit = 12, index = 0) {
  if (USE_PROXY) {
    // Expect a Supabase Edge Function named "deezer-proxy" that forwards to api.deezer.com
    const url = buildUrl(`${FUNCTIONS_BASE}/deezer-proxy`, "", { path: "search/track", q, limit, index });
    return fetchJson(url);
  } else {
    // Direct (works on iOS/Android; on Web you’ll hit CORS if you don’t use a proxy)
    const url = buildUrl(DEEZER_BASE, "search/track", { q, limit, index });
    return fetchJson(url);
  }
}
