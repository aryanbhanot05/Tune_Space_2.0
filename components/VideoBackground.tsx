import { useTheme } from '@/lib/themeContext';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

export const VIDEO_SOURCE_MAP = {
  bg1: require('../assets/videos/bg1.mp4'),
  bg2: require('../assets/videos/bg2.mp4'),
  bg3: require('../assets/videos/bg3.mp4'),
  bg4: require('../assets/videos/bg4.mp4'),
  bg5: require('../assets/videos/bg5.mp4'),
  bg6: require('../assets/videos/bg6.mp4'),
  bg7: require('../assets/videos/bg7.mp4'),
  bg8: require('../assets/videos/bg8.mp4'),
  bg9: require('../assets/videos/bg9.mp4'),
  bg10: require('../assets/videos/bg10.mp4'),
};

type VideoThemeKey = keyof typeof VIDEO_SOURCE_MAP;

export function VideoBackground() {
  const { selectedTheme } = useTheme();
  const themeKey = selectedTheme || 'bg1';

  // Memoize the source to ensure stable references
  const finalSource = useMemo(() => VIDEO_SOURCE_MAP[themeKey as VideoThemeKey] || VIDEO_SOURCE_MAP.bg1, [themeKey]);

  // useVideoPlayer handles the source lifecycle automatically.
  // We play the video immediately in the setup callback.
  const player = useVideoPlayer(finalSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.backgroundVideo}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />
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