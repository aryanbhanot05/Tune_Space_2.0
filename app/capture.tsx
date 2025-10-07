import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { analyzeImageForEmotion } from '../lib/rekognition';

export default function CaptureScreen() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const router = useRouter();
    const cameraRef = useRef<CameraView>(null);
    const [facing, setFacing] = useState<'front' | 'back'>('front');

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.grantpermission}>
                <Text style={{color: 'white', fontSize: 18, marginBottom: 12}}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="Grant Permission" />
            </View>
        );
    }

    const takePictureAndAnalyze = async () => {
        if (cameraRef.current) {
            setIsAnalyzing(true);
            try {
                // Take the picture, requesting base64 data
                const options = { quality: 0.5, base64: true };
                const data = await cameraRef.current.takePictureAsync(options);
                
                if (data?.base64) {
                    // Analyze the image using the Rekognition service
                    const emotion = await analyzeImageForEmotion(data.base64);
                    console.log('Detected Emotion:', emotion);
                    
                    // Navigate to the main screen with the detected emotion as a parameter
                    router.push({ pathname: '/(tabs)/main', params: { emotion: emotion || 'DEFAULT' } });
                } else {
                    throw new Error("Failed to get base64 data from picture.");
                }
            } catch (error) {
                console.error("Failed to take or analyze picture:", error);
                alert('Could not analyze your expression. Please try again.');
                setIsAnalyzing(false); // Reset on error
            }
            // No finally block needed as we navigate away on success
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
            <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                <View style={styles.controlsContainer}>
                    <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                        <Image style={styles.flipImage} source={require('../assets/images/CameraFlip.png')} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.captureButton} onPress={takePictureAndAnalyze}>
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
}

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
    },
    flipImage: {
        width: '100%',
        height: '100%',
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
    grantpermission: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#11161a',
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
