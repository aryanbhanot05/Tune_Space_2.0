// lib/libraryService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { asDeezerId } from "./id";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnon);

export type TrackDto = {
  id: string;            // normalized like "deezer:3135556"
  title: string;
  artist: string;
  album?: string | null;
  imageUrl?: string | null;
  previewUrl?: string | null;
  duration?: number | null;
};

export function deezerToTrack(item: any): TrackDto {
  const id = asDeezerId(item?.id);
  return {
    id,
    title: item?.title ?? "",
    artist: item?.artist?.name ?? "",
    album: item?.album?.title ?? null,
    imageUrl: item?.album?.cover_medium ?? item?.album?.cover ?? null,
    previewUrl: item?.preview ?? null,
    duration: typeof item?.duration === "number" ? item.duration : null,
  };
}

// ---------- Supabase table (SQL)
// create table library_tracks (
//   user_id uuid not null references auth.users(id),
//   id text not null,          -- "deezer:123"
//   title text not null,
//   artist text not null,
//   album text,
//   image_url text,
//   preview_url text,
//   duration int,
//   created_at timestamp with time zone default now(),
//   primary key (user_id, id)
// );
// create index on library_tracks (user_id, created_at desc);

const GUEST_KEY = "@library.tracks.v1:guest";

export async function addToLibrary(userId: string, t: TrackDto) {
  const { error } = await supabase.from("library_tracks").upsert({
    user_id: userId,
    id: t.id,
    title: t.title,
    artist: t.artist,
    album: t.album ?? null,
    image_url: t.imageUrl ?? null,
    preview_url: t.previewUrl ?? null,
    duration: t.duration ?? null,
  });
  if (error) throw error;
}

export async function removeFromLibrary(userId: string, id: string) {
  const { error } = await supabase
    .from("library_tracks")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw error;
}

export async function getLibraryTracks(userId: string | null): Promise<TrackDto[]> {
  if (!userId) {
    const raw = await AsyncStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : [];
  }
  const { data, error } = await supabase
    .from("library_tracks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    artist: r.artist,
    album: r.album,
    imageUrl: r.image_url,
    previewUrl: r.preview_url,
    duration: r.duration,
  }));
}

// Guest helpers (used by your AuthBridge.saveGuest)
export async function saveGuest(t: TrackDto) {
  const list = await getLibraryTracks(null);
  const map = new Map(list.map(x => [x.id, x]));
  map.set(t.id, t);
  await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(Array.from(map.values())));
}

export async function removeGuest(id: string) {
  const list = await getLibraryTracks(null);
  const next = list.filter(x => x.id !== id);
  await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(next));
}
