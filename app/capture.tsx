// [CODE FOR: app/capture.tsx]

import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// We've removed all audio-related imports
import { analyzeImageForEmotion } from '../lib/rekognition';

export default function CaptureScreen() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const router = useRouter();
    const cameraRef = useRef<CameraView>(null);
    const [facing, setFacing] = useState<'front' | 'back'>('front');
    const isFocused = useIsFocused();

    // All audio-related useEffects and helper functions have been removed.

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

    const takePictureAndAnalyze = async () => {
        const camera = cameraRef.current;
        if (!isCameraReady || isAnalyzing || !camera) {
            console.warn("Capture aborted: Camera not ready, busy, or ref is null.");
            return;
        }

        let emotion = 'DEFAULT'; // Define emotion in the outer scope

        try {
            const picture = await camera.takePictureAsync({
                quality: 0.7,
                skipProcessing: false,
                shutterSound: false,
            });

            if (!picture || !picture.uri) {
                throw new Error("Failed to save picture, URI is missing.");
            }

            setIsAnalyzing(true);

            const base64 = await FileSystem.readAsStringAsync(picture.uri, {
                encoding: 'base64',
            });

            if (!base64) {
                throw new Error("Failed to get base64 data from file system.");
            }

            emotion = (await analyzeImageForEmotion(base64)) || 'DEFAULT';
            console.log('Detected Emotion:', emotion);

            // --- THIS IS THE NEW FLOW ---
            // We no longer fetch audio here. We just navigate to the main
            // page and pass the emotion as a parameter.
            router.replace({ pathname: '/(tabs)/main', params: { emotion: emotion } });

        } catch (error) {
            console.error("Error during picture capture or analysis:", error);
            // If anything fails, just navigate with the default emotion
            router.replace({ pathname: '/(tabs)/main', params: { emotion: 'DEFAULT' } });
        } finally {
            // Ensure the spinner stops, though navigation will hide it anyway
            setIsAnalyzing(false);
        }
    };

    if (isAnalyzing) {
        return (
            <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.analyzingText}>Analyzing your mood...</Text>
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