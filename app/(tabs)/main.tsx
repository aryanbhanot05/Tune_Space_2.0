import { VideoBackground } from "@/components/VideoBackground";
import { ensureSpotifySignedIn, getAvailableDevices, playTrack } from "@/lib/spotify"; // Adjust path if needed
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomeScreen() {

  const router = useRouter();

  const HandleAnalyzeMood = async () => {
  try {
    // Make sure the user is signed in
    await ensureSpotifySignedIn();

    // Get the user's available devices
    const devices = await getAvailableDevices();
    if (devices.length === 0) {
      Alert.alert("No Active Devices", "Please open Spotify on one of your devices and try again.");
      return;
    }

    // Find the first active device, or just take the first device if none are active
    const activeDevice = devices.find(d => d.is_active);
    const deviceId = activeDevice?.id ?? devices[0]?.id ?? undefined;

    if (!deviceId) {
      Alert.alert("No Devices Found", "Could not find a device to play on.");
      return;
    }

    // Play the track on the found device
    const trackUri = "spotify:track:7qiZfU4dY1lWllzX7mP3AU"; // Spotify URI for "Shape of You"
    await playTrack(trackUri, deviceId);
    Alert.alert("Playback Started", "Check your Spotify device!");

  } catch (error) {
    console.error("Playback error:", error);
    Alert.alert("Error", "Could not start playback. " + (error as Error).message);
  }
};
  return (
    <View style={styles.container}>
      <VideoBackground />
      <Text style={styles.text}>Welcome Back (User)</Text>

      <TouchableOpacity style={styles.logocontainer} onPress={HandleAnalyzeMood} >
        <Image style={styles.logo} source={require('../../assets/images/Emotify.png')} />
      </TouchableOpacity>
      <Text style={styles.text}>Press The Button above to start.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#transparent',
    gap: 100,

  },
  text: {
    color: 'white',
    fontSize: 25,
  },
  desc: {
    fontSize: 15,
    color: 'white',
  },
  button: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold'
  },
  logocontainer: {
    width: '60%',
    aspectRatio: 1,
  },

  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
});
