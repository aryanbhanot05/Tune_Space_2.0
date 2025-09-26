// app/search.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  ensureSpotifySignedIn,
  searchTracks,
  SimpleTrack,
  signInWithSpotify,
} from "@/lib/spotify";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SimpleTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await ensureSpotifySignedIn();
      const tracks = await searchTracks(query);
      setResults(tracks);
    } catch (e: any) {
      console.warn(e);
      setError(e?.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search for songs"
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Pressable style={styles.button} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* error + manual sign-in retry */}
      {error && (
        <View>
          <Text style={styles.error}>{error}</Text>
          <Pressable
            onPress={signInWithSpotify}
            style={[styles.button, { alignSelf: "flex-start", marginTop: 8 }]}
          >
            <Text style={{ color: "#fff" }}>Sign in with Spotify</Text>
          </Pressable>
        </View>
      )}

      {/* results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Ionicons name="musical-notes" size={20} color="#999" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.subtitle}>
                {item.artists} • {item.album}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading && query ? (
            <Text style={styles.empty}>No tracks found.</Text>
          ) : null
        }
      />

      {loading && <Text style={styles.loading}>Loading…</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 16 },
  searchRow: { flexDirection: "row", marginBottom: 12 },
  input: {
    flex: 1,
    backgroundColor: "#1f1f1f",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  button: {
    marginLeft: 8,
    backgroundColor: "#1DB954",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cover: { width: 48, height: 48, borderRadius: 4, marginRight: 12 },
  coverPlaceholder: {
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontWeight: "600" },
  subtitle: { color: "#aaa", fontSize: 12 },
  error: { color: "red", marginTop: 8 },
  empty: { color: "#aaa", textAlign: "center", marginTop: 20 },
  loading: { color: "#aaa", textAlign: "center", marginTop: 10 },
});
