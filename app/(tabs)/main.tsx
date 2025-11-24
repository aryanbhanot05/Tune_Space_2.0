import { NotificationBell } from "@/components/NotificationBell";
import { VideoBackground } from "@/components/VideoBackground";
import { useNotifications } from "@/contexts/NotificationContext";
import { searchTracks } from "@/lib/deezer";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
    
    // Data States
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
    const [isLoadingMusic, setIsLoadingMusic] = useState(false);
    
    // Player States
    const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
    const [isBuffering, setIsBuffering] = useState(false);

    const notificationContext = useNotifications();
    const { setTheme } = useTheme();

    // Refs for Audio Objects
    const voiceSound = useRef<Audio.Sound | null>(null);
    const musicSound = useRef<Audio.Sound | null>(null);

    // Audio Setup & Cleanup
    useEffect(() => {
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        });

        // Cleanup on unmount
        return () => {
            unloadVoice();
            unloadMusic();
        };
    }, []);

    // Handle Emotion Prop
    useEffect(() => {
        if (emotion) {
            handleEmotion(emotion);
        }
    }, [emotion]);

    // --- Audio Cleanup Helpers ---
    const unloadVoice = async () => {
        if (voiceSound.current) {
            try {
                await voiceSound.current.stopAsync();
                await voiceSound.current.unloadAsync();
                voiceSound.current = null;
            } catch (e) { console.log('Error unloading voice', e); }
        }
    };

    const unloadMusic = async () => {
        if (musicSound.current) {
            try {
                await musicSound.current.stopAsync();
                await musicSound.current.unloadAsync();
                musicSound.current = null;
            } catch (e) { console.log('Error unloading music', e); }
        }
    };

    // --- TTS Logic ---
    const playVoice = async (base64Audio: string) => {
        // Stop any playing music before speaking
        if (playingTrackId) {
            await unloadMusic();
            setPlayingTrackId(null);
        }
        await unloadVoice();

        try {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: `data:audio/mp3;base64,${base64Audio}` },
                { shouldPlay: true }
            );
            voiceSound.current = newSound;
        } catch (error) {
            console.error('Failed to load voice:', error);
        }
    };

    // --- Music Player Logic ---
    const handlePlayTrack = async (track: MusicTrack) => {
        // 1. If tapping the currently playing track, toggle pause/stop
        if (playingTrackId === track.id) {
            await unloadMusic();
            setPlayingTrackId(null);
            return;
        }

        // 2. Stop Voice if active
        await unloadVoice();

        // 3. Stop previous music if active
        await unloadMusic();

        // 4. Play new track
        try {
            setIsBuffering(true);
            setPlayingTrackId(track.id); // Set active immediately for UI feedback

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: track.previewUrl },
                { shouldPlay: true }
            );
            
            musicSound.current = newSound;

            // Handle track finishing naturally
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded) {
                    setIsBuffering(status.isBuffering);
                    if (status.didJustFinish) {
                        setPlayingTrackId(null);
                        unloadMusic();
                    }
                }
            });

        } catch (error) {
            console.error("Failed to play music:", error);
            Alert.alert("Playback Error", "Could not play this preview.");
            setPlayingTrackId(null);
            setIsBuffering(false);
        }
    };

    // --- Main Logic Flow ---
    const handleEmotion = async (detectedEmotion: string) => {
        setCurrentEmotion(detectedEmotion);
        
        // 1. Theme Logic
        const emotionToThemeMap: Record<string, string> = {
            'HAPPY': 'bg3', 'CALM': 'bg1', 'SAD': 'bg8',
            'ANGRY': 'bg10', 'SURPRISED': 'bg7', 'FEAR': 'bg9', 'DISGUST': 'bg5',
        };
        const themeKey = emotionToThemeMap[detectedEmotion.toUpperCase()] || 'bg1';
        // setTheme(themeKey); 

        // 2. Fetch Music (Do this first so the list loads while voice speaks)
        fetchMusicForEmotion(detectedEmotion);

        // 3. TTS Logic
        try {
            const sentence = getRandomEmotionSentence(detectedEmotion);
            fetchAudioFromText(sentence).then(base64 => {
                if (base64) playVoice(base64);
            });
        } catch (error) {
            console.error('Error in speech playback:', error);
        }
    };

    const fetchMusicForEmotion = async (emotion: string) => {
        setIsLoadingMusic(true);
        // Ensure any previous music is stopped when new analysis happens
        if (playingTrackId) {
            await unloadMusic();
            setPlayingTrackId(null);
        }

        let query = "top hits";
        switch (emotion.toUpperCase()) {
            case 'HAPPY': query = "happy upbeat pop"; break;
            case 'SAD': query = "sad acoustic piano"; break;
            case 'ANGRY': query = "rock heavy metal"; break;
            case 'SURPRISED': query = "electronic dance"; break;
            case 'CALM': query = "lofi study relax"; break;
            case 'FEAR': query = "dark ambient soundtrack"; break;
            case 'DISGUST': query = "grunge industrial"; break;
            default: query = "global top 50"; break;
        }

        try {
            const result = await searchTracks(query, 10);
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

    const HandleAnalyzeMood = () => {
        // Stop everything before navigating away
        unloadVoice();
        unloadMusic();
        setTracks([]);
        setCurrentEmotion(null);
        setPlayingTrackId(null);
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

    const renderTrackItem = ({ item }: { item: MusicTrack }) => {
        const isPlaying = playingTrackId === item.id;
        
        return (
            <TouchableOpacity 
                style={[styles.trackItem, isPlaying && styles.trackItemActive]} 
                onPress={() => handlePlayTrack(item)}
            >
                <Image source={{ uri: item.image || 'https://placehold.co/64' }} style={styles.trackImage} />
                
                <View style={styles.trackInfo}>
                    <Text style={[styles.trackName, isPlaying && styles.textActive]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={[styles.trackArtist, isPlaying && styles.textActive]} numberOfLines={1}>
                        {item.artist}
                    </Text>
                </View>
                
                {/* Dynamic Icon: Loading vs Pause vs Play */}
                {isPlaying && isBuffering ? (
                    <ActivityIndicator size="small" color="#4ADE80" />
                ) : (
                    <Ionicons 
                        name={isPlaying ? "pause-circle" : "play-circle"} 
                        size={32} 
                        color={isPlaying ? "#4ADE80" : "rgba(255,255,255,0.8)"} 
                    />
                )}
            </TouchableOpacity>
        );
    };

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
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                {isLoadingMusic ? (
                                    <>
                                        <ActivityIndicator size="large" color="#fff" style={{marginBottom: 10}} />
                                        <Text style={styles.emptyStateText}>Curating your playlist...</Text>
                                    </>
                                ) : (
                                    <Text style={styles.emptyStateText}>No songs found.</Text>
                                )}
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
        width: 300,
        height: 300,
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
    trackItemActive: {
        backgroundColor: 'rgba(74, 222, 128, 0.2)', // Light green tint when playing
        borderColor: '#4ADE80',
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
    textActive: {
        color: '#fff', // Force white text when active to ensure contrast
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