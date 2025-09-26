// lib/spotify.ts
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const SCHEME = "tunespace20";
const CALLBACK_PATH = "auth/callback";
const SCOPES = "user-read-email user-read-private";
const isExpoGo = Constants.appOwnership === "expo";

const nativeReturnUrl = isExpoGo
  ? AuthSession.makeRedirectUri({ path: CALLBACK_PATH, useProxy: true } as any)
  : AuthSession.makeRedirectUri({ scheme: SCHEME, path: CALLBACK_PATH });

const webReturnUrl =
  typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : "http://localhost/auth/callback";

export async function signInWithSpotify(): Promise<void> {
  if (Platform.OS === "web") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "spotify",
      options: { redirectTo: webReturnUrl, scopes: SCOPES },
    });
    if (error) throw error;
    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "spotify",
    options: { redirectTo: nativeReturnUrl, scopes: SCOPES, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url!, nativeReturnUrl);
  if (result.type !== "success" || !result.url) throw new Error("Spotify auth cancelled");

  const u = new URL(result.url);
  const code =
    u.searchParams.get("code") ??
    new URLSearchParams(u.hash.replace(/^#/, "")).get("code");

  if (code) {
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(code as string);
    if (exErr) throw exErr;
  }
}

export async function ensureSpotifySignedIn() {
  const { data: { session } } = await supabase.auth.getSession();
  const hasToken = !!(session as any)?.provider_token;
  if (!hasToken) await signInWithSpotify();
}

export type SimpleTrack = {
  id: string; name: string; artists: string; album: string;
  image?: string; uri: string; preview_url?: string | null;
};

async function requireSpotifyToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const t = (session as any)?.provider_token;
  if (!t) throw new Error("Not authenticated with Spotify");
  return t;
}

async function spotifyGet<T=any>(path: string, params?: Record<string,string|number>) {
  const token = await requireSpotifyToken();
  const url = new URL(`https://api.spotify.com/v1${path}`);
  Object.entries(params ?? {}).forEach(([k,v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Spotify ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export async function searchTracks(q: string, limit=20, offset=0): Promise<SimpleTrack[]> {
  if (!q.trim()) return [];
  const data = await spotifyGet<any>("/search", { q, type: "track", limit, offset, market: "from_token" });
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
