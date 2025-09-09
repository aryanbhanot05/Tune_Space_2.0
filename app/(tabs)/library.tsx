import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Item = {
  id: string;
  title: string;
  subtitle?: string;
  cover?: string; // uri
  type: "playlist" | "album" | "artist";
};

const DATA: Item[] = [
  {
    id: "1",
    title: "Liked Songs",
    subtitle: "487 songs",
    type: "playlist",
  },
  {
    id: "2",
    title: "Gym Hits",
    subtitle: "64 songs",
    type: "playlist",
    cover: "https://picsum.photos/seed/gym/200",
  },
  {
    id: "3",
    title: "Deep Focus",
    subtitle: "by Spotify",
    type: "playlist",
    cover: "https://picsum.photos/seed/focus/200",
  },
  {
    id: "4",
    title: "UTOPIA",
    subtitle: "Travis Scott",
    type: "album",
    cover: "https://picsum.photos/seed/utopia/200",
  },
  {
    id: "5",
    title: "Drake",
    type: "artist",
    cover: "https://picsum.photos/seed/drake/200",
  },
];

const FILTERS = ["All", "Playlists", "Albums", "Artists"] as const;
type FilterKey = (typeof FILTERS)[number];

export default function LibrarySimple() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("All");

  const filtered = useMemo(() => {
    return DATA.filter((it) => {
      if (filter === "Playlists" && it.type !== "playlist") return false;
      if (filter === "Albums" && it.type !== "album") return false;
      if (filter === "Artists" && it.type !== "artist") return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return `${it.title} ${it.subtitle ?? ""}`.toLowerCase().includes(q);
    });
  }, [query, filter]);

  return (
    <View style={s.container}>
      <Text style={s.title}>Library</Text>

      <View style={s.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor="#9aa0a6"
          style={s.input}
        />
      </View>

      <View style={s.chips}>
        {FILTERS.map((k) => (
          <Pressable
            key={k}
            onPress={() => setFilter(k)}
            style={[s.chip, filter === k && s.chipActive]}
          >
            <Text style={[s.chipText, filter === k && s.chipTextActive]}>
              {k}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Pressable
            style={s.row}
            onPress={() => {
              /* navigate to detail later */
            }}
          >
            <View style={[s.cover, item.type === "artist" && s.coverCircle]}>
              {item.cover ? (
                <Image
                  source={{ uri: item.cover }}
                  style={[
                    s.coverImg,
                    item.type === "artist" && s.coverImgCircle,
                  ]}
                />
              ) : (
                <Text style={{ color: "#9aa0a6" }}>♪</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={s.rowTitle}>
                {item.title}
              </Text>
              {!!item.subtitle && (
                <Text numberOfLines={1} style={s.rowSub}>
                  {item.subtitle}
                </Text>
              )}
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
      />
    </View>
  );
}

const BG = "#121212";
const FG = "#eaeaea";
const CARD = "#1f1f1f";

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#10151b",
    paddingTop: 12,
  },
  title: {
    color: FG,
    fontSize: 26,
    fontWeight: "800",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchRow: { paddingHorizontal: 16, marginBottom: 8 },
  input: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: CARD,
    color: FG,
    fontSize: 14,
  },
  chips: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  chip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: CARD,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "#fff" },
  chipText: { color: FG, fontWeight: "600", fontSize: 12 },
  chipTextActive: { color: "#111" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 12,
  },
  coverCircle: { borderRadius: 28 },
  coverImg: { width: "100%", height: "100%" },
  coverImgCircle: { borderRadius: 28 },
  rowTitle: { color: FG, fontSize: 16, fontWeight: "700" },
  rowSub: { color: "#9aa0a6", fontSize: 12, marginTop: 2 },
});
