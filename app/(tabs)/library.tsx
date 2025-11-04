// app/(tabs)/library.tsx
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthBridge } from "@/contexts/AuthBridge";
import { useLibraryTracks } from "@/hooks/useLibraryTracks";

export default function LibraryScreen() {
  const { userId } = useAuthBridge();
  const { tracks, loading } = useLibraryTracks(userId ?? null);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.header}>Your Library</Text>

      {!userId && (
        <Text style={styles.hint}>
          You’re not signed in. Items will be saved to a local guest library.
        </Text>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading your saved songs…</Text>
        </View>
      ) : tracks.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No saved songs yet</Text>
          <Text style={styles.muted}>Search and add a track to see it here.</Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Pressable style={styles.row}>
              <View style={styles.cover}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.coverImg} />
                ) : (
                  <View style={[styles.coverImg, styles.coverPlaceholder]} />
                )}
              </View>
              <View style={styles.rowText}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {item.artist} • {item.album}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const FG = "#eaeaea";
const MUTED = "#9aa0a6";
const CARD = "#1f1f1f";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", paddingHorizontal: 16 },
  header: {
    color: FG,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 8,
  },
  hint: { color: MUTED, marginBottom: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  muted: { color: MUTED },
  emptyTitle: { color: FG, fontSize: 16, fontWeight: "700" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#222",
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  coverImg: { width: "100%", height: "100%" },
  coverPlaceholder: { backgroundColor: "#2a2a2a" },
  rowText: { flex: 1, marginLeft: 12 },
  title: { color: FG, fontSize: 16, fontWeight: "700" },
  subtitle: { color: MUTED, marginTop: 2, fontSize: 12 },
});
