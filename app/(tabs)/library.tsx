import { NotificationBell } from "@/components/NotificationBell";
import { VideoBackground } from "@/components/VideoBackground";
import { getCharts } from "@/lib/deezer";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

type LibraryItem = {
  id: string;
  title: string;
  subtitle?: string;
  cover?: string;
  type: "playlist" | "album" | "artist" | "podcast";
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
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);
  const [sort, setSort] = useState<"recent" | "alpha">("recent");

  // Real Data State
  const [rawSections, setRawSections] = useState<SectionT[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Charts on Mount
  useEffect(() => {
    loadLibraryData();
  }, []);

  const loadLibraryData = async () => {
    try {
      setLoading(true);
      const chartData = await getCharts();

      // Transform Deezer Data into our Section format
      const newSections: SectionT[] = [];

      if (chartData.playlists && chartData.playlists.data) {
        newSections.push({
          title: "Trending Playlists",
          data: chartData.playlists.data.map((p: any) => ({
            id: p.id.toString(),
            title: p.title,
            subtitle: `${p.nb_tracks} tracks`,
            cover: p.picture_medium,
            type: "playlist"
          }))
        });
      }

      if (chartData.albums && chartData.albums.data) {
        newSections.push({
          title: "Top Albums",
          data: chartData.albums.data.map((a: any) => ({
            id: a.id.toString(),
            title: a.title,
            subtitle: a.artist.name,
            cover: a.cover_medium,
            type: "album"
          }))
        });
      }

      if (chartData.artists && chartData.artists.data) {
        newSections.push({
          title: "Popular Artists",
          data: chartData.artists.data.map((a: any) => ({
            id: a.id.toString(),
            title: a.name,
            subtitle: "Artist",
            cover: a.picture_medium,
            type: "artist"
          }))
        });
      }

      setRawSections(newSections);
    } catch (error) {
      console.error("Failed to load library charts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = useMemo(() => {
    const match = (it: LibraryItem) => {
      // Filter by Type Chip
      if (activeFilter === "Playlists" && it.type !== "playlist") return false;
      if (activeFilter === "Albums" && it.type !== "album") return false;
      if (activeFilter === "Artists" && it.type !== "artist") return false;

      // Search Text
      if (!q.trim()) return true;
      const s = `${it.title} ${it.subtitle ?? ""}`.toLowerCase();
      return s.includes(q.toLowerCase());
    };

    // Clone and Filter
    const clone = rawSections.map((s) => ({
      ...s,
      data: s.data.filter(match),
    })).filter((s) => s.data.length > 0);

    // Sort
    clone.forEach((s) => {
      s.data.sort((a, b) => {
        if (sort === "alpha") return a.title.localeCompare(b.title);
        return 0; 
      });
    });

    return clone;
  }, [q, activeFilter, sort, rawSections]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <VideoBackground />

      <Header />

      <SearchRow
        value={q}
        onChangeText={setQ}
        onSortToggle={() => setSort((s) => (s === "recent" ? "alpha" : "recent"))}
        sort={sort}
      />

      <FilterChips active={activeFilter} onToggle={setActiveFilter} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#eaeaea" />
        </View>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <Row
              item={item}
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/main',
                  params: {
                    type: item.type,
                    id: item.id
                  }
                });
              }}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}


function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Charts & Library</Text>
      <View style={styles.headerActions}>
        <Pressable hitSlop={10}>
          <Ionicons name="search" size={22} color="#eaeaea" />
        </Pressable>
        <View style={{ width: 12 }} />
        <NotificationBell size={24} color="#eaeaea" />
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
          placeholder="Filter charts..."
          placeholderTextColor="#1c1c1dff"
          style={styles.input}
          autoCapitalize="none"
        />
      </View>
      <Pressable style={styles.sortButton} onPress={onSortToggle}>
        <MaterialCommunityIcons name="sort" size={18} color="#eaeaea" />
        <Text style={styles.sortText}>
          {sort === "recent" ? "Rank" : "A–Z"}
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
      <Ionicons name="play-circle-outline" size={24} color="#9aa0a6" />
    </Pressable>
  );
}


const BG = "transparent";
const FG = "#eaeaea";
const MUTED = "#9aa0a6";
const CARD = "rgba(255,255,255,0.1)"; 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 4, android: 8, default: 8 }),
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: FG, fontSize: 28, fontWeight: "800", letterSpacing: 0.2 },
  headerActions: { flexDirection: "row", alignItems: "center" },

  searchRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    minWidth: 80,
    backgroundColor: CARD,
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  sortText: { color: 'black', fontSize: 13 },

  chips: {
    paddingHorizontal: 16,
    paddingBottom: 10,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: { color: FG, fontSize: 20, fontWeight: "700" },

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
  rowTitle: { color: FG, fontSize: 16, fontWeight: "600" },
  rowSubtitle: { color: MUTED, marginTop: 4, fontSize: 13 },
});