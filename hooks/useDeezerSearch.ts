"use client";
import { useEffect, useState } from "react";
import { searchTracks } from "../lib/deezer";

function useDebounce<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function useDeezerSearch(query: string) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const q = useDebounce(query, 400);

  useEffect(() => {
    let dead = false;
    (async () => {
      if (!q) { setTracks([]); setError(null); return; }
      setLoading(true);
      setError(null);
      try {
        const data = await searchTracks(q, 12);
        if (!dead) setTracks(data?.data ?? []);
      } catch (e: any) {
        if (!dead) setError(e?.message ?? "Search failed");
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [q]);

  return { tracks, loading, error };
}
