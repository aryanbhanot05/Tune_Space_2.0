// lib/spotify.ts (minimal search-only version)
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const SCHEME = "tunespace20";           // <-- matches app.json
const CALLBACK_PATH = "auth/callback";
const SCOPES = "user-read-email user-read-private";

const returnUrl = AuthSession.makeRedirectUri({
  scheme: SCHEME,
  path: CALLBACK_PATH,
});

export async function signInWithSpotify(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "spotify",
    options: { scopes: SCOPES, redirectTo: returnUrl, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url!, returnUrl);
  if (result.type !== "success" || !result.url) throw new Error("Spotify auth cancelled");

  const url = new URL(result.url);
  const authCode =
    url.searchParams.get("code") ??
    new URLSearchParams(url.hash.replace(/^#/, "")).get("code");
  if (!authCode) throw new Error("No auth code in callback");

  // If your supabase-js is older, this takes a string:
  const { error: exErr } = await supabase.auth.exchangeCodeForSession(authCode as string);
  if (exErr) throw exErr;
}

export async function ensureSpotifySignedIn() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = (session as any)?.provider_token;
  if (!token) await signInWithSpotify();
}

async function requireSpotifyToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = (session as any)?.provider_token;
  if (!token) throw new Error("Not authenticated with Spotify");
  return token;
}

async function spotifyGet<T = any>(path: string, params?: Record<string, string | number>) {
  const token = await requireSpotifyToken();
  const url = new URL(`https://api.spotify.com/v1${path}`);
  Object.entries(params ?? {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) throw new Error("Spotify token expired (401). Re-auth required.");
  if (!res.ok) throw new Error(`Spotify ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export type SimpleTrack = {
  id: string; name: string; artists: string; album: string;
  image?: string; uri: string; preview_url?: string | null;
};

export async function searchTracks(q: string, limit = 20, offset = 0): Promise<SimpleTrack[]> {
  if (!q.trim()) return [];
  const data = await spotifyGet<any>("/search", {
    q, type: "track", limit, offset, market: "from_token",
  });
  return (data?.tracks?.items ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    artists: (t.artists ?? []).map((a: any) => a.name).join(", "),
    album: t.album?.name ?? "",
    image: t.album?.images?.[0]?.url,
    uri: t.uri,
    preview_url: t.preview_url ?? null,
  }));
}
