import { Audio } from 'expo-av';
import NotificationService, { NowPlayingNotification } from './notificationService';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  imageUrl?: string;
  previewUrl?: string;
  duration: number;
}

class MusicPlayerService {
  private static instance: MusicPlayerService;
  private sound: Audio.Sound | null = null;
  private currentTrack: Track | null = null;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;
  private nowPlayingNotificationId: string | null = null;
  private notificationService: NotificationService;
  private progressInterval: number | null = null;

  private constructor() {
    this.notificationService = NotificationService.getInstance();
    this.initializeAudio();
  }

  public static getInstance(): MusicPlayerService {
    if (!MusicPlayerService.instance) {
      MusicPlayerService.instance = new MusicPlayerService();
    }
    return MusicPlayerService.instance;
  }

  private async initializeAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  public async playTrack(track: Track): Promise<void> {
    try {
      // Stop current track if playing
      if (this.sound) {
        await this.stop();
      }

      this.currentTrack = track;
      this.duration = track.duration;

      // Create sound object
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.previewUrl || 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
        { shouldPlay: true, isLooping: false }
      );

      this.sound = sound;
      this.isPlaying = true;

      // Set up status update listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          this.currentTime = status.positionMillis || 0;
          this.duration = status.durationMillis || track.duration;
          this.isPlaying = status.isPlaying || false;

          // Update now playing notification
          this.updateNowPlayingNotification();
        }
      });

      // Start progress tracking
      this.startProgressTracking();

      // Send now playing notification
      await this.sendNowPlayingNotification();

      console.log('Playing track:', track.title);
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  }

  public async pause(): Promise<void> {
    if (this.sound) {
      await this.sound.pauseAsync();
      this.isPlaying = false;
      this.updateNowPlayingNotification();
    }
  }

  public async resume(): Promise<void> {
    if (this.sound) {
      await this.sound.playAsync();
      this.isPlaying = true;
      this.updateNowPlayingNotification();
    }
  }

  public async stop(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
      this.isPlaying = false;
      this.currentTime = 0;
      this.stopProgressTracking();
      this.cancelNowPlayingNotification();
    }
  }

  public async seekTo(positionMillis: number): Promise<void> {
    if (this.sound) {
      await this.sound.setPositionAsync(positionMillis);
      this.currentTime = positionMillis;
      this.updateNowPlayingNotification();
    }
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private async sendNowPlayingNotification(): Promise<void> {
    if (!this.currentTrack) return;

    const nowPlayingData: NowPlayingNotification = {
      id: this.currentTrack.id,
      title: this.currentTrack.title,
      artist: this.currentTrack.artist,
      album: this.currentTrack.album,
      imageUrl: this.currentTrack.imageUrl,
      duration: this.duration,
      currentTime: this.currentTime,
      isPlaying: this.isPlaying,
      trackId: this.currentTrack.id,
    };

    this.nowPlayingNotificationId = await this.notificationService.sendNowPlayingNotification(nowPlayingData);
  }

  private async updateNowPlayingNotification(): Promise<void> {
    if (!this.currentTrack || !this.nowPlayingNotificationId) return;

    const nowPlayingData: NowPlayingNotification = {
      id: this.currentTrack.id,
      title: this.currentTrack.title,
      artist: this.currentTrack.artist,
      album: this.currentTrack.album,
      imageUrl: this.currentTrack.imageUrl,
      duration: this.duration,
      currentTime: this.currentTime,
      isPlaying: this.isPlaying,
      trackId: this.currentTrack.id,
    };

    await this.notificationService.updateNowPlayingNotification(
      this.nowPlayingNotificationId,
      nowPlayingData
    );
  }

  private async cancelNowPlayingNotification(): Promise<void> {
    if (this.nowPlayingNotificationId) {
      await this.notificationService.cancelNotification(this.nowPlayingNotificationId);
      this.nowPlayingNotificationId = null;
    }
  }

  private startProgressTracking(): void {
    this.progressInterval = setInterval(() => {
      if (this.isPlaying && this.sound) {
        // Simulate progress for demo purposes
        this.currentTime += 1000; // Increment by 1 second

        // If we've reached the end, stop
        if (this.currentTime >= this.duration) {
          this.currentTime = this.duration;
          this.isPlaying = false;
          this.stopProgressTracking();
        }

        this.updateNowPlayingNotification();
      }
    }, 1000); // Update every second
  }

  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  // Play next track
  public async playNext(): Promise<void> {
    // This would typically come from a playlist or queue
    // For demo purposes, we'll cycle through demo tracks
    const demoPlaylist = [
      {
        id: 'track-1',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        duration: 200000, // 3:20
        album: 'After Hours',
        imageUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
      },
      {
        id: 'track-2',
        title: 'Shape of You',
        artist: 'Ed Sheeran',
        duration: 233000, // 3:53
        album: '÷ (Divide)',
        imageUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
      },
      {
        id: 'track-3',
        title: 'Levitating',
        artist: 'Dua Lipa',
        duration: 203000, // 3:23
        album: 'Future Nostalgia',
        imageUrl: 'https://i.scdn.co/image/ab67616d0000b273e2e352d89826aef6dbd5ff8f',
      },
    ];

    const currentIndex = demoPlaylist.findIndex(track => track.id === this.currentTrack?.id);
    const nextIndex = (currentIndex + 1) % demoPlaylist.length;
    const nextTrack = demoPlaylist[nextIndex];

    await this.playTrack(nextTrack);
  }

  // Play previous track
  public async playPrevious(): Promise<void> {
    // This would typically come from a playlist or queue
    // For demo purposes, we'll cycle through demo tracks
    const demoPlaylist = [
      {
        id: 'track-1',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        duration: 200000, // 3:20
        album: 'After Hours',
        imageUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
      },
      {
        id: 'track-2',
        title: 'Shape of You',
        artist: 'Ed Sheeran',
        duration: 233000, // 3:53
        album: '÷ (Divide)',
        imageUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
      },
      {
        id: 'track-3',
        title: 'Levitating',
        artist: 'Dua Lipa',
        duration: 203000, // 3:23
        album: 'Future Nostalgia',
        imageUrl: 'https://i.scdn.co/image/ab67616d0000b273e2e352d89826aef6dbd5ff8f',
      },
    ];

    const currentIndex = demoPlaylist.findIndex(track => track.id === this.currentTrack?.id);
    const prevIndex = currentIndex === 0 ? demoPlaylist.length - 1 : currentIndex - 1;
    const prevTrack = demoPlaylist[prevIndex];

    await this.playTrack(prevTrack);
  }

  // Handle notification actions
  public async handleNotificationAction(action: string): Promise<void> {
    switch (action) {
      case 'PLAY_PAUSE':
        if (this.isPlaying) {
          await this.pause();
        } else {
          await this.resume();
        }
        break;
      case 'NEXT':
        await this.playNext();
        break;
      case 'PREVIOUS':
        await this.playPrevious();
        break;
      case 'LIKE':
        // Implement like/unlike logic
        console.log('Like/unlike requested');
        break;
      default:
        console.log('Unknown notification action:', action);
    }
  }
}

export default MusicPlayerService;
