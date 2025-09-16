import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  SectionList,
  Image,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

type LibraryItem = {
  id: string;
  title: string;
  subtitle?: string;
  cover?: string; // uri
  downloaded?: boolean;
  type: "playlist" | "album" | "artist" | "podcast" | "audiobook";
};

type SectionT = {
  title: string;
  data: LibraryItem[];
};

const MOCK: SectionT[] = [
  {
    title: "Playlists",
    data: [
      {
        id: "pl-liked",
        title: "Liked Songs",
        subtitle: "487 songs",
        type: "playlist",
        downloaded: true,
        cover: undefined,
      },
      {
        id: "pl-gym",
        title: "Gym Hits",
        subtitle: "by You • 64 songs",
        type: "playlist",
        cover: "https://picsum.photos/seed/gym/200",
      },
      {
        id: "pl-focus",
        title: "Deep Focus",
        subtitle: "by TuneSpace",
        type: "playlist",
        cover: "https://picsum.photos/seed/focus/200",
      },
    ],
  },
  {
    title: "Albums",
    data: [
      {
        id: "al-Doo-Wops & Hooligans",
        title: "Doo-Wops & Hooligans",
        subtitle: "Bruno Mars",
        type: "album",
        cover: "https://picsum.photos/seed/doo-wops-hooligans/200",
      },
      {
        id: "al-utopia",
        title: "UTOPIA",
        subtitle: "Travis Scott",
        type: "album",
        cover: "https://picsum.photos/seed/utopia/200",
      },
    ],
  },
  {
    title: "Artists",
    data: [
      {
        id: "ar-drake",
        title: "Drake",
        type: "artist",
        cover: "https://picsum.photos/seed/drake/200",
      },
      {
        id: "ar-weeknd",
        title: "The Weeknd",
        type: "artist",
        cover: "https://picsum.photos/seed/weeknd/200",
      },
    ],
  },
];

const FILTERS = ["Playlists", "Albums", "Artists", "Downloaded"] as const;
type FilterKey = (typeof FILTERS)[number];

export default function LibraryScreen() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState<FilterKey | null>(null);
  const [sort, setSort] = useState<"recent" | "alpha">("recent");

  const sections = useMemo(() => {
    // filter -> flatten -> filter by q -> regroup by title in same order
    const match = (it: LibraryItem) => {
      if (active === "Downloaded" && !it.downloaded) return false;
      if (active === "Playlists" && it.type !== "playlist") return false;
      if (active === "Albums" && it.type !== "album") return false;
      if (active === "Artists" && it.type !== "artist") return false;
      if (!q.trim()) return true;
      const s = `${it.title} ${it.subtitle ?? ""}`.toLowerCase();
      return s.includes(q.toLowerCase());
    };

    const clone = MOCK.map((s) => ({
      ...s,
      data: [...s.data].filter(match),
    })).filter((s) => s.data.length);

    // sorting inside each section
    clone.forEach((s) => {
      s.data.sort((a, b) => {
        if (sort === "alpha") return a.title.localeCompare(b.title);
        return b.id.localeCompare(a.id);
      });
    });

    return clone;
  }, [q, active, sort]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
            <Pressable onPress={() => {}} hitSlop={8} style={styles.seeAll}>
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </View>
        )}
        renderItem={({ item }) => (
          <Row item={item} onPress={() => router.push(`/(tabs)/main`)} />
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
    <Link href="/(tabs)/main" asChild>
      <Pressable style={styles.addTile}>
        <View style={styles.addIcon}>
          <Ionicons name="add" size={20} color="#111" />
        </View>
        <Text style={styles.addText}>Add playlist</Text>
      </Pressable>
    </Link>
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
      {!!item.downloaded && (
        <Ionicons name="download-outline" size={18} color="#9aa0a6" />
      )}
      <View style={{ width: 8 }} />
      <Ionicons name="ellipsis-vertical" size={16} color="#9aa0a6" />
    </Pressable>
  );
}

/* ------------------------ Styles ------------------------ */

const BG = "#121212";
const FG = "#eaeaea";
const MUTED = "#9aa0a6";
const CARD = "#1f1f1f";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
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
