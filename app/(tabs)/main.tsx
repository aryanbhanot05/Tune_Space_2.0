import { NotificationBell } from '@/components/NotificationBell';
import { BlurView } from 'expo-blur';
import { useFonts } from 'expo-font';
import { useLocalSearchParams, useRouter } from 'expo-router'; // NEW: Import useLocalSearchParams
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- NEW AUDIO IMPORTS ---
import { getRandomEmotionSentence } from '@/lib/emotionSentences';
import { fetchAudioFromText } from '@/lib/googleTTS';
import { Audio } from 'expo-av';
// --- END NEW AUDIO IMPORTS ---

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

// Sample data for the carousels
const forYouData = [
  // ... (your existing data)
  { id: '1', title: 'Daily Mix 1', image: require('@/assets/images/search_images/blinding.png') },
  { id: '2', title: 'Daily Mix 2', image: require('@/assets/images/search_images/levitating.png') },
  { id: '3', title: 'Daily Mix 3', image: require('@/assets/images/search_images/shape.png') },
  { id: '4', title: 'Daily Mix 4', image: require('@/assets/images/search_images/someone.png') },
];

const popularData = [
  // ... (your existing data)
  { id: '1', title: 'Top Hits', image: require('@/assets/images/search_images/shape.png') },
  { id: '2', title: 'Global Top 50', image: require('@/assets/images/search_images/someone.png') },
  { id: '3', title: 'Viral Hits', image: require('@/assets/images/search_images/blinding.png') },
  { id: '4', title: 'Trending', image: require('@/assets/images/search_images/levitating.png') },
];

export default function MainScreen() {
  const router = useRouter();
  const [alertShown, setAlertShown] = useState(false);
  // NEW: Get route params
  const params = useLocalSearchParams();
  const emotionParam = params.emotion;

  // NEW: Ref to hold the sound object
  const sound = useRef<Audio.Sound | null>(null);

  const [fontsLoaded] = useFonts({
    'Retro-Vintage': require('@/assets/fonts/Retro Vintage.ttf'),
  });

  // --- NEW: Audio and Speech Logic ---

  // Helper function to unload sound from memory
  const unloadSound = async () => {
    if (sound.current) {
      console.log('Unloading sound...');
      await sound.current.unloadAsync();
      sound.current = null;
    }
  };

  // Helper function to play audio from a base64 string
  const playAudio = async (base64Audio: string) => {
    await unloadSound(); // Unload any previous sound
    try {
      console.log('Loading new sound...');
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${base64Audio}` },
        { shouldPlay: true } // Play immediately
      );
      sound.current = newSound;
    } catch (error) {
      console.error('Failed to load or play audio:', error);
    }
  };

  // This function gets the emotion and triggers the speech
  const handleEmotionSpeech = async () => {
    if (typeof emotionParam === 'string' && emotionParam) {
      console.log(`Emotion param received: ${emotionParam}`);
      // 1. Get the random sentence
      const sentence = getRandomEmotionSentence(emotionParam);
      // 2. Fetch the audio for that sentence
      const base64Audio = await fetchAudioFromText(sentence);
      // 3. Play the audio
      if (base64Audio) {
        await playAudio(base64Audio);
      } else {
        console.error('Failed to get audio, cannot play speech.');
      }
    }
  };

  // This is the main useEffect that runs when the screen loads
  useEffect(() => {
    // Set up the audio mode for iOS (allows playing in silent mode)
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });

    if (fontsLoaded) {
      SplashScreen.hideAsync();
      
      // We only run this logic ONCE when the screen loads
      if (!alertShown) {
        
        // --- REQUEST 2: ALERT REMOVED ---
        // The line below has been removed.
        // alert('Welcome to your space'); 
        
        // --- REQUEST 1: SPEECH ADDED ---
        // Instead, we check for an emotion param and play speech.
        handleEmotionSpeech();
        
        // We still set this to true to prevent this block
        // from running on every re-render.
        setAlertShown(true);
      }
    }

    // NEW: Cleanup function
    // This runs when the component unmounts (e.g., user changes tabs)
    // It unloads the sound from memory to prevent leaks.
    return () => {
      unloadSound();
    };
  }, [fontsLoaded, alertShown, emotionParam]); // We run this when params change

  // --- END of new audio logic ---

  if (!fontsLoaded) {
    return null;
  }

  const renderCarouselItem = ({ item }: { item: { id: string, title: string, image: any } }) => (
    <TouchableOpacity style={styles.carouselItem} onPress={() => console.log('Tapped on', item.title)}>
      <Image source={item.image} style={styles.carouselImage} />
      <Text style={styles.carouselTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>TuneSpace</Text>
            <NotificationBell />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>For You</Text>
            <FlatList
              data={forYouData}
              renderItem={renderCarouselItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular</Text>
            <FlatList
              data={popularData}
              renderItem={renderCarouselItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
            />
          </View>
        </ScrollView>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingTop: 60, // Added padding for status bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: 'Retro-Vintage',
    fontSize: 36,
    color: '#fff',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 20,
    marginBottom: 15,
  },
  carouselContainer: {
    paddingLeft: 20,
  },
  carouselItem: {
    marginRight: 15,
    width: width * 0.4,
  },
  carouselImage: {
    width: '100%',
    height: width * 0.4,
    borderRadius: 10,
    marginBottom: 10,
  },
  carouselTitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});