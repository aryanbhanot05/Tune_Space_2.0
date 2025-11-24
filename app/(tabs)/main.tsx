import { NotificationBell } from "@/components/NotificationBell";
import { VideoBackground } from "@/components/VideoBackground";
import { useNotifications } from "@/contexts/NotificationContext";
import { searchTracks } from "@/lib/deezer";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

// --- IMPORTS ---
import { getRandomEmotionSentence } from '@/lib/emotionSentences';
import { fetchAudioFromText } from '@/lib/googleTTS';
import { useTheme } from '@/lib/themeContext';
import { Audio } from 'expo-av';

const SCREEN_WIDTH = Dimensions.get('window').width;

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
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false); // Controls the full screen modal

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
      staysActiveInBackground: true, // Keep playing if they background the app
      shouldDuckAndroid: true,
    });

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

  // --- TTS Logic (Voice) ---
  const playVoice = async (base64Audio: string) => {
    await unloadVoice();
    // Don't unload music here; we want voice -> music transition to be smooth
    // actually, if music is playing, we might pause it. 
    // But for the start flow, music hasn't started yet.

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${base64Audio}` },
        { shouldPlay: true }
      );
      voiceSound.current = newSound;

      // When voice finishes, start the music automatically!
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          // AUTO-PLAY: Start first song
          playTrackAtIndex(0);
        }
      });

    } catch (error) {
      console.error('Failed to load voice:', error);
      // If voice fails, just start music immediately
      playTrackAtIndex(0);
    }
  };

  // --- Music Player Logic ---

  const playTrackAtIndex = async (index: number) => {
    if (index < 0 || index >= tracks.length) return;
    
    // Stop previous music
    await unloadMusic();

    const track = tracks[index];
    setCurrentIndex(index);
    setIsBuffering(true);
    setIsPlaying(true);
    setShowPlayer(true); // Open the player modal automatically

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.previewUrl },
        { shouldPlay: true }
      );

      musicSound.current = newSound;

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsBuffering(status.isBuffering);
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
             // Auto-play next song when this one finishes
             playNext();
          }
        }
      });
    } catch (error) {
      console.error("Failed to play music:", error);
      setIsBuffering(false);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    if (!musicSound.current) {
        if(currentIndex !== null) playTrackAtIndex(currentIndex);
        return;
    }

    if (isPlaying) {
      await musicSound.current.pauseAsync();
    } else {
      await musicSound.current.playAsync();
    }
  };

  const playNext = () => {
    if (currentIndex !== null && currentIndex < tracks.length - 1) {
      playTrackAtIndex(currentIndex + 1);
    } else {
      // Loop back to start? or stop
      playTrackAtIndex(0); 
    }
  };

  const playPrevious = () => {
    if (currentIndex !== null && currentIndex > 0) {
      playTrackAtIndex(currentIndex - 1);
    }
  };

  // --- Main Logic Flow ---
  const handleEmotion = async (detectedEmotion: string) => {
    setCurrentEmotion(detectedEmotion);
    
    // 1. Fetch Music First (so list populates)
    // We pass a callback to know when tracks are ready if we wanted strict timing, 
    // but the voice takes time anyway.
    fetchMusicForEmotion(detectedEmotion);

    // 2. TTS Logic
    try {
      const sentence = getRandomEmotionSentence(detectedEmotion);
      fetchAudioFromText(sentence).then(base64 => {
        if (base64) playVoice(base64);
      });
    } catch (error) {
      console.error('Error in speech playback:', error);
      // If voice completely fails, try to play music after a short delay
      setTimeout(() => playTrackAtIndex(0), 1000);
    }
  };

  const fetchMusicForEmotion = async (emotion: string) => {
    setIsLoadingMusic(true);
    if (musicSound.current) {
        await unloadMusic();
        setCurrentIndex(null);
    }

    // IMPROVED QUERIES: Using "hits", "charts", "best of" to get famous artists
    let query = "global top hits";
    switch (emotion.toUpperCase()) {
      case 'HAPPY': query = "happy pop hits"; break;
      case 'SAD': query = "sad emotional hits"; break;
      case 'ANGRY': query = "rock metal classics"; break;
      case 'SURPRISED': query = "viral hits"; break;
      case 'CALM': query = "chill hits acoustic"; break;
      case 'FEAR': query = "dark soundtrack themes"; break;
      case 'DISGUST': query = "hard rock grunge"; break;
      default: query = "billboard hot 100"; break;
    }

    try {
      const result = await searchTracks(query, 15); // Increased limit slightly
      if (result && result.data) {
        const mappedTracks: MusicTrack[] = result.data.map((t: any) => ({
          id: t.id.toString(),
          name: t.title,
          artist: t.artist.name,
          image: t.album.cover_medium || t.album.cover_big, // Prefer bigger image if available
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
    unloadVoice();
    unloadMusic();
    setTracks([]);
    setCurrentEmotion(null);
    setCurrentIndex(null);
    setShowPlayer(false);
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

  const renderTrackItem = ({ item, index }: { item: MusicTrack, index: number }) => {
    const isActive = currentIndex === index;
    
    return (
      <TouchableOpacity 
        style={[styles.trackItem, isActive && styles.trackItemActive]} 
        onPress={() => playTrackAtIndex(index)} // Opens player
      >
        <Image source={{ uri: item.image || 'https://placehold.co/64' }} style={styles.trackImage} />
        
        <View style={styles.trackInfo}>
          <Text style={[styles.trackName, isActive && styles.textActive]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.trackArtist, isActive && styles.textActive]} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>
        
        <Ionicons 
          name="ellipsis-horizontal" 
          size={24} 
          color={isActive ? "#fff" : "rgba(255,255,255,0.6)"} 
        />
      </TouchableOpacity>
    );
  };

  // --- FULL PLAYER COMPONENT ---
  const currentTrack = currentIndex !== null ? tracks[currentIndex] : null;

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
          <View style={styles.moodHeader}>
            <Ionicons name={getEmotionIcon(currentEmotion)} size={60} color="#fff" />
            <Text style={styles.emotionText}>
              You seem <Text style={styles.emotionHighlight}>{currentEmotion?.toLowerCase()}</Text>
            </Text>
          </View>

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
                    <Text style={styles.emptyStateText}>Curating {currentEmotion?.toLowerCase()} hits...</Text>
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

          {/* Mini Player Bar (Optional: Tap to open full player) */}
          {currentTrack && !showPlayer && (
             <TouchableOpacity style={styles.miniPlayer} onPress={() => setShowPlayer(true)}>
                 <Image source={{ uri: currentTrack.image }} style={styles.miniImage} />
                 <View style={{flex:1}}>
                     <Text style={styles.miniTitle} numberOfLines={1}>{currentTrack.name}</Text>
                     <Text style={styles.miniArtist}>{currentTrack.artist}</Text>
                 </View>
                 <TouchableOpacity onPress={togglePlayPause}>
                     <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="white" />
                 </TouchableOpacity>
             </TouchableOpacity>
          )}
        </View>
      )}

      {/* --- FULL SCREEN PLAYER MODAL --- */}
      <Modal
        visible={showPlayer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPlayer(false)}
      >
         <View style={styles.modalContainer}>
            {/* Background Image with Blur */}
            {currentTrack && (
                <Image source={{ uri: currentTrack.image }} style={StyleSheet.absoluteFillObject} blurRadius={30} />
            )}
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Modal Content */}
            <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowPlayer(false)}>
                        <Ionicons name="chevron-down" size={32} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.modalHeaderText}>Now Playing</Text>
                    <TouchableOpacity>
                         <Ionicons name="ellipsis-horizontal" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Album Art */}
                <View style={styles.artContainer}>
                    <Image 
                        source={{ uri: currentTrack?.image || 'https://placehold.co/300' }} 
                        style={styles.bigArt} 
                    />
                </View>

                {/* Info */}
                <View style={styles.songMeta}>
                    <Text style={styles.bigTitle}>{currentTrack?.name || "Unknown Song"}</Text>
                    <Text style={styles.bigArtist}>{currentTrack?.artist || "Unknown Artist"}</Text>
                </View>

                {/* Progress Bar (Visual Only for Preview) */}
                <View style={styles.progressBar}>
                    <View style={styles.progressFill} />
                </View>
                <View style={styles.timeRow}>
                    <Text style={styles.timeText}>0:00</Text>
                    <Text style={styles.timeText}>0:30</Text>
                </View>

                {/* Controls */}
                <View style={styles.controlsRow}>
                    <TouchableOpacity onPress={playPrevious}>
                         <Ionicons name="play-skip-back" size={40} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={togglePlayPause} style={styles.playButtonBig}>
                         {isBuffering ? (
                             <ActivityIndicator color="black" />
                         ) : (
                             <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="black" style={{ marginLeft: isPlaying ? 0 : 4 }} />
                         )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={playNext}>
                         <Ionicons name="play-skip-forward" size={40} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
         </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    width: 150,
    height: 150,
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
    paddingBottom: 100, // Space for mini player
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  trackItemActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderColor: '#4ADE80',
    borderWidth: 1,
  },
  trackImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#333',
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  trackName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  textActive: {
    color: '#4ADE80',
    fontWeight: '700',
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontStyle: 'italic',
  },
  // --- MINI PLAYER ---
  miniPlayer: {
      position: 'absolute',
      bottom: 10,
      left: 10,
      right: 10,
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 20,
  },
  miniImage: {
      width: 40,
      height: 40,
      borderRadius: 4,
      marginRight: 12,
  },
  miniTitle: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14,
  },
  miniArtist: {
      color: '#aaa',
      fontSize: 12,
  },
  // --- FULL PLAYER MODAL ---
  modalContainer: {
      flex: 1,
      backgroundColor: '#121212',
      justifyContent: 'space-between',
      paddingBottom: 40,
  },
  modalContent: {
      flex: 1,
      padding: 24,
      justifyContent: 'space-evenly',
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 20,
  },
  modalHeaderText: {
      color: 'white',
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '600',
  },
  artContainer: {
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 20,
  },
  bigArt: {
      width: SCREEN_WIDTH - 60,
      height: SCREEN_WIDTH - 60,
      borderRadius: 12,
  },
  songMeta: {
      marginTop: 20,
  },
  bigTitle: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 6,
  },
  bigArtist: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 18,
  },
  progressBar: {
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 2,
      marginTop: 20,
      overflow: 'hidden',
  },
  progressFill: {
      height: '100%',
      backgroundColor: 'white',
      width: '30%', // Simulated progress
  },
  timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
  },
  timeText: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 12,
  },
  controlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: 20,
  },
  playButtonBig: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
  }
});