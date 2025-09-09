import { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


export default function HomePage() {
    const [searchResults, setSearchResults] = useState<any[]>([]);

    return (
        <View style={styles.container}>
            <View style={styles.top}>
                <Text style={styles.title}>{`Hi, User`}</Text>
                <Text style={styles.title}>Search</Text>
            </View>

            <TextInput
                style={styles.searchInput}
                placeholder="Search by song, artist, or album…"
                placeholderTextColor="#888"
                autoCorrect={false}
                autoCapitalize="none"
            />

            <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.songCard1}
                    >
                        <Image
                            source={{ uri: item.thumb || 'https://via.placeholder.com/60' }}
                            style={styles.songArt}
                        />
                        <Text style={styles.resultItem}>
                            {item.title} - {item.artist} {item.album ? `(${item.album})` : ''}
                        </Text>
                    </TouchableOpacity>
                )}
                style={styles.resultsList}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
            />

        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212",
        alignItems: "center",
        justifyContent: "flex-start",
        position: "relative",
    },
    searchInput: {
        backgroundColor: '#191c24',
        color: '#fff',
        padding: 10,
        borderRadius: 10,
        marginHorizontal: 16,
        marginBottom: 10,
        marginTop: 20,
        borderColor: '#444',
        borderWidth: 1,
        width: '90%',
    },
    resultItem: {
        padding: 10,
        color: '#fff'
    },
    resultsList: {
        maxHeight: 180,
        backgroundColor: '#23272f',
        marginHorizontal: 16,
        borderRadius: 10
    },
    top: {
        width: "100%",
        paddingTop: 30,
        height: 140,
        alignItems: "center",
    },
    title: {
        color: "#1DB954",
        fontWeight: "bold",
        fontSize: 48,
        textAlign: "center",
        width: "90%",
    },
    songArt: {
        width: 68,
        height: 68,
        borderRadius: 10,
        marginBottom: 6,
        backgroundColor: "#101010",
    },
    songCard1: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2f3a',
    },
});
