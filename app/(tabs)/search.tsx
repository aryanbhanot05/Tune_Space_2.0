import React, { useState } from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";

const SONGS = [
  {
    id: "1",
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "Divide",
    art: require("../../assets/images/search_images/shape.png"),
  },
  {
    id: "2",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    art: require("../../assets/images/search_images/blinding.png"),
  },
  {
    id: "3",
    title: "Someone Like You",
    artist: "Adele",
    album: "21",
    art: require("../../assets/images/search_images/someone.png"),
  },
  {
    id: "4",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    art: require("../../assets/images/search_images/levitating.png"),
  },
];

export default function HomePage() {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === "") {
      setSearchResults([]);
    } else {
      const results = SONGS.filter(
        (song) =>
          song.title.toLowerCase().includes(text.toLowerCase()) ||
          song.artist.toLowerCase().includes(text.toLowerCase()) ||
          song.album.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults(results);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>Hi, User</Text>
        <Text style={styles.title}>Search</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by song, artist, or album…"
        placeholderTextColor="#888"
        value={searchText}
        onChangeText={handleSearch}
        autoCorrect={false}
        autoCapitalize="none"
      />

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.songCard1}>
            <Image source={ item.art } style={styles.songArt} />
            <View style={{ marginLeft: 10 }}>
              <Text style={{ color: "white", fontSize: 16 }}>{item.title}</Text>
              <Text style={{ color: "#aaa", fontSize: 14 }}>
                {item.artist} • {item.album}
              </Text>
            </View>
          </TouchableOpacity>
        )}
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
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
    paddingTop: 70,
  },
  searchInput: {
    backgroundColor: "rgba(25, 28, 36, 0.8)", // matching SettingsPage input style
    color: "#e3ffdd",
    padding: 13,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 15,
    marginTop: 20,
    borderColor: "#232f24",
    borderWidth: 1,
    width: "90%",
    fontSize: 18,
  },
  resultsList: {
    maxHeight: 300,
    backgroundColor: "rgba(35, 39, 47, 0.5)", // semi-transparent card-like
    marginHorizontal: 16,
    borderRadius: 15,
    width: "90%",
    padding: 10,
  },
  songArt: {
    width: 68,
    height: 68,
    borderRadius: 15,
    backgroundColor: "#191c24",
  },
  previewBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#1DB954",
    borderRadius: 25,
    alignSelf: "flex-start",
  },
  addBtn: {
    marginLeft: 10,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 18,
    marginLeft: 4,
  },
  loadingText: {
    color: "#88dda5",
    fontSize: 15,
    textAlign: "center",
    marginVertical: 12,
  },
  trendingCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: 'rgba(25,28,36,0.8)',  
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
  trendingImage: {
    width: 120,
    height: 120,
    borderRadius: 15,
    backgroundColor: "#191c24",
  },
  trendingTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  trendingArtist: {
    color: "#ccc",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  // searchInput: {
  //   backgroundColor: "#191c24",
  //   color: "#fff",
  //   padding: 10,
  //   borderRadius: 10,
  //   marginHorizontal: 16,
  //   marginBottom: 10,
  //   marginTop: 20,
  //   borderColor: "#444",
  //   borderWidth: 1,
  //   width: "90%",
  // },
  // resultsList: {
  //   maxHeight: 300,
  //   backgroundColor: "#23272f",
  //   marginHorizontal: 16,
  //   borderRadius: 10,
  //   width: "90%",
  // },
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
  songCard1: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2f3a",
  },
  // songArt: {
  //   width: 68,
  //   height: 68,
  //   borderRadius: 10,
  //   backgroundColor: "#101010",
  // },
  // songCard1: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   padding: 10,
  //   borderBottomWidth: 1,
  //   borderBottomColor: "#2a2f3a",
  // },
  // previewBtn: {
  //   marginTop: 8,
  //   paddingHorizontal: 12,
  //   paddingVertical: 6,
  //   backgroundColor: "#2e3440",
  //   borderRadius: 8,
  //   alignSelf: "flex-start",
  // },
  // addBtn: {
  //   marginLeft: 10,
  //   padding: 6,
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
  // Recommendation styles
  recommendationsContainer: {
    flex: 1,
    width: "90%",
    marginHorizontal: 16,
  },
  recommendationsContent: {
    paddingBottom: 100, // Add bottom padding to prevent navigation bar overlap
  },
  sectionContainer: {
    marginBottom: 24,
  },
  // sectionTitle: {
  //   color: "#ffffff",
  //   fontSize: 20,
  //   fontWeight: "bold",
  //   marginBottom: 12,
  //   marginLeft: 4,
  // },
  // loadingText: {
  //   color: "#aaa",
  //   fontSize: 14,
  //   textAlign: "center",
  //   marginVertical: 20,
  // },
  horizontalScroll: {
    marginHorizontal: -4,
  },
  // Trending tracks styles
  // trendingCard: {
  //   width: 140,
  //   marginRight: 12,
  //   backgroundColor: "#2a2f3a",
  //   borderRadius: 12,
  //   padding: 8,
  //   alignItems: "center",
  // },
  // trendingImage: {
  //   width: 120,
  //   height: 120,
  //   borderRadius: 8,
  //   backgroundColor: "#101010",
  // },
  // trendingTitle: {
  //   color: "#ffffff",
  //   fontSize: 14,
  //   fontWeight: "600",
  //   marginTop: 8,
  //   textAlign: "center",
  // },
  // trendingArtist: {
  //   color: "#aaa",
  //   fontSize: 12,
  //   marginTop: 4,
  //   textAlign: "center",
  // },
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
});
