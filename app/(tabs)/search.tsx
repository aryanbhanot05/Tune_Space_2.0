import { NotificationBell } from "@/components/NotificationBell";
import { PointsDisplay } from "@/components/PointsDisplay";
import { VideoBackground } from "@/components/VideoBackground";
import { useNotifications } from "@/contexts/NotificationContext";
import PointsService from "@/lib/pointsService";
import { Ionicons } from "@expo/vector-icons";
import { router, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
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

const FALLBACK_TRENDING = [
  {
    id: "fallback-track-1",
    title: "Emotify Sunrise",
    artist: { name: "TuneSync Collective" },
    album: {
      title: "Morning Vibes",
      cover_medium: "https://via.placeholder.com/300x300/ff9f43/ffffff?text=☀️",
    },
    preview: null,
    duration: 210,
  },
  {
    id: "fallback-track-2",
    title: "Neon Nights",
    artist: { name: "PulseDrive" },
    album: {
      title: "City Lights",
      cover_medium: "https://via.placeholder.com/300x300/1dd1a1/ffffff?text=🌃",
    },
    preview: null,
    duration: 198,
  },
  {
    id: "fallback-track-3",
    title: "Lo-Fi Lounge",
    artist: { name: "Cloudcast" },
    album: {
      title: "Lo-Fi Lounge",
      cover_medium: "https://via.placeholder.com/300x300/54a0ff/ffffff?text=🎧",
    },
    preview: null,
    duration: 184,
  },
  {
    id: "fallback-track-4",
    title: "Pulse Runner",
    artist: { name: "Echo Drift" },
    album: {
      title: "Retro Future",
      cover_medium: "https://via.placeholder.com/300x300/ee5253/ffffff?text=⚡",
    },
    preview: null,
    duration: 205,
  },
];

const FALLBACK_ARTISTS = [
  {
    id: "fallback-artist-1",
    name: "Nova Rae",
    picture_medium: "https://via.placeholder.com/200x200/ff6b6b/ffffff?text=N",
  },
  {
    id: "fallback-artist-2",
    name: "Atlas Bloom",
    picture_medium: "https://via.placeholder.com/200x200/48dbfb/ffffff?text=A",
  },
  {
    id: "fallback-artist-3",
    name: "Echo Drift",
    picture_medium: "https://via.placeholder.com/200x200/5f27cd/ffffff?text=E",
  },
  {
    id: "fallback-artist-4",
    name: "Velvet Pulse",
    picture_medium: "https://via.placeholder.com/200x200/10ac84/ffffff?text=V",
  },
];

const FALLBACK_GENRE_ARTISTS = [
  {
    id: "fallback-genre-1",
    name: "Synth Horizon",
    picture_medium: "https://via.placeholder.com/200x200/341f97/ffffff?text=S",
  },
  {
    id: "fallback-genre-2",
    name: "Indigo Drift",
    picture_medium: "https://via.placeholder.com/200x200/f368e0/ffffff?text=I",
  },
  {
    id: "fallback-genre-3",
    name: "Lunar Echo",
    picture_medium: "https://via.placeholder.com/200x200/222f3e/ffffff?text=L",
  },
  {
    id: "fallback-genre-4",
    name: "Golden Hour",
    picture_medium: "https://via.placeholder.com/200x200/ffa801/ffffff?text=G",
  },
];

// Generic helper to fetch with fallback mock data
async function fetchWithFallback<T>(url: string, fallback: T): Promise<{ data: T }> {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data?.data || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error("Empty response from API");
    }
    return data;
  } catch (error) {
    console.warn(`[Deezer] Request failed (${url}):`, error);
    console.warn("[Deezer] Falling back to local mock data.");
    return { data: fallback };
  }
}

// Get trending tracks
async function getTrendingTracks(limit = 10) {
  const base = FUNCTIONS_BASE
    ? `${FUNCTIONS_BASE}/deezer-proxy?path=chart/0/tracks`
    : `https://api.deezer.com/chart/0/tracks`;
  const url = `${base}${base.includes("?") ? "&" : "?"}limit=${limit}`;
  return fetchWithFallback(url, FALLBACK_TRENDING.slice(0, limit));
}

// Get popular artists
async function getPopularArtists(limit = 8) {
  const base = FUNCTIONS_BASE
    ? `${FUNCTIONS_BASE}/deezer-proxy?path=chart/0/artists`
    : `https://api.deezer.com/chart/0/artists`;
  const url = `${base}${base.includes("?") ? "&" : "?"}limit=${limit}`;
  return fetchWithFallback(url, FALLBACK_ARTISTS.slice(0, limit));
}

// Get genre-based recommendations
async function getGenreRecommendations(genreId: number, limit = 6) {
  const base = FUNCTIONS_BASE
    ? `${FUNCTIONS_BASE}/deezer-proxy?path=genre/${genreId}/artists`
    : `https://api.deezer.com/genre/${genreId}/artists`;
  const url = `${base}${base.includes("?") ? "&" : "?"}limit=${limit}`;
  return fetchWithFallback(url, FALLBACK_GENRE_ARTISTS.slice(0, limit));
}

// ---- optional native audio (expo-av), safely loaded at runtime ----
type SoundRef = { unloadAsync: () => Promise<void> } | null;
let Audio: any = null;
if (Platform.OS !== "web") {
  try {
    Audio = require("expo-av").Audio;
  } catch {
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
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

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
        
        // Award points for searching
        if (data?.data && data.data.length > 0) {
          try {
            const pointsService = PointsService.getInstance();
            await pointsService.awardPoints('SEARCH_PERFORMED', `Searched for "${q}"`);
          } catch (error) {
            console.error('Error awarding points:', error);
          }
        }
      } catch (e: any) {
        console.error("Search error:", e);
        setError(e?.message ?? "Search failed");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [searchText]);

  // Initialize points service
  useEffect(() => {
    const initializePoints = async () => {
      try {
        const pointsService = PointsService.getInstance();
        await pointsService.initialize();
        await pointsService.checkDailyLogin();
      } catch (error) {
        console.error('Error initializing points:', error);
      }
    };
    initializePoints();
  }, []);

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
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => { });
    };
  }, []);

  const togglePlayNative = async (
    previewUrl: string,
    id: string,
    track?: any
  ) => {
    if (!Audio) return; // expo-av not installed
    try {
      // If tapping same item while playing → stop audio but keep card open
      if (playingId === id && soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setPlayingId(null);
        return;
      }

      // stop previous
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // create & play new
      const { sound } = await Audio.Sound.createAsync({ uri: previewUrl });
      soundRef.current = sound;
      setPlayingId(id);

      if (track) {
        setCurrentTrack(track);
        setIsPlayerVisible(true);
      }

      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((st: any) => {
        if (st.didJustFinish || st.isLoaded === false) {
          setPlayingId(null);
          sound.unloadAsync().catch(() => { });
          soundRef.current = null;
        }
      });
    } catch {
      setPlayingId(null);
    }
  };

  const closePlayer = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => { });
      soundRef.current = null;
    }
    setPlayingId(null);
    setCurrentTrack(null);
    setIsPlayerVisible(false);
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

    // Award points for adding to playlist
    try {
      const pointsService = PointsService.getInstance();
      await pointsService.awardPoints('SONG_ADDED_TO_PLAYLIST', `Added "${track?.title}" to playlist`);
    } catch (error) {
      console.error('Error awarding points:', error);
    }

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

      {/* Notification Bell and Points Display */}
      <View style={[styles.notificationContainer, { top: insets.top + 10 }]}>
        <NotificationBell size={28} color="#ffffff" />
      </View>
      <View style={[styles.pointsContainer, { top: insets.top + 10 }]}>
        <PointsDisplay 
          size="small" 
          onPress={() => {
            router.push({
              pathname: '/(tabs)/settings',
              params: { openSection: 'rewards' }
            });
          }}
        />
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
              <TouchableOpacity
                style={styles.songCard1}
                activeOpacity={0.85}
                onPress={() => {
                  if (preview) {
                    // tap row → open card and start playing
                    togglePlayNative(preview, idStr, item);
                  } else {
                    // no preview, just open info card
                    setCurrentTrack(item);
                    setIsPlayerVisible(true);
                  }
                }}
              >
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
                  {/* row play/pause removed – playback handled in popup */}
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
              </TouchableOpacity>
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
                      // Award points (already handled in addToPlaylist, but also for playing)
                      try {
                        const pointsService = PointsService.getInstance();
                        await pointsService.awardPoints('SONG_PLAYED', `Played trending track: ${track.title}`);
                      } catch (error) {
                        console.error('Error awarding points:', error);
                      }
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
                          `${track.artist?.name} • ${track.album?.title || "Single"
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
                {genreRecommendations.slice(0, 8).map((artist, index) => (
                  <TouchableOpacity
                    key={`${artist.id}-${index}`}
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

      {/* Player card modal */}
      {currentTrack && (
        <Modal
          visible={isPlayerVisible}
          transparent
          animationType="slide"
          onRequestClose={closePlayer}
        >
          <View style={styles.playerBackdrop}>
            <View style={styles.playerCard}>
              <TouchableOpacity
                style={styles.playerClose}
                onPress={closePlayer}
              >
                <Ionicons name="close" size={22} color="#ffffff" />
              </TouchableOpacity>

              <Image
                source={{
                  uri:
                    currentTrack.album?.cover_medium ||
                    currentTrack.album?.cover ||
                    "https://via.placeholder.com/300",
                }}
                style={styles.playerArt}
              />

              <Text style={styles.playerTitle} numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text style={styles.playerArtist} numberOfLines={1}>
                {currentTrack.artist?.name} • {currentTrack.album?.title}
              </Text>

              <View style={styles.playerActionsRow}>
                {currentTrack.preview && Audio && (
                  <TouchableOpacity
                    style={styles.playerPlayBtn}

                    onPress={() =>
                      togglePlayNative(
                        currentTrack.preview,
                        String(currentTrack.id),
                        currentTrack
                      )
                    }
                  >
                    <Ionicons
                      name={
                        playingId === String(currentTrack.id) ? "pause" : "play"
                      }
                      size={26}
                      color="#ffffff"
                    />
                    <Text style={styles.playerPlayText}>
                      {playingId === String(currentTrack.id) ? "Pause" : "Play"}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.playerAddBtn}
                  onPress={() => addToPlaylist(currentTrack)}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color="#ffffff"
                  />
                  <Text style={styles.playerAddText}>Add to playlist</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  },
  notificationContainer: {
    position: "absolute",
    right: 20,
    zIndex: 10,
  },
  pointsContainer: {
    position: "absolute",
    left: 20,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: "#191c24",
    color: "#fff",
    paddingVertical: 10,
    paddingLeft: 10,


    paddingRight: 36, 

    borderRadius: 10,
    borderColor: "#444",
    borderWidth: 1,
    width: "100%",
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
  addBtn: {
    marginLeft: 10,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  recommendationsContainer: {
    flex: 1,
    width: "90%",
    marginHorizontal: 16,
  },
  recommendationsContent: {
    paddingBottom: 100, 
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

 
  playerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  playerCard: {
    width: "85%",
    borderRadius: 20,
    padding: 20,
    backgroundColor: "#1f2933",
    alignItems: "center",
  },
  playerClose: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4,
  },
  playerArt: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#101010",
  },
  playerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  playerArtist: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  playerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  playerPlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#1DB954",
  },
  playerPlayText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  playerAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4b5563",
    backgroundColor: "#111827",
  },
  playerAddText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  searchWrapper: {
    position: "relative",
    width: "90%",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },

  clearButton: {
    position: "absolute",
    right: 12,
    top: "40%",
    transform: [{ translateY: -10 }],
    padding: 4,
  },
});
