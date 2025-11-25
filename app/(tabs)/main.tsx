// [CODE FOR: app/index.tsx]

import { NotificationBell } from "@/components/NotificationBell";
import { PointsDisplay } from "@/components/PointsDisplay";
import { VideoBackground } from "@/components/VideoBackground";
import { useNotifications } from "@/contexts/NotificationContext";
import PointsService from "@/lib/pointsService";
import { ensureSpotifySignedIn, getAvailableDevices, playTrack, SimpleTrack } from "@/lib/spotify";
import { useLocalSearchParams, useRouter } from "expo-router";
// MODIFIED: Added 'useRef' to manage the sound object
import React, { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// --- NEW IMPORTS ---
// Add the imports for Audio, our TTS function, and our sentence generator
import { getRandomEmotionSentence } from '@/lib/emotionSentences';
import { fetchAudioFromText } from '@/lib/googleTTS';
import { useTheme } from '@/lib/themeContext';
import { Audio } from 'expo-av';
// --- END NEW IMPORTS ---

export default function WelcomeScreen() {
    const router = useRouter();
    const { emotion } = useLocalSearchParams<{ emotion?: string }>();
    const [tracks, setTracks] = useState<SimpleTrack[]>([]);
    const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
    const notificationContext = useNotifications();
    const { sendNotification } = notificationContext || {};
    const { setTheme } = useTheme();

    // --- NEW: Ref to hold the sound object ---
    const sound = useRef<Audio.Sound | null>(null);



    // Debug log
    console.log('Notification context available:', !!notificationContext);
    console.log('Send notification function available:', !!sendNotification);

    // This is your existing useEffect, it is correct.
    useEffect(() => {
        if (emotion) {
            handleEmotion(emotion);
        }
    }, [emotion]);

    // Initialize points service and check daily login
    useEffect(() => {
        const initializePoints = async () => {
            try {
                const pointsService = PointsService.getInstance();
                await pointsService.initialize();
                await pointsService.checkDailyLogin();
            } catch (error) {
                console.error('Error initializing points:', error);
            }
        };
        initializePoints();
    }, []);

    // --- NEW: useEffect for Audio Setup & Cleanup ---
    // This runs once when the screen loads to set up the audio service
    // and returns a cleanup function to unload sound when the screen is left.
    useEffect(() => {
        // Set up audio mode for iOS (allows playing in silent mode)
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: false,
        });

        // Return a cleanup function
        return () => {
            unloadSound();
        };
    }, []); // Empty array means this runs only on mount and unmount

    // --- NEW: Audio Helper Functions ---

    // Unloads the current sound from memory
    const unloadSound = async () => {
        if (sound.current) {
            console.log('Unloading sound...');
            await sound.current.unloadAsync();
            sound.current = null;
        }
    };

    // Creates and plays a new sound from a base64 string
    const playAudio = async (base64Audio: string) => {
        await unloadSound(); // Unload any previous sound
        try {
            console.log('Loading new sound...');
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: `data:audio/mp3;base64,${base64Audio}` },
                { shouldPlay: true } // Play immediately
            );
            sound.current = newSound; // Store the new sound in our ref
        } catch (error) {
            console.error('Failed to load or play audio:', error);
        }
    };

    // --- END: Audio Helper Functions ---


    // MODIFIED: This function now plays speech instead of an alert.
    const handleEmotion = async (detectedEmotion: string) => {
        setCurrentEmotion(detectedEmotion);
        let searchQuery = "popular happy songs"; // Default search
        let musicSuggestion = "some bump up music";

        // Map Rekognition emotions to Spotify search queries and alert messages
        // This logic is unchanged.
        switch (detectedEmotion.toUpperCase()) {
            case 'HAPPY':
                searchQuery = "happy upbeat pop";
                musicSuggestion = "something upbeat";
                break;
            case 'SAD':
                searchQuery = "sad emotional ballads";
                musicSuggestion = "some emotional ballads";
                break;
            case 'ANGRY':
                searchQuery = "angry rock metal";
                musicSuggestion = "some rock music";
                break;
            case 'SURPRISED':
                searchQuery = "energetic electronic dance";
                musicSuggestion = "some energetic dance music";
                break;
            case 'CALM':
                searchQuery = "calm relaxing instrumental";
                musicSuggestion = "Calm music";
                break;
            case 'FEAR':
                searchQuery = "dark ambient music";
                musicSuggestion = "some dark ambient music";
                break;
            case 'DISGUST':
                searchQuery = "heavy industrial music";
                musicSuggestion = "some heavy industrial music";
                break;
            default:
                searchQuery = "top global hits"; // Fallback for 'DEFAULT' or other emotions
                musicSuggestion = "some of the top global hits";
                break;
        }

        const emotionToThemeMap: Record<string, string> = {
            'HAPPY': 'bg3',    // e.g., A bright, energetic theme
            'CALM': 'bg1',     // e.g., The default, tranquil theme
            'SAD': 'bg8',      // e.g., A darker, muted theme
            'ANGRY': 'bg10',   // e.g., A harsh, aggressive theme
            'SURPRISED': 'bg7',// e.g., A vibrant, unexpected theme
            'FEAR': 'bg9',     // e.g., A tense, dark theme
            'DISGUST': 'bg5',  // (You can adjust these mappings)
        };
        const themeKey = emotionToThemeMap[detectedEmotion.toUpperCase()] || 'bg1';

        Alert.alert(
            'Apply Theme?',
            `Your mood is ${detectedEmotion.toLowerCase()}. Would you like to apply the corresponding theme?`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes',
                    onPress: () => {
                        console.log(`Setting theme to: ${themeKey}`);
                        setTheme(themeKey);
                    },
                },
            ],
            { cancelable: true }
        );

        // --- MODIFICATION: Replaced Alert with Speech ---

        // This is the OLD alert, now removed:
        // Alert.alert(
        //     "Mood Detected!",
        //     `Hey You, you seem to be ${detectedEmotion.toLowerCase()}. Let's play ${musicSuggestion}!`
        // );

        // This is the NEW speech logic:
        try {
            const sentence = getRandomEmotionSentence(detectedEmotion);
            const base64Audio = await fetchAudioFromText(sentence);
            if (base64Audio) {
                await playAudio(base64Audio);
            } else {
                console.error('Failed to get audio, cannot play speech.');
            }
        } catch (error) {
            console.error('Error in speech playback:', error);
        }

        // --- END OF MODIFICATION ---

        // Award points for emotion detection
        try {
            const pointsService = PointsService.getInstance();
            await pointsService.awardPoints('EMOTION_DETECTED', `Detected ${detectedEmotion.toLowerCase()} emotion`);
        } catch (error) {
            console.error('Error awarding points:', error);
        }


        // **THE FIX**: Comment out the Spotify logic to be used later.
        // This is unchanged from your code.
        /*
        try {
            await ensureSpotifySignedIn();
            const searchResults = await searchTracks(searchQuery, 10);
            setTracks(searchResults);
        } catch (error) {
            console.error("Error searching tracks:", error);
            Alert.alert("Error", "Could not fetch songs from Spotify.");
        }
        */
    };

    // This function is unchanged.
    const handlePlayTrack = async (trackUri: string) => {
        try {
            await ensureSpotifySignedIn();
            const devices = await getAvailableDevices();
            if (devices.length === 0) {
                Alert.alert("No Active Devices", "Please open Spotify on one of your devices and try again.");
                return;
            }

            const activeDevice = devices.find(d => d.is_active);
            const deviceId = activeDevice?.id ?? devices[0]?.id ?? undefined;

            if (!deviceId) {
                Alert.alert("No Devices Found", "Could not find a device to play on.");
                return;
            }

            await playTrack(trackUri, deviceId);
            Alert.alert("Playback Started", "Check your Spotify device!");

            // Award points for playing a track
            try {
                const pointsService = PointsService.getInstance();
                await pointsService.awardPoints('SONG_PLAYED', 'Played a song');
            } catch (error) {
                console.error('Error awarding points:', error);
            }
        } catch (error) {
            console.error("Playback error:", error);
            Alert.alert("Error", "Could not start playback. " + (error as Error).message);
        }
    };


    // This function is unchanged.
    const HandleAnalyzeMood = () => {
        setTracks([]);
        setCurrentEmotion(null);
        router.push('/capture');
    };

    // This function is unchanged.
    const handleTestNotification = async () => {
        if (!sendNotification) {
            Alert.alert('Error', 'Notification service not available');
            return;
        }
        try {
            await sendNotification(
                'Test Notification',
                'This is a test notification from Emotify! 🎵',
                { type: 'system', test: true },
                'system'
            );
            Alert.alert('Success', 'Test notification sent!');
        } catch (error) {
            console.error('Error sending test notification:', error);
            Alert.alert('Error', 'Failed to send test notification');
        }
    };

    // This function is unchanged.
    const renderTrackItem = ({ item }: { item: SimpleTrack }) => (
        <TouchableOpacity style={styles.trackItem} onPress={() => handlePlayTrack(item.uri)}>
            <Image source={{ uri: item.image || 'https://placehold.co/64' }} style={styles.trackImage} />
            <View style={styles.trackInfo}>
                <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{item.artists}</Text>
            </View>
        </TouchableOpacity>
    );

    // Your styles are unchanged.
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
            paddingTop: 100,
            gap: 40
        },
        notificationContainer: {
            position: 'absolute',
            top: 50,
            right: 20,
            zIndex: 10,
        },
        pointsContainer: {
            position: 'absolute',
            top: 50,
            left: 20,
            zIndex: 10,
        },
        welcomeText: {
            color: 'white',
            fontSize: 28,
            fontWeight: 'bold',
            position: 'absolute',
            top: 80,
        },
        logoContainer: {
            width: '50%',
            aspectRatio: 1,
            marginBottom: 20,
        },
        logo: {
            width: '100%',
            height: '100%',
            resizeMode: 'contain',
        },
        promptText: {
            color: 'white',
            fontSize: 25,
            textAlign: 'center',
        },
        resultsContainer: {
            flex: 1,
            width: '90%',
            marginTop: 20,
        },
        emotionText: {
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 15,
        },
        trackItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            padding: 10,
            borderRadius: 8,
            marginBottom: 10,
        },
        trackImage: {
            width: 50,
            height: 50,
            borderRadius: 4,
            marginRight: 10,
        },
        trackInfo: {
            flex: 1,
        },
        trackName: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
        },
        trackArtist: {
            color: '#ccc',
            fontSize: 14,
        },
        retryButton: {
            backgroundColor: '#1DB954',
            borderRadius: 25,
            paddingVertical: 15,
            alignItems: 'center',
            marginTop: 20,
            marginBottom: 120,
        },
        retryButtonText: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
        },
        testButton: {
            backgroundColor: '#195829ff',
            borderRadius: 25,
            paddingVertical: 12,
            paddingHorizontal: 24,
            alignItems: 'center',
            marginTop: 20,
        },
        testButtonText: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
        }
    });

    // Your UI is unchanged.
    return (
        <View style={styles.container}>
            <VideoBackground />

            {/* Notification Bell and Points Display */}
            <View style={styles.notificationContainer}>
                <NotificationBell size={28} color="#ffffff" />
            </View>
            <View style={styles.pointsContainer}>
                <PointsDisplay size="small" />
            </View>

            {tracks.length === 0 ? (
                <>
                    <TouchableOpacity style={styles.logoContainer} onPress={HandleAnalyzeMood}>
                        <Image style={styles.logo} source={require('../../assets/images/Emotify.png')} />
                    </TouchableOpacity>
                    <Text style={styles.promptText}>Press the button above to start.</Text>


                    {/* Test Notification Button */}
                    <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
                        <Text style={styles.testButtonText}>Test Notification</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <View style={styles.resultsContainer}>
                    <Text style={styles.emotionText}> you look {currentEmotion?.toLowerCase()}:</Text>
                    <FlatList
                        data={tracks}
                        renderItem={renderTrackItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                    <TouchableOpacity style={styles.retryButton} onPress={HandleAnalyzeMood}>
                        <Text style={styles.retryButtonText}>Analyze Again</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}