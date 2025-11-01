import { NotificationBell } from "@/components/NotificationBell";
import { VideoBackground } from "@/components/VideoBackground";
import { useNotifications } from "@/contexts/NotificationContext";
import { ensureSpotifySignedIn, getAvailableDevices, playTrack, SimpleTrack } from "@/lib/spotify";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {
    const router = useRouter();
    const { emotion } = useLocalSearchParams<{ emotion?: string }>();
    const [tracks, setTracks] = useState<SimpleTrack[]>([]);
    const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
    const notificationContext = useNotifications();
    const { sendNotification } = notificationContext || {};

    // Debug log
    console.log('Notification context available:', !!notificationContext);
    console.log('Send notification function available:', !!sendNotification);

    useEffect(() => {
        if (emotion) {
            handleEmotion(emotion);
        }
    }, [emotion]);


    const handleEmotion = async (detectedEmotion: string) => {
        setCurrentEmotion(detectedEmotion);
        let searchQuery = "popular happy songs"; // Default search
        let musicSuggestion = "some bump up music";

        // Map Rekognition emotions to Spotify search queries and alert messages
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


        Alert.alert(
            "Mood Detected!",
            `Hey You, you seem to be ${detectedEmotion.toLowerCase()}. Let's play ${musicSuggestion}!`
        );

        // **THE FIX**: Comment out the Spotify logic to be used later.
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
        } catch (error) {
            console.error("Playback error:", error);
            Alert.alert("Error", "Could not start playback. " + (error as Error).message);
        }
    };


    const HandleAnalyzeMood = () => {
        setTracks([]);
        setCurrentEmotion(null);
        router.push('/capture');
    };

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

    const renderTrackItem = ({ item }: { item: SimpleTrack }) => (
        <TouchableOpacity style={styles.trackItem} onPress={() => handlePlayTrack(item.uri)}>
            <Image source={{ uri: item.image || 'https://placehold.co/64' }} style={styles.trackImage} />
            <View style={styles.trackInfo}>
                <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{item.artists}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <VideoBackground />

            {/* Notification Bell */}
            <View style={styles.notificationContainer}>
                <NotificationBell size={28} color="#ffffff" />
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

// sections of this code is provided from AI
// type AI used Gemini 2.5 pro