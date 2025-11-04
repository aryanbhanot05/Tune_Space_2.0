// hooks/useLibraryIds.ts
import { useEffect, useState } from "react";
import { getLibraryTracks } from "@/lib/libraryService";

export function useLibraryIds(userId: string | null | undefined) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const list = await getLibraryTracks(userId ?? null);
      setIds(new Set(list.map(t => t.id))); // normalized ids
    })();
  }, [userId]);

  return {
    has: (id: string) => ids.has(id),
    addLocal: (id: string) => setIds(prev => new Set(prev).add(id)),
    removeLocal: (id: string) => {
      const next = new Set(ids);
      next.delete(id);
      setIds(next);
    },
  };
}