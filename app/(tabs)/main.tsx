import { NotificationBell } from "@/components/NotificationBell";
import { VideoBackground } from "@/components/VideoBackground";
import { useNotifications } from "@/contexts/NotificationContext";
// Replaced Spotify imports with Deezer
import { searchTracks } from "@/lib/deezer";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// --- IMPORTS ---
import { getRandomEmotionSentence } from '@/lib/emotionSentences';
import { fetchAudioFromText } from '@/lib/googleTTS';
import { useTheme } from '@/lib/themeContext';
import { Audio } from 'expo-av';

// Define a simple track interface for our UI
interface MusicTrack {
    id: string;
    name: string;
    artist: string;
    image: string;
    previewUrl: string; // The 30s audio clip
}

export default function WelcomeScreen() {
    const router = useRouter();
    const { emotion } = useLocalSearchParams<{ emotion?: string }>();
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
    const [isLoadingMusic, setIsLoadingMusic] = useState(false);
    
    const notificationContext = useNotifications();
    const { setTheme } = useTheme();

    // Ref to hold the sound object for TTS (Voice)
    const voiceSound = useRef<Audio.Sound | null>(null);

    // Audio Setup & Cleanup
    useEffect(() => {
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        });
        return () => {
            unloadVoice();
        };
    }, []);

    // Handle Emotion Prop
    useEffect(() => {
        if (emotion) {
            handleEmotion(emotion);
        }
    }, [emotion]);

    // --- Audio Helper Functions (Voice) ---
    const unloadVoice = async () => {
        if (voiceSound.current) {
            try {
                await voiceSound.current.unloadAsync();
                voiceSound.current = null;
            } catch (error) {
                console.log('Error unloading voice', error);
            }
        }
    };

    const playVoice = async (base64Audio: string) => {
        await unloadVoice();
        try {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: `data:audio/mp3;base64,${base64Audio}` },
                { shouldPlay: true }
            );
            voiceSound.current = newSound;
        } catch (error) {
            console.error('Failed to load or play voice:', error);
        }
    };

    // --- Logic ---
    const handleEmotion = async (detectedEmotion: string) => {
        setCurrentEmotion(detectedEmotion);
        
        // 1. Theme Logic
        const emotionToThemeMap: Record<string, string> = {
            'HAPPY': 'bg3', 'CALM': 'bg1', 'SAD': 'bg8',
            'ANGRY': 'bg10', 'SURPRISED': 'bg7', 'FEAR': 'bg9', 'DISGUST': 'bg5',
        };
        const themeKey = emotionToThemeMap[detectedEmotion.toUpperCase()] || 'bg1';
        // setTheme(themeKey); // Uncomment to auto-apply theme

        // 2. TTS Logic (Speak the phrase)
        try {
            const sentence = getRandomEmotionSentence(detectedEmotion);
            fetchAudioFromText(sentence).then(base64 => {
                if (base64) playVoice(base64);
            });
        } catch (error) {
            console.error('Error in speech playback:', error);
        }

        // 3. Music Fetching Logic
        fetchMusicForEmotion(detectedEmotion);
    };

    const fetchMusicForEmotion = async (emotion: string) => {
        setIsLoadingMusic(true);
        let query = "top hits";

        switch (emotion.toUpperCase()) {
            case 'HAPPY': query = "happy energetic pop"; break;
            case 'SAD': query = "sad acoustic ballad"; break;
            case 'ANGRY': query = "rock metal intense"; break;
            case 'SURPRISED': query = "electronic dance party"; break;
            case 'CALM': query = "lofi chill relax"; break;
            case 'FEAR': query = "cinematic dark ambient"; break;
            case 'DISGUST': query = "industrial grunge"; break;
            default: query = "global top 50"; break;
        }

        try {
            console.log(`Searching Deezer for: ${query}`);
            const result = await searchTracks(query, 10);
            
            // Transform Deezer API result to our interface
            if (result && result.data) {
                const mappedTracks: MusicTrack[] = result.data.map((t: any) => ({
                    id: t.id.toString(),
                    name: t.title,
                    artist: t.artist.name,
                    image: t.album.cover_medium,
                    previewUrl: t.preview
                }));
                setTracks(mappedTracks);
            }
        } catch (error) {
            console.error("Failed to fetch music:", error);
            Alert.alert("Music Error", "Could not load playlist at this time.");
        } finally {
            setIsLoadingMusic(false);
        }
    };

    const handlePlayTrack = async (track: MusicTrack) => {
        // Placeholder for the next step (Player Integration)
        console.log("Selected track:", track.name, track.previewUrl);
        Alert.alert("Selected", `Ready to play: ${track.name}`);
    };

    const HandleAnalyzeMood = () => {
        setTracks([]);
        setCurrentEmotion(null);
        router.push('/capture');
    };

    // --- UI Helpers ---
    const getEmotionIcon = (emotion: string | null): keyof typeof Ionicons.glyphMap => {
        switch (emotion?.toUpperCase()) {
            case 'HAPPY': return 'happy-outline';
            case 'SAD': return 'sad-outline';
            case 'ANGRY': return 'thunderstorm-outline';
            case 'SURPRISED': return 'flash-outline';
            case 'CALM': return 'leaf-outline';
            case 'FEAR': return 'eye-outline';
            case 'DISGUST': return 'skull-outline';
            default: return 'person-outline';
        }
    };

    const renderTrackItem = ({ item }: { item: MusicTrack }) => (
        <TouchableOpacity style={styles.trackItem} onPress={() => handlePlayTrack(item)}>
            <Image source={{ uri: item.image || 'https://placehold.co/64' }} style={styles.trackImage} />
            <View style={styles.trackInfo}>
                <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
            </View>
            <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <VideoBackground />

            <View style={styles.notificationContainer}>
                <NotificationBell size={28} color="#ffffff" />
            </View>

            {/* Start Screen */}
            {!currentEmotion ? (
                <View style={styles.centerContent}>
                    <TouchableOpacity style={styles.logoContainer} onPress={HandleAnalyzeMood}>
                        <Image style={styles.logo} source={require('../../assets/images/Emotify.png')} />
                    </TouchableOpacity>
                    <Text style={styles.promptText}>Tap to analyze your mood</Text>
                </View>
            ) : (
                <View style={styles.resultsContainer}>
                    {/* Mood Header */}
                    <View style={styles.moodHeader}>
                        <Ionicons name={getEmotionIcon(currentEmotion)} size={60} color="#fff" />
                        <Text style={styles.emotionText}>
                            You seem <Text style={styles.emotionHighlight}>{currentEmotion?.toLowerCase()}</Text>
                        </Text>
                    </View>

                    {/* Track List */}
                    <FlatList
                        data={tracks}
                        renderItem={renderTrackItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        style={{ flex: 1, width: '100%' }}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>
                                    {isLoadingMusic ? "Curating your playlist..." : "No songs found."}
                                </Text>
                            </View>
                        }
                    />

                    <TouchableOpacity style={styles.retryButton} onPress={HandleAnalyzeMood}>
                        <Ionicons name="refresh" size={20} color="white" style={{marginRight: 8}} />
                        <Text style={styles.retryButtonText}>Analyze Again</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    notificationContainer: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
    },
    logoContainer: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    promptText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 22,
        fontWeight: '600',
        textAlign: 'center',
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 80,
        paddingBottom: 20,
    },
    moodHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    emotionText: {
        color: 'white',
        fontSize: 24,
        marginTop: 10,
        fontWeight: '400',
    },
    emotionHighlight: {
        fontWeight: 'bold',
        color: '#4ADE80', 
        textTransform: 'capitalize',
    },
    listContent: {
        paddingBottom: 20,
    },
    trackItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    trackImage: {
        width: 56,
        height: 56,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    trackInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    trackName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    trackArtist: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
    },
    retryButton: {
        flexDirection: 'row',
        backgroundColor: 'rgba(29, 185, 84, 0.9)', 
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 20,
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyStateText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        fontStyle: 'italic',
    }
});