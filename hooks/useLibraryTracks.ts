// hooks/useLibraryTracks.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type LibraryTrack = {
  id: string;        // provider_id, e.g. "deezer:3135556"
  title: string;
  artist: string;
  album?: string | null;
  imageUrl?: string | null;
  previewUrl?: string | null;
  duration?: number | null;
  createdAt: string;
};

export function useLibraryTracks(userId: string | null) {
  const [tracks, setTracks] = useState<LibraryTrack[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!userId) {
        setTracks([]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("liked_songs")
        .select("provider_id,title,artist,album,image_url,preview_url,duration,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(500);

      setLoading(false);
      if (error || cancelled) return;

      const rows = (data ?? []).map((r) => ({
        id: r.provider_id as string,
        title: r.title as string,
        artist: r.artist as string,
        album: (r.album as string) ?? null,
        imageUrl: (r.image_url as string) ?? null,
        previewUrl: (r.preview_url as string) ?? null,
        duration: (r.duration as number) ?? null,
        createdAt: r.created_at as string,
      }));
      setTracks(rows);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { tracks, loading };
}
