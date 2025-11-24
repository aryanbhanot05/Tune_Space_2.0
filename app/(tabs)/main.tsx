import { NotificationBell } from "@/components/NotificationBell";
import { VideoBackground } from "@/components/VideoBackground";
import { useNotifications } from "@/contexts/NotificationContext";
import { SimpleTrack } from "@/lib/spotify";
import { Ionicons } from "@expo/vector-icons"; // Added for UI icons
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// --- IMPORTS ---
import { getRandomEmotionSentence } from '@/lib/emotionSentences';
import { fetchAudioFromText } from '@/lib/googleTTS';
import { useTheme } from '@/lib/themeContext';
import { Audio } from 'expo-av';

export default function WelcomeScreen() {
    const router = useRouter();
    const { emotion } = useLocalSearchParams<{ emotion?: string }>();
    const [tracks, setTracks] = useState<SimpleTrack[]>([]);
    const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
    const notificationContext = useNotifications();
    const { sendNotification } = notificationContext || {};
    const { setTheme } = useTheme();

    // Ref to hold the sound object
    const sound = useRef<Audio.Sound | null>(null);

    // Audio Setup & Cleanup
    useEffect(() => {
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: false,
        });
        return () => {
            unloadSound();
        };
    }, []);

    // Handle Emotion Prop
    useEffect(() => {
        if (emotion) {
            handleEmotion(emotion);
        }
    }, [emotion]);

    // --- Audio Helper Functions ---
    const unloadSound = async () => {
        if (sound.current) {
            try {
                await sound.current.unloadAsync();
                sound.current = null;
            } catch (error) {
                console.log('Error unloading sound', error);
            }
        }
    };

    const playAudio = async (base64Audio: string) => {
        await unloadSound();
        try {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: `data:audio/mp3;base64,${base64Audio}` },
                { shouldPlay: true }
            );
            sound.current = newSound;
        } catch (error) {
            console.error('Failed to load or play audio:', error);
        }
    };

    // --- Logic ---
    const handleEmotion = async (detectedEmotion: string) => {
        setCurrentEmotion(detectedEmotion);
        
        // Theme Logic
        const emotionToThemeMap: Record<string, string> = {
            'HAPPY': 'bg3',
            'CALM': 'bg1',
            'SAD': 'bg8',
            'ANGRY': 'bg10',
            'SURPRISED': 'bg7',
            'FEAR': 'bg9',
            'DISGUST': 'bg5',
        };
        const themeKey = emotionToThemeMap[detectedEmotion.toUpperCase()] || 'bg1';
        
        // Optional: Automatically set theme or keep the alert prompt if you prefer
        // For smoother UI, you might want to just set it automatically:
        // setTheme(themeKey); 

        // TTS Logic
        try {
            const sentence = getRandomEmotionSentence(detectedEmotion);
            const base64Audio = await fetchAudioFromText(sentence);
            if (base64Audio) {
                await playAudio(base64Audio);
            }
        } catch (error) {
            console.error('Error in speech playback:', error);
        }

        // TODO: Music Fetching Logic will be implemented in the next step
        // For now, we are focusing on the UI layout.
    };

    const handlePlayTrack = async (trackUri: string) => {
        // Placeholder for player logic
        Alert.alert("Play", "Player integration coming in the next update!");
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

    const renderTrackItem = ({ item }: { item: SimpleTrack }) => (
        <TouchableOpacity style={styles.trackItem} onPress={() => handlePlayTrack(item.uri)}>
            <Image source={{ uri: item.image || 'https://placehold.co/64' }} style={styles.trackImage} />
            <View style={styles.trackInfo}>
                <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{item.artists}</Text>
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

            {/* If no emotion is detected yet (or tracks empty and no emotion set), show start screen */}
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

                    {/* Track List (Currently empty until we hook up the backend) */}
                    <FlatList
                        data={tracks}
                        renderItem={renderTrackItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>Fetching your playlist...</Text>
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
        paddingTop: 100,
        paddingBottom: 150
    },
    moodHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    emotionText: {
        color: 'white',
        fontSize: 24,
        marginTop: 10,
        fontWeight: '400',
    },
    emotionHighlight: {
        fontWeight: 'bold',
        color: '#4ADE80', // A nice green/accent color
        textTransform: 'capitalize',
    },
    listContent: {
        paddingBottom: 20,
    },
    trackItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glassmorphism
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
        backgroundColor: 'rgba(29, 185, 84, 0.9)', // Spotify Green-ish
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 50,
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