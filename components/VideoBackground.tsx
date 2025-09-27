import { ResizeMode, Video } from 'expo-av';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const VIDEO_SOURCE = require('../assets/videos/bg1.mp4');

export function VideoBackground() {
    return (
        <View style={styles.container}>
            {/* Video Component */}
            <Video
                style={styles.backgroundVideo}
                source={VIDEO_SOURCE}
                rate={1.0}
                volume={0.0}
                isMuted={true}
                resizeMode={ResizeMode.STRETCH}
                shouldPlay
                isLooping
            />
            {/* Semi-Transparent Overlay for Contrast */}
            <View style={styles.overlay} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
    },
    backgroundVideo: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(17, 22, 26, 0.6)',
        zIndex: 1,
    },
});
