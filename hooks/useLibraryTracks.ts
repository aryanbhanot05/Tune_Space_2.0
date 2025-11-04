// hooks/useLibraryTracks.ts
import { useCallback, useEffect, useState } from "react";
import { useAuthBridge } from "@/contexts/AuthBridge";
import { getLibraryTracks, type TrackDto } from "@/lib/libraryService";

export function useLibraryTracks() {
  const { userId } = useAuthBridge();
  const [tracks, setTracks] = useState<TrackDto[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLibraryTracks(userId);
      setTracks(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tracks, loading, refresh };
}
