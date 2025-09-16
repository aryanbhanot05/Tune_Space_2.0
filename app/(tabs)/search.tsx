import React, { useState } from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";

const SONGS = [
  {
    id: "1",
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "Divide",
    art: "https://via.placeholder.com/68",
  },
  {
    id: "2",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    art: "https://via.placeholder.com/68",
  },
  {
    id: "3",
    title: "Someone Like You",
    artist: "Adele",
    album: "21",
    art: "https://via.placeholder.com/68",
  },
  {
    id: "4",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    art: "https://via.placeholder.com/68",
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
            <Image source={{ uri: item.art }} style={styles.songArt} />
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
});
