import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';
import MusicPlayerService from '../lib/musicPlayerService';

export const NotificationDemo: React.FC = () => {
  const { sendNotification } = useNotifications();
  const musicPlayer = MusicPlayerService.getInstance();
  const [isPlaying, setIsPlaying] = React.useState(false);

  const handleSendTestNotification = async () => {
    await sendNotification(
      'Test Notification',
      'This is a test notification from Tune Space!',
      { type: 'test' },
      'system'
    );
  };

  const handleSendMusicNotification = async () => {
    await sendNotification(
      'New Release',
      'Check out the latest album from your favorite artist!',
      { type: 'music', route: '/(tabs)/search' },
      'music'
    );
  };


  const handlePlayDemoTrack = async () => {
    const demoTrack = {
      id: 'demo-1',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      imageUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', // Real album cover
      previewUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: 20000000, // 3:20 in milliseconds
    };

    await musicPlayer.playTrack(demoTrack);
    setIsPlaying(true);
  };

  const handlePlaySecondTrack = async () => {
    const demoTrack = {
      id: 'demo-2',
      title: 'Shape of You',
      artist: 'Ed Sheeran',
      album: '÷ (Divide)',
      imageUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96', // Real album cover
      previewUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: 23300000, // 3:53 in milliseconds
    };

    await musicPlayer.playTrack(demoTrack);
    setIsPlaying(true);
  };

  const handlePlayThirdTrack = async () => {
    const demoTrack = {
      id: 'demo-3',
      title: 'Levitating',
      artist: 'Dua Lipa',
      album: 'Future Nostalgia',
      imageUrl: 'https://i.scdn.co/image/ab67616d0000b273ef24c3c1b4a0b9b5b6b5b5b', // Real album cover
      previewUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: 20300000, // 3:23 in milliseconds
    };

    await musicPlayer.playTrack(demoTrack);
    setIsPlaying(true);
  };

  const handlePauseResume = async () => {
    if (isPlaying) {
      await musicPlayer.pause();
      setIsPlaying(false);
    } else {
      await musicPlayer.resume();
      setIsPlaying(true);
    }
  };

  const handleStop = async () => {
    await musicPlayer.stop();
    setIsPlaying(false);
  };

  const handleNextTrack = async () => {
    await musicPlayer.playNext();
    setIsPlaying(true);
  };

  const handlePreviousTrack = async () => {
    await musicPlayer.playPrevious();
    setIsPlaying(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Demo</Text>

      <TouchableOpacity style={styles.button} onPress={handleSendTestNotification}>
        <Text style={styles.buttonText}>Send Test Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSendMusicNotification}>
        <Text style={styles.buttonText}>Send Music Notification</Text>
      </TouchableOpacity>


      <TouchableOpacity style={[styles.button, styles.musicButton]} onPress={handlePlayDemoTrack}>
        <Text style={styles.buttonText}>🎵 Blinding Lights - The Weeknd</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.musicButton]} onPress={handlePlaySecondTrack}>
        <Text style={styles.buttonText}>🎵 Shape of You - Ed Sheeran</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.musicButton]} onPress={handlePlayThirdTrack}>
        <Text style={styles.buttonText}>🎵 Levitating - Dua Lipa</Text>
      </TouchableOpacity>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={[styles.controlButton, styles.previousButton]} onPress={handlePreviousTrack}>
          <Text style={styles.buttonText}>⏮️ Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, styles.pauseButton]} onPress={handlePauseResume}>
          <Text style={styles.buttonText}>{isPlaying ? '⏸️ Pause' : '▶️ Resume'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, styles.nextButton]} onPress={handleNextTrack}>
          <Text style={styles.buttonText}>⏭️ Next</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={handleStop}>
          <Text style={styles.buttonText}>⏹️ Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    margin: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1DB954',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  musicButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 2,
    backgroundColor: '#4A4A4A',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  previousButton: {
    backgroundColor: '#6A5ACD',
  },
  pauseButton: {
    backgroundColor: '#FFA500',
  },
  nextButton: {
    backgroundColor: '#6A5ACD',
  },
  stopButton: {
    backgroundColor: '#8B0000',
  },
});

//used AI to clear some logics and fixing errors.