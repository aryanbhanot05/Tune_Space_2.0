// contexts/AuthBridge.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

type TrackLike = {
  id: string;          // e.g. "deezer:3135556"
  title: string;
  artist: string;
  album?: string;
  imageUrl?: string;
  previewUrl?: string;
  duration?: number;
};

type AuthBridgeCtx = {
  userId: string | null;
  isGuest: boolean;
  saveGuest: (track: TrackLike) => Promise<void>;
  getGuestLibrary: () => Promise<TrackLike[]>;
  clearGuestLibrary: () => Promise<void>;
};

const Ctx = createContext<AuthBridgeCtx | null>(null);

export function AuthBridgeProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  // Try Supabase session, else guest
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const id = data.session?.user?.id ?? null;
        setUserId(id);
      } catch {
        setUserId(null);
      }
    };
    init();

    // keep in sync if auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const isGuest = !userId;

  // Very simple guest-library persistence
  const GUEST_KEY = "guest_library";

  const saveGuest = async (track: TrackLike) => {
    const raw = (await AsyncStorage.getItem(GUEST_KEY)) || "[]";
    const arr: TrackLike[] = JSON.parse(raw);
    if (!arr.some(t => t.id === track.id)) {
      arr.unshift(track);
      await AsyncStorage.setItem(GUEST_KEY, JSON.stringify(arr.slice(0, 500)));
    }
  };

  const getGuestLibrary = async () => {
    const raw = (await AsyncStorage.getItem(GUEST_KEY)) || "[]";
    return JSON.parse(raw) as TrackLike[];
  };

  const clearGuestLibrary = async () => {
    await AsyncStorage.removeItem(GUEST_KEY);
  };

  const value = useMemo(
    () => ({ userId, isGuest, saveGuest, getGuestLibrary, clearGuestLibrary }),
    [userId]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuthBridge() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuthBridge must be used inside <AuthBridgeProvider>");
  return v;
}
