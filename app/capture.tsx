import { useIsFocused } from '@react-navigation/native';
import { Audio } from 'expo-av'; // NEW: Import the audio player
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react'; // NEW: Added useEffect
import { ActivityIndicator, Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchAudioFromText } from '../lib/googleTTS'; // NEW: Import our TTS function
import { analyzeImageForEmotion } from '../lib/rekognition';

export default function CaptureScreen() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const router = useRouter();
    const cameraRef = useRef<CameraView>(null);
    const [facing, setFacing] = useState<'front' | 'back'>('front');
    const isFocused = useIsFocused();
    // NEW: Create a ref to hold the sound object so we can manage it
    const sound = useRef<Audio.Sound | null>(null);

    // NEW: A useEffect to set the audio mode. This is important for iOS.
    useEffect(() => {
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true, // Allows sound to play even if the phone is on silent
            staysActiveInBackground: false,
            shouldDuckAndroid: false,
        });

        // NEW: Cleanup function
        // This runs when the component unmounts (e.g., we navigate away)
        // It unloads the sound from memory to prevent leaks.
        return () => {
            unloadSound();
        };
    }, []);

    // NEW: Helper function to unload the sound
    const unloadSound = async () => {
        if (sound.current) {
            console.log('Unloading sound...');
            await sound.current.unloadAsync();
            sound.current = null;
        }
    };

    // NEW: Helper function to play audio from a base64 string
    const playAudio = async (base64Audio: string) => {
        // Unload any previous sound first
        await unloadSound();

        try {
            console.log('Loading new sound...');
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: `data:audio/mp3;base64,${base64Audio}` },
                { shouldPlay: true } // Tell it to play immediately
            );
            sound.current = newSound;

            // NEW: Set a listener to know when the sound finishes playing
            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    console.log('Audio finished playing.');
                    // We can now safely navigate
                    router.replace({ pathname: '/(tabs)/main', params: { emotion: (status as any).emotionParam || 'DEFAULT' } });
                }
            });

        } catch (error) {
            console.error('Failed to load or play audio:', error);
            // If audio fails, just navigate immediately so the user isn't stuck
            router.replace({ pathname: '/(tabs)/main', params: { emotion: 'DEFAULT' } });
        }
    };

    // NEW: Helper to make the emotion text more human-friendly
    const getEmotionAlertText = (emotion: string): string => {
        // You can customize these sentences as much as you want!
        switch (emotion.toUpperCase()) {
            case 'HAPPY':
                return "You seem to be feeling happy!";
            case 'SAD':
                return "Looks like you might be feeling a bit sad.";
            case 'ANGRY':
                return "You seem to be feeling angry.";
            case 'SURPRISED':
                return "Oh! You look surprised.";
            case 'DISGUSTED':
                return "Hmm, you look disgusted by something.";
            case 'CALM':
                return "You seem to be feeling calm and relaxed.";
            case 'NEUTRAL':
                return "You're looking neutral.";
            case 'DEFAULT':
                return "I'm not quite sure of your mood, but let's find a song.";
            default:
                return `You seem to be feeling ${emotion.toLowerCase()}.`;
        }
    };

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    if (!permission || !isFocused) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.grantPermission}>
                <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="Grant Permission" />
            </View>
        );
    }

    // UPDATED: This whole function is modified
    const takePictureAndAnalyze = async () => {
        const camera = cameraRef.current;
        if (!isCameraReady || isAnalyzing || !camera) {
            console.warn("Capture aborted: Camera not ready, busy, or ref is null.");
            return;
        }

        try {
            const picture = await camera.takePictureAsync({
                quality: 0.7,
                skipProcessing: false,
                shutterSound: false,
            });

            if (!picture || !picture.uri) {
                throw new Error("Failed to save picture, URI is missing.");
            }

            setIsAnalyzing(true); // Show the "Analyzing..." screen

            const base64 = await FileSystem.readAsStringAsync(picture.uri, {
                encoding: 'base64',
            });

            if (!base64) {
                throw new Error("Failed to get base64 data from file system.");
            }

            const emotion = await analyzeImageForEmotion(base64) || 'DEFAULT';
            console.log('Detected Emotion:', emotion);

            // NEW: Generate the text-to-speak
            const textToSpeak = getEmotionAlertText(emotion);

            // NEW: Fetch the audio for that text
            const base64Audio = await fetchAudioFromText(textToSpeak);

            if (base64Audio) {
                // NEW: If we got audio, play it.
                // We need to pass the emotion to the playAudio function so it can
                // navigate to the right screen *after* the audio finishes.
                
                // This is a bit of a workaround: We can't pass params to the
                // setOnPlaybackStatusUpdate callback directly, so we'll attach
                // it to the sound object itself before playing.
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: `data:audio/mp3;base64,${base64Audio}` }
                );
                
                // Attach the emotion param here
                (newSound as any).emotionParam = emotion; 

                sound.current = newSound;

                newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        console.log('Audio finished playing.');
                        // Now we can use the attached param to navigate
                        router.replace({ pathname: '/(tabs)/main', params: { emotion: (status.isLoaded ? (newSound as any).emotionParam : 'DEFAULT') || 'DEFAULT' } });
                        unloadSound(); // Clean up immediately
                    }
                });

                console.log('Playing sound...');
                await newSound.playAsync();

            } else {
                // NEW: Fallback if audio fails
                console.error("Failed to get audio, navigating without speech.");
                router.replace({ pathname: '/(tabs)/main', params: { emotion: emotion } });
            }

        } catch (error) {
            console.error("Error during picture capture or analysis:", error);
            // OLD: We're replacing the alert with a console.error
            // alert('Could not take or analyze picture. Please try again.');
            setIsAnalyzing(false);
            // NEW: If anything fails, just navigate with a default
            router.replace({ pathname: '/(tabs)/main', params: { emotion: 'DEFAULT' } });
        }
    };

    if (isAnalyzing) {
        return (
            <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                {/* UPDATED: Changed the text slightly */}
                <Text style={styles.analyzingText}>Analyzing your mood... one sec</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing={facing}
                ref={cameraRef}
                onCameraReady={() => setIsCameraReady(true)}
                active={isFocused}
            >
                <View style={styles.controlsContainer}>
                    <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                        <Image style={styles.flipImage} source={require('../assets/images/CameraFlip.png')} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.captureButton, !isCameraReady && { opacity: 0.5 }]}
                        onPress={takePictureAndAnalyze}
                        disabled={!isCameraReady || isAnalyzing}
                    >
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>

                    <View style={styles.flipButton} />
                </View>
            </CameraView>
        </View>
    );
}

// ... (Your styles remain unchanged) ...
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingVertical: 20,
        paddingBottom: 40,
    },
    flipButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flipImage: {
        width: '90%',
        height: '90%',
        resizeMode: 'contain',
        tintColor: 'white',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'transparent',
        borderWidth: 4,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
    },
    grantPermission: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#11161a',
    },
    permissionText: {
        color: 'white',
        fontSize: 18,
        marginBottom: 12,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    analyzingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#11161a',
    },
    analyzingText: {
        marginTop: 20,
        color: 'white',
        fontSize: 18,
    }
});