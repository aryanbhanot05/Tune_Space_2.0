import { NotificationBell } from "@/components/NotificationBell";
import { VideoBackground } from "@/components/VideoBackground";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ---- tiny Deezer search helper (uses proxy on web if provided) ----
const FUNCTIONS_BASE = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL || "";

async function searchDeezerTracks(q: string, limit = 15) {
  if (!q) return { data: [] };
  const base = FUNCTIONS_BASE
    ? `${FUNCTIONS_BASE}/deezer-proxy?path=search/track`
    : `https://api.deezer.com/search/track`;
  const url = `${base}${base.includes("?") ? "&" : "?"}q=${encodeURIComponent(q)}&limit=${limit}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // { data: Track[] }
}

// ---- optional native audio (expo-av), safely loaded at runtime ----
type SoundRef = { unloadAsync: () => Promise<void> } | null;
let Audio: any = null;
if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Audio = require("expo-av").Audio;
  } catch {
    // expo-av not installed; previews on native will be disabled
    Audio = null;
  }
}

export default function HomePage() {
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // simple local playlist state (no duplicates)
  const [playlist, setPlaylist] = useState<any[]>([]);

  // native playback state
  const soundRef = useRef<SoundRef>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // debounce the input slightly (protects Deezer 50 req / 5s quota)
  useEffect(() => {
    const id = setTimeout(async () => {
      const q = searchText.trim();
      if (!q) {
        setResults([]);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await searchDeezerTracks(q, 15);
        setResults(data?.data ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Search failed");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [searchText]);

  // cleanup native sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
    };
  }, []);

  const togglePlayNative = async (previewUrl: string, id: string) => {
    if (!Audio) return; // expo-av not installed
    try {
      // stop previous
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      // if tapping the same item, just stop
      if (playingId === id) {
        setPlayingId(null);
        return;
      }
      // create & play new
      const { sound } = await Audio.Sound.createAsync({ uri: previewUrl });
      soundRef.current = sound;
      setPlayingId(id);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((st: any) => {
        if (st.didJustFinish || st.isLoaded === false) {
          setPlayingId(null);
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch {
      setPlayingId(null);
    }
  };

  // --- Add to playlist handler ---
  const addToPlaylist = (track: any) => {
    setPlaylist((prev) => {
      const exists = prev.some((t) => String(t?.id) === String(track?.id));
      if (exists) {
        Alert.alert("Already added", `"${track?.title}" is already in your playlist.`);
        return prev;
      }
      const next = [...prev, track];
      Alert.alert("Added to Playlist", `"${track?.title}" by ${track?.artist?.name}`);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <VideoBackground />

      {/* Notification Bell */}
      <View style={styles.notificationContainer}>
        <NotificationBell size={28} color="#ffffff" />
      </View>

      <View style={styles.top}>
        <Text style={styles.title}>Hi, User</Text>
        <Text style={styles.title}>Search</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by song, artist, or album…"
        placeholderTextColor="#888"
        value={searchText}
        onChangeText={setSearchText}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {loading ? (
        <Text style={{ color: "#ccc", marginBottom: 8 }}>Searching…</Text>
      ) : error ? (
        <Text style={{ color: "#ff6b6b", marginBottom: 8 }}>{error}</Text>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const artUri = item?.album?.cover_medium || item?.album?.cover || undefined;
          const preview = item?.preview as string | undefined;
          const idStr = String(item.id);

          return (
            <View style={styles.songCard1}>
              {artUri ? (
                <Image source={{ uri: artUri }} style={styles.songArt} />
              ) : (
                <View style={[styles.songArt, { backgroundColor: "#101010" }]} />
              )}

              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: "white", fontSize: 16 }} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={{ color: "#aaa", fontSize: 14 }} numberOfLines={1}>
                  {item.artist?.name} • {item.album?.title}
                </Text>

                {/* Preview controls */}
                {preview ? (
                  Platform.OS === "web" ? (
                    <audio controls src={preview} preload="none" style={{ marginTop: 6, width: "100%" }} />
                  ) : Audio ? (
                    <TouchableOpacity
                      onPress={() => togglePlayNative(preview, idStr)}
                      style={styles.previewBtn}
                    >
                      <Text style={{ color: "white" }}>
                        {playingId === idStr ? "Pause" : "Play"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ color: "#ccc", marginTop: 6 }}>
                      Install expo-av for previews on mobile:{" "}
                      <Text style={{ fontStyle: "italic" }}>npx expo install expo-av</Text>
                    </Text>
                  )
                ) : (
                  <Text style={{ color: "#888", marginTop: 6 }}>No preview available</Text>
                )}
              </View>

              {/* --- Add-to-Playlist button (right side) --- */}
              <TouchableOpacity
                onPress={() => addToPlaylist(item)}
                style={styles.addBtn}
                accessibilityLabel="Add to playlist"
                accessibilityHint={`Add ${item?.title} to your playlist`}
              >
                <Ionicons name="add-circle-outline" size={26} color="#ffffff" />
              </TouchableOpacity>
            </View>
          );
        }}
        style={styles.resultsList}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
    paddingTop: 70,
  },
  notificationContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: "#191c24",
    color: "#fff",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: 20,
    borderColor: "#444",
    borderWidth: 1,
    width: "90%",
  },
  resultsList: {
    maxHeight: 300,
    backgroundColor: "#23272f",
    marginHorizontal: 16,
    borderRadius: 10,
    width: "90%",
  },
  top: {
    width: "100%",
    paddingTop: 30,
    height: 140,
    alignItems: "center",
  },
  title: {
    color: "white",
    fontWeight: "bold",
    fontSize: 32,
    textAlign: "center",
    width: "90%",
  },
  songArt: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: "#101010",
  },
  songCard1: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2f3a",
  },
  previewBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#2e3440",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  addBtn: {
    marginLeft: 10,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
});
