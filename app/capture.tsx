import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { analyzeImageForEmotion } from '../lib/rekognition';

export default function CaptureScreen() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    // State to track if the native camera is ready
    const [isCameraReady, setIsCameraReady] = useState(false); 
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
        const camera = cameraRef.current; 

        if (!camera) {
            console.error("Camera reference is null. Cannot take picture."); 
            return;
        }

        if (!isCameraReady) {
            console.warn("Camera reported permissions granted but not yet ready. Waiting...");
            return; 
        }

        setIsAnalyzing(true);
        try {
            // Add a short delay (100ms) to bypass a common native race condition on Android.
            await new Promise(resolve => setTimeout(resolve, 100));

            // FINAL FIX: Aggressively reduce the size and quality to ensure Base64 conversion succeeds.
            // A 640x480 resolution is usually sufficient for Rekognition and minimizes memory.
            const options = { 
                quality: 0.3, 
                base64: true, 
                skipProcessing: true,
                width: 640, 
                height: 480,
                imageType: 'jpeg' // Ensure the format is suitable for Rekognition and efficiency
            };
            
            const data = await camera.takePictureAsync(options);
            
            if (data?.base64) {
                // Analyze the image using the Rekognition service
                const emotion = await analyzeImageForEmotion(data.base64);
                console.log('Detected Emotion:', emotion);
                
                // Navigate to the main screen with the detected emotion as a parameter
                router.replace({ pathname: '/(tabs)/main', params: { emotion: emotion || 'DEFAULT' } });
            } else {
                // The native module failed to produce base64 data.
                throw new Error("Failed to get base64 data from picture.");
            }
        } catch (error) {
            // This catches any remaining native camera error or analysis error.
            console.error("Failed to take or analyze picture:", error);
            alert('Could not analyze your expression. Please try again.');
            setIsAnalyzing(false); // Reset on error
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
                // ESSENTIAL: Set isCameraReady state when the native camera is initialized.
                onCameraReady={() => setIsCameraReady(true)}
            >
                <View style={styles.controlsContainer}>
                    <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                        <Image style={styles.flipImage} source={require('../assets/images/CameraFlip.png')} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[
                            styles.captureButton, 
                            // Dim the button if the camera isn't ready
                            !isCameraReady && { opacity: 0.5 }
                        ]} 
                        onPress={takePictureAndAnalyze}
                        // Disable the button if the camera isn't ready
                        disabled={!isCameraReady}
                    >
                        {/* Show a spinner while the camera is initializing */}
                        {isCameraReady ? (
                            <View style={styles.captureButtonInner} />
                        ) : (
                             <ActivityIndicator size="small" color="#fff" />
                        )}
                       
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