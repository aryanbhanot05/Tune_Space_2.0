import { NotificationBell } from "@/components/NotificationBell";
import { VideoBackground } from "@/components/VideoBackground";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState, useEffect } from "react";
import {
  Image,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlaylistStore } from "@/hooks/playlist";



type LibraryItem = {
  id: string;
  title: string;
  subtitle?: string;
  cover?: string; // uri
  type: "playlist" | "album" | "artist" | "podcast" | "audiobook";
};

type SectionT = {
  title: string;
  data: LibraryItem[];
};


const FILTERS = ["Playlists", "Albums", "Artists"] as const;
type FilterKey = (typeof FILTERS)[number];


export default function LibraryScreen() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState<FilterKey | null>(null);
  const [sort, setSort] = useState<"recent" | "alpha">("recent");

  // from your store
  const playlistsMap = usePlaylistStore((s) => s.playlists);
  const ensurePlaylist = usePlaylistStore((s) => s.ensurePlaylist);

  useEffect(() => {
    ensurePlaylist("pl-liked", "Liked Songs");
  }, [ensurePlaylist]);

const sections = useMemo(() => {
    // Convert store playlists -> LibraryItem[]
    let items: LibraryItem[] = Object.values(playlistsMap).map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: `${p.tracks.length} ${p.tracks.length === 1 ? "song" : "songs"}`,
      type: "playlist",
      cover: p.cover,
    }));

    // ---- filters (keep your existing behavior) ----
    const match = (it: LibraryItem) => {
      if (active === "Playlists" && it.type !== "playlist") return false;
      if (!q.trim()) return true;
      const s = `${it.title} ${it.subtitle ?? ""}`.toLowerCase();
      return s.includes(q.toLowerCase());
    };

    items = items.filter(match);

    // ---- sort ----
    items.sort((a, b) => {
      if (sort === "alpha") return a.title.localeCompare(b.title);
      // “recent” fallback -> keep deterministic order by id
      return b.id.localeCompare(a.id);
    });

    const result: SectionT[] = [];
    if (items.length) {
      result.push({ title: "Playlists", data: items });
    } else {

      result.push({ title: "Playlists", data: [] });
    }
    return result;
  }, [playlistsMap, q, active, sort]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <VideoBackground />

      <Header />

      <SearchRow
        value={q}
        onChangeText={setQ}
        onSortToggle={() =>
          setSort((s) => (s === "recent" ? "alpha" : "recent"))
        }
        sort={sort}
      />

      <FilterChips active={active} onToggle={setActive} />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: 48 }}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Pressable onPress={() => { }} hitSlop={8} style={styles.seeAll}>
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </View>
        )}
        renderItem={({ item }) => (
          <Row item={item} onPress={() => router.push(`/(tabs)/library`)} />
        )}
        ListHeaderComponent={<AddPlaylistTile />}
      />
    </SafeAreaView>
  );
}

/* ------------------------ UI pieces ------------------------ */

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Your Library</Text>
      <View style={styles.headerActions}>
        <Pressable hitSlop={10}>
          <Ionicons name="search" size={22} color="#eaeaea" />
        </Pressable>
        <View style={{ width: 12 }} />
        <Pressable hitSlop={10}>
          <Ionicons name="add" size={26} color="#eaeaea" />
        </Pressable>
      </View>
    </View>
  );
}

function SearchRow({
  value,
  onChangeText,
  onSortToggle,
  sort,
}: {
  value: string;
  onChangeText: (t: string) => void;
  onSortToggle: () => void;
  sort: "recent" | "alpha";
}) {
  return (
    <View style={styles.searchRow}>
      <View style={styles.searchInput}>
        <Ionicons name="search" size={18} color="#9aa0a6" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search your library"
          placeholderTextColor="#9aa0a6"
          style={styles.input}
          autoCapitalize="none"
        />
      </View>
      <Pressable style={styles.sortButton} onPress={onSortToggle}>
        <MaterialCommunityIcons name="sort" size={18} color="#eaeaea" />
        <Text style={styles.sortText}>
          {sort === "recent" ? "Recent" : "A–Z"}
        </Text>
      </Pressable>
    </View>
  );
}

function FilterChips({
  active,
  onToggle,
}: {
  active: FilterKey | null;
  onToggle: (k: FilterKey | null) => void;
}) {
  return (
    <View style={styles.chips}>
      {FILTERS.map((k) => {
        const selected = active === k;
        return (
          <Pressable
            key={k}
            onPress={() => onToggle(selected ? null : k)}
            style={[styles.chip, selected && styles.chipActive]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextActive]}>
              {k}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AddPlaylistTile() {
  return (
    <Pressable style={styles.addTile}>
      <View style={styles.addIcon}>
        <Ionicons name="add" size={20} color="#111" />
      </View>
      <Text style={styles.addText}>Add playlist</Text>
    </Pressable>
  );
}

function Row({ item, onPress }: { item: LibraryItem; onPress: () => void }) {
  const circle = item.type === "artist";
  const Cover = (
    <View style={[styles.cover, circle && styles.coverCircle]}>
      {item.cover ? (
        <Image
          source={{ uri: item.cover }}
          style={[styles.coverImg, circle && styles.coverImgCircle]}
          resizeMode="cover"
        />
      ) : (
        <Ionicons name="musical-notes" size={20} color="#9aa0a6" />
      )}
    </View>
  );

  return (
    <Pressable style={styles.row} onPress={onPress}>
      {Cover}
      <View style={styles.rowText}>
        <Text numberOfLines={1} style={styles.rowTitle}>
          {item.title}
        </Text>
        {!!item.subtitle && (
          <Text numberOfLines={1} style={styles.rowSubtitle}>
            {item.subtitle}
          </Text>
        )}
      </View>
      <View style={{ width: 8 }} />
      <Ionicons name="ellipsis-vertical" size={16} color="#9aa0a6" />
    </Pressable>
  );
}

/* ------------------------ Styles ------------------------ */

const BG = "transparent";
const FG = "#eaeaea";
const MUTED = "#9aa0a6";
const CARD = "#1f1f1f";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingBottom: 60 },
  notificationContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 4, android: 8, default: 8 }),
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: FG, fontSize: 28, fontWeight: "800", letterSpacing: 0.2 },
  headerActions: { flexDirection: "row", alignItems: "center" },

  searchRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: { color: FG, flex: 1, paddingVertical: 6, fontSize: 14 },
  sortButton: {
    height: 40,
    minWidth: 82,
    backgroundColor: CARD,
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  sortText: { color: FG, fontSize: 13 },

  chips: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: CARD,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "#fff" },
  chipText: { color: FG, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#111" },

  sectionHeader: {
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { color: FG, fontSize: 18, fontWeight: "800" },
  seeAll: { padding: 6 },
  seeAllText: { color: MUTED, fontSize: 13 },

  addTile: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    padding: 14,
    backgroundColor: CARD,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: FG,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { color: FG, fontWeight: "700" },

  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
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
  coverCircle: { borderRadius: 28 },
  coverImg: { width: "100%", height: "100%" },
  coverImgCircle: { borderRadius: 28 },
  rowText: { flex: 1, marginHorizontal: 12 },
  rowTitle: { color: FG, fontSize: 16, fontWeight: "700" },
  rowSubtitle: { color: MUTED, marginTop: 2, fontSize: 12 },
});
