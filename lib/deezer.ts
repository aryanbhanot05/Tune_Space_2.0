// Minimal helper for Deezer Simple API (search + browse).
// Works natively (direct) and on web via an optional proxy (Supabase Edge Function).

const DEEZER_BASE = "https://api.deezer.com";

const FUNCTIONS_BASE = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL || "";

const USE_PROXY = !!FUNCTIONS_BASE;


//Used AI here — Prompt: How to build a URL with optional path and query parameters.
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
//Used AI here Prompt: How can I get Deezer search to work for web and native in Expo/React Native?

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
