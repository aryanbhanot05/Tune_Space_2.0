import { NotificationBell } from "@/components/NotificationBell";
import { VideoBackground } from "@/components/VideoBackground";
import { useNotifications } from "@/contexts/NotificationContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ---- tiny Deezer search helper (uses proxy on web if provided) ----
const FUNCTIONS_BASE = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL || "";

async function searchDeezerTracks(q: string, limit = 15) {
  if (!q) return { data: [] };

  const searchQuery = encodeURIComponent(q);

  // Try direct track search first
  try {
    const url = `https://api.deezer.com/search/track?q=${searchQuery}&limit=${limit}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      method: "GET",
      mode: "cors",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        return data;
      }
    }
  } catch (error) {
    console.log("Direct search failed, trying alternatives...");
  }

  // Try album search as fallback
  try {
    const albumUrl = `https://api.deezer.com/search/album?q=${searchQuery}&limit=3`;
    const albumRes = await fetch(albumUrl, {
      headers: { Accept: "application/json" },
      method: "GET",
      mode: "cors",
    });

    if (albumRes.ok) {
      const albumData = await albumRes.json();
      if (albumData.data && albumData.data.length > 0) {
        const albumId = albumData.data[0].id;
        const tracksUrl = `https://api.deezer.com/album/${albumId}/tracks`;
        const tracksRes = await fetch(tracksUrl, {
          headers: { Accept: "application/json" },
          method: "GET",
          mode: "cors",
        });

        if (tracksRes.ok) {
          const tracksData = await tracksRes.json();
          if (tracksData.data && tracksData.data.length > 0) {
            return tracksData;
          }
        }
      }
    }
  } catch (error) {
    console.log("Album search failed, using mock data...");
  }

  // Fallback: return mock data
  return {
    data: [
      {
        id: 1,
        title: `Best of ${q}`,
        artist: { name: "Popular Artist" },
        album: {
          title: `${q} Hits`,
          cover_medium:
            "https://via.placeholder.com/300x300/1DB954/FFFFFF?text=🎵",
        },
        preview: null,
        duration: 180,
      },
      {
        id: 2,
        title: `${q} Anthem`,
        artist: { name: "Chart Topper" },
        album: {
          title: `${q} Collection`,
          cover_medium:
            "https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=🔥",
        },
        preview: null,
        duration: 200,
      },
      {
        id: 3,
        title: `${q} Vibes`,
        artist: { name: "Rising Star" },
        album: {
          title: `${q} Mix`,
          cover_medium:
            "https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=✨",
        },
        preview: null,
        duration: 220,
      },
      {
        id: 4,
        title: `${q} Classic`,
        artist: { name: "Legend" },
        album: {
          title: `${q} Essentials`,
          cover_medium:
            "https://via.placeholder.com/300x300/45B7D1/FFFFFF?text=⭐",
        },
        preview: null,
        duration: 195,
      },
      {
        id: 5,
        title: `${q} Remix`,
        artist: { name: "DJ Master" },
        album: {
          title: `${q} Remixes`,
          cover_medium:
            "https://via.placeholder.com/300x300/96CEB4/FFFFFF?text=🎧",
        },
        preview: null,
        duration: 210,
      },
    ],
  };
}

// Get trending tracks
async function getTrendingTracks(limit = 10) {
  const base = FUNCTIONS_BASE
    ? `${FUNCTIONS_BASE}/deezer-proxy?path=chart/0/tracks`
    : `https://api.deezer.com/chart/0/tracks`;
  const url = `${base}${base.includes("?") ? "&" : "?"}limit=${limit}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Get popular artists
async function getPopularArtists(limit = 8) {
  const base = FUNCTIONS_BASE
    ? `${FUNCTIONS_BASE}/deezer-proxy?path=chart/0/artists`
    : `https://api.deezer.com/chart/0/artists`;
  const url = `${base}${base.includes("?") ? "&" : "?"}limit=${limit}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Get genre-based recommendations
async function getGenreRecommendations(genreId: number, limit = 6) {
  const base = FUNCTIONS_BASE
    ? `${FUNCTIONS_BASE}/deezer-proxy?path=genre/${genreId}/artists`
    : `https://api.deezer.com/genre/${genreId}/artists`;
  const url = `${base}${base.includes("?") ? "&" : "?"}limit=${limit}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
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

  // Recommendation states
  const [trendingTracks, setTrendingTracks] = useState<any[]>([]);
  const [popularArtists, setPopularArtists] = useState<any[]>([]);
  const [genreRecommendations, setGenreRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  // simple local playlist state (no duplicates)
  const [playlist, setPlaylist] = useState<any[]>([]);

  // native playback state
  const soundRef = useRef<SoundRef>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<any | null>(null);


  // Notification context
  const {
    sendDeezerNotification,
    sendDiscoveryNotification,
    sendPlaylistSuggestionNotification,
  } = useNotifications();

  // Safe area insets for proper positioning on iPhone
  const insets = useSafeAreaInsets();

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
        console.error("Search error:", e);
        setError(e?.message ?? "Search failed");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [searchText]);

  // Load recommendations on mount
  useEffect(() => {
    const loadRecommendations = async () => {
      setRecommendationsLoading(true);
      try {
        // Load trending tracks
        const trendingData = await getTrendingTracks(10);
        setTrendingTracks(trendingData?.data || []);

        // Load popular artists
        const artistsData = await getPopularArtists(8);
        setPopularArtists(artistsData?.data || []);

        // Load genre recommendations (Rock, Pop, Hip-Hop, Electronic)
        const genres = [113, 132, 116, 106]; // Rock, Pop, Hip-Hop, Electronic
        const genrePromises = genres.map((genreId) =>
          getGenreRecommendations(genreId, 3)
        );
        const genreResults = await Promise.all(genrePromises);
        const allGenreArtists = genreResults.flatMap(
          (result) => result?.data || []
        );
        setGenreRecommendations(allGenreArtists.slice(0, 12));
      } catch (error) {
        console.error("Failed to load recommendations:", error);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  // cleanup native sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
    };
  }, []);

const togglePlayNative = async (previewUrl: string, id: string, track?: any) => {
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
      setCurrentTrack(null);   // 🔹 clear banner when stopping same track
      return;
    }
    // create & play new
    const { sound } = await Audio.Sound.createAsync({ uri: previewUrl });
    soundRef.current = sound;
    setPlayingId(id);
    if (track) setCurrentTrack(track);  // 🔹 set banner to this track
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((st: any) => {
      if (st.didJustFinish || st.isLoaded === false) {
        setPlayingId(null);
        setCurrentTrack(null); // 🔹 clear banner when playback ends
        sound.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    });
  } catch {
    setPlayingId(null);
    setCurrentTrack(null);
  }
};


  // --- Add to playlist handler ---
  const addToPlaylist = async (track: any) => {
    setPlaylist((prev) => {
      const exists = prev.some((t) => String(t?.id) === String(track?.id));
      if (exists) {
        Alert.alert(
          "Already added",
          `"${track?.title}" is already in your playlist.`
        );
        return prev;
      }
      const next = [...prev, track];
      Alert.alert(
        "Added to Playlist",
        `"${track?.title}" by ${track?.artist?.name}`
      );
      return next;
    });

    // Send Deezer notification for playlist addition
    try {
      const trackData = {
        trackId: String(track.id),
        title: track.title,
        artist: track.artist?.name || "Unknown Artist",
        album: track.album?.title,
        imageUrl: track.album?.cover_medium || track.album?.cover,
        previewUrl: track.preview,
        duration: track.duration,
      };

      await sendPlaylistSuggestionNotification(trackData);
    } catch (error) {
      console.error("Failed to send playlist notification:", error);
    }
  };

  return (
    <View style={styles.container}>
      <VideoBackground />

      {/* Notification Bell */}
      <View style={[styles.notificationContainer, { top: insets.top + 10 }]}>
        <NotificationBell size={28} color="#ffffff" />
      </View>

      <View style={styles.top}>
        <Text style={styles.title}>Search</Text>
      </View>

      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by song, artist, or album…"
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchText("");
              setError(null);
              setResults([]);
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#bbb" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <Text style={{ color: "#ccc", marginBottom: 8 }}>Searching…</Text>
      ) : error ? (
        <Text style={{ color: "#ff6b6b", marginBottom: 8 }}>{error}</Text>
      ) : null}

      {/* Show search results if there's a search query */}
      {searchText.trim() ? (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const artUri =
              item?.album?.cover_medium || item?.album?.cover || undefined;
            const preview = item?.preview as string | undefined;
            const idStr = String(item.id);

            return (
              <View style={styles.songCard1}>
                {artUri ? (
                  <Image source={{ uri: artUri }} style={styles.songArt} />
                ) : (
                  <View
                    style={[styles.songArt, { backgroundColor: "#101010" }]}
                  />
                )}

                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text
                    style={{ color: "white", fontSize: 16 }}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{ color: "#aaa", fontSize: 14 }}
                    numberOfLines={1}
                  >
                    {item.artist?.name} • {item.album?.title}
                  </Text>

                  {/* Preview controls */}
                  {preview ? (
                    Platform.OS === "web" ? (
                      <audio
                        controls
                        src={preview}
                        preload="none"
                        style={{ marginTop: 6, width: "100%" }}
                      />
                    ) : Audio ? (
                      <TouchableOpacity
                        onPress={() => togglePlayNative(preview, idStr, item)}
                        style={styles.previewBtn}
                      >
                        <Text style={{ color: "white" }}>
                          {playingId === idStr ? "Pause" : "Play"}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={{ color: "#ccc", marginTop: 6 }}>
                        Install expo-av for previews on mobile:{" "}
                        <Text style={{ fontStyle: "italic" }}>
                          npx expo install expo-av
                        </Text>
                      </Text>
                    )
                  ) : (
                    <Text style={{ color: "#888", marginTop: 6 }}>
                      No preview available
                    </Text>
                  )}
                </View>

                {/* --- Add-to-Playlist button (right side) --- */}
                <TouchableOpacity
                  onPress={() => addToPlaylist(item)}
                  style={styles.addBtn}
                  accessibilityLabel="Add to playlist"
                  accessibilityHint={`Add ${item?.title} to your playlist`}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={26}
                    color="#ffffff"
                  />
                </TouchableOpacity>
              </View>
            );
          }}
          style={styles.resultsList}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: "#888", fontSize: 16 }}>
                No results found
              </Text>
              <Text style={{ color: "#666", fontSize: 14, marginTop: 4 }}>
                Try searching for a different song, artist, or album
              </Text>
            </View>
          }
        />
      ) : (
        /* Show recommendations when no search query */
        <ScrollView
          style={styles.recommendationsContainer}
          contentContainerStyle={styles.recommendationsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Trending Tracks Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
            {recommendationsLoading ? (
              <Text style={styles.loadingText}>Loading trending tracks...</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
              >
                {trendingTracks.map((track, index) => (
                  <TouchableOpacity
                    key={track.id}
                    style={styles.trendingCard}
                    onPress={async () => {
                      await addToPlaylist(track);
                      // Send trending notification
                      try {
                        const trackData = {
                          trackId: String(track.id),
                          title: track.title,
                          artist: track.artist?.name || "Unknown Artist",
                          album: track.album?.title,
                          imageUrl:
                            track.album?.cover_medium || track.album?.cover,
                          previewUrl: track.preview,
                          duration: track.duration,
                        };
                        await sendDeezerNotification(
                          "trending_track",
                          trackData,
                          `🔥 #${index + 1} Trending: ${track.title}`,
                          `${track.artist?.name} • ${
                            track.album?.title || "Single"
                          }`
                        );
                      } catch (error) {
                        console.error(
                          "Failed to send trending notification:",
                          error
                        );
                      }
                    }}
                  >
                    <Image
                      source={{
                        uri: track.album?.cover_medium || track.album?.cover,
                      }}
                      style={styles.trendingImage}
                    />
                    <Text style={styles.trendingTitle} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={styles.trendingArtist} numberOfLines={1}>
                      {track.artist?.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Popular Artists Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>⭐ Popular Artists</Text>
            {recommendationsLoading ? (
              <Text style={styles.loadingText}>Loading popular artists...</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
              >
                {popularArtists.map((artist) => (
                  <TouchableOpacity
                    key={artist.id}
                    style={styles.artistCard}
                    onPress={() => setSearchText(artist.name)}
                  >
                    <Image
                      source={{ uri: artist.picture_medium || artist.picture }}
                      style={styles.artistImage}
                    />
                    <Text style={styles.artistName} numberOfLines={1}>
                      {artist.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Genre Recommendations Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🎵 Discover by Genre</Text>
            {recommendationsLoading ? (
              <Text style={styles.loadingText}>
                Loading genre recommendations...
              </Text>
            ) : (
              <View style={styles.genreGrid}>
                {genreRecommendations.slice(0, 8).map((artist) => (
                  <TouchableOpacity
                    key={artist.id}
                    style={styles.genreCard}
                    onPress={() => setSearchText(artist.name)}
                  >
                    <Image
                      source={{ uri: artist.picture_medium || artist.picture }}
                      style={styles.genreImage}
                    />
                    <Text style={styles.genreName} numberOfLines={1}>
                      {artist.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Quick Search Suggestions */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🔍 Quick Search</Text>
            <View style={styles.quickSearchContainer}>
              {[
                "Rock",
                "Pop",
                "Hip Hop",
                "Electronic",
                "Jazz",
                "Classical",
              ].map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={styles.quickSearchChip}
                  onPress={() => setSearchText(genre)}
                >
                  <Text style={styles.quickSearchText}>{genre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

{currentTrack && (
  <View style={[styles.nowPlayingBar, { paddingBottom: insets.bottom + 8 }]}>
    <Image
      source={{
        uri:
          currentTrack.album?.cover_medium ||
          currentTrack.album?.cover ||
          "https://via.placeholder.com/60",
      }}
      style={styles.nowPlayingArt}
    />

    <View style={{ flex: 1, marginHorizontal: 10 }}>
      <Text style={styles.nowPlayingTitle} numberOfLines={1}>
        {currentTrack.title}
      </Text>
      <Text style={styles.nowPlayingArtist} numberOfLines={1}>
        {currentTrack.artist?.name} • {currentTrack.album?.title}
      </Text>
    </View>

    {Platform.OS !== "web" && currentTrack.preview && Audio && (
      <TouchableOpacity
        onPress={() =>
          togglePlayNative(
            currentTrack.preview,
            String(currentTrack.id),
            currentTrack
          )
        }
        style={styles.nowPlayingPlayBtn}
      >
        <Ionicons
          name={playingId === String(currentTrack.id) ? "pause" : "play"}
          size={22}
          color="#fff"
        />
      </TouchableOpacity>
    )}
  </View>
)}
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
  paddingBottom: 90,
  overflow: "visible",
},

  notificationContainer: {
    position: "absolute",
    right: 20,
    zIndex: 10,
  },
  searchWrapper: {
    position: "relative",
    width: "90%",
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#191c24",
    marginHorizontal: 16,
  },
  searchInput: {
    width: "100%",
    color: "#fff", // <-- ensures white text
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 36, // <-- space so text doesn't go under the X
    fontSize: 16,
  },
  clearButton: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -10 }],
    padding: 1,
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
  // Recommendation styles
  recommendationsContainer: {
    flex: 1,
    width: "90%",
    marginHorizontal: 16,
  },
  recommendationsContent: {
    paddingBottom: 140, // Add bottom padding to prevent navigation bar overlap
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    marginLeft: 4,
  },
  loadingText: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 20,
  },
  horizontalScroll: {
    marginHorizontal: -4,
  },
  // Trending tracks styles
  trendingCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: "#2a2f3a",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
  },
  trendingImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#101010",
  },
  trendingTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  trendingArtist: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  // Popular artists styles
  artistCard: {
    width: 100,
    marginRight: 12,
    alignItems: "center",
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#101010",
  },
  artistName: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  // Genre recommendations styles
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  genreCard: {
    width: "48%",
    backgroundColor: "#2a2f3a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  genreImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#101010",
  },
  genreName: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  // Quick search styles
  quickSearchContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickSearchChip: {
    backgroundColor: "#1DB954",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  quickSearchText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
nowPlayingBar: {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: "#111827ee",
  borderTopWidth: 1,
  borderTopColor: "#374151",
  zIndex: 9999,      // 👈 SUPER IMPORTANT
  elevation: 9999,   // 👈 Android
},

nowPlayingArt: {
  width: 44,
  height: 44,
  borderRadius: 6,
  backgroundColor: "#101010",
},

nowPlayingTitle: {
  color: "#ffffff",
  fontSize: 14,
  fontWeight: "600",
},

nowPlayingArtist: {
  color: "#9ca3af",
  fontSize: 12,
  marginTop: 2,
},

nowPlayingPlayBtn: {
  paddingHorizontal: 10,
  paddingVertical: 8,
  justifyContent: "center",
  alignItems: "center",
},
});
