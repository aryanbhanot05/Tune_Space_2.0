import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';

import {
  ActivityIndicator,
  Button,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { analyzeImageForEmotion } from '../lib/rekognition';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CAPTURE_SIZE = 80;

export default function CaptureScreen() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }



  if (!permission || !isFocused) {
    return <View style={styles.container} />;
  }


  if (!permission.granted) {
    return (
      <View style={styles.grantPermission}>
        <Ionicons name="videocam-off" size={64} color="#666" style={{ marginBottom: 20 }} />
        <Text style={styles.permissionText}>We need camera access to detect your mood.</Text>
        <Button onPress={requestPermission} title="Grant Permission" color="#0a7ea4" />
      </View>
    );
  }

  const takePictureAndAnalyze = async () => {
    const camera = cameraRef.current;
    if (!isCameraReady || isAnalyzing || !camera) return;

    try {
      const picture = await camera.takePictureAsync({
        quality: 0.5,
        skipProcessing: false,
        shutterSound: false,
      });

      if (!picture || !picture.uri) throw new Error("Capture failed");

      setIsAnalyzing(true);

      const base64 = await FileSystem.readAsStringAsync(picture.uri, {
        encoding: 'base64',
      });

      const emotion = (await analyzeImageForEmotion(base64)) || 'DEFAULT';
      console.log('Detected Emotion:', emotion);

      router.replace({ pathname: '/(tabs)/main', params: { emotion } });

    } catch (error) {
      console.error("Error:", error);
      router.replace({ pathname: '/(tabs)/main', params: { emotion: 'DEFAULT' } });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        onCameraReady={() => setIsCameraReady(true)}
        active={isFocused}
      >
        <View style={[styles.overlayContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Mood Scanner</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Face Frame Guide */}
          <View style={styles.guideContainer}>
            <View style={styles.guideFrame}>
              {/* Corners */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.guideText}>Center your face</Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {/* Flip Button */}
            <TouchableOpacity style={styles.secondaryButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={28} color="white" />
            </TouchableOpacity>

            {/* Capture Button */}
            <TouchableOpacity
              style={[styles.captureOuter, !isCameraReady && { opacity: 0.5 }]}
              onPress={takePictureAndAnalyze}
              disabled={!isCameraReady || isAnalyzing}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>

            <View style={styles.secondaryButton} />
          </View>
        </View>

        {isAnalyzing && (
          <BlurView intensity={80} tint="dark" style={styles.absoluteFill}>
            <View style={styles.analyzingContent}>
              <ActivityIndicator size="large" color="#4ADE80" />
              <Text style={styles.analyzingTitle}>Reading Vibes...</Text>
              <Text style={styles.analyzingSubtitle}>Analyzing facial expressions</Text>
            </View>
          </BlurView>
        )}
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
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.9,
    position: 'relative',
    marginBottom: 20,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'rgba(255,255,255,0.6)',
    borderWidth: 4,
    borderRadius: 4,
  },
  cornerTL: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  cornerTR: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
  guideText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginTop: 20,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 40,
  },
  secondaryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureOuter: {
    width: CAPTURE_SIZE,
    height: CAPTURE_SIZE,
    borderRadius: CAPTURE_SIZE / 2,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureInner: {
    width: CAPTURE_SIZE - 16,
    height: CAPTURE_SIZE - 16,
    borderRadius: (CAPTURE_SIZE - 16) / 2,
    backgroundColor: 'white',
  },
  grantPermission: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 20,
  },
  permissionText: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  analyzingContent: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
  },
  analyzingTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  analyzingSubtitle: {
    color: '#ccc',
    fontSize: 14,
  },
});