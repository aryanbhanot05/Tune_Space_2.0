import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { Platform } from 'react-native';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  type: 'music' | 'system' | 'now_playing';
  timestamp: number;
  read: boolean;
  imageUrl?: string;
}

export interface NowPlayingNotification {
  id: string;
  title: string;
  artist: string;
  album?: string;
  imageUrl?: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  trackId: string;
}

class NotificationService {
  private static instance: NotificationService;
  private notifications: AppNotification[] = [];
  private pushToken: string | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    // Don't auto-initialize in constructor to prevent loops
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification service with proper configuration
   * Sets up notification handlers, channels, and permissions
   * @returns Promise<void>
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Notification service already initialized, skipping...');
      return;
    }

    try {
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Create notification channels for Android
      await this.createNotificationChannels();

      // Register for push notifications (will use placeholder in Expo Go)
      await this.registerForPushNotifications();

      // Load saved notifications
      await this.loadNotifications();
      this.isInitialized = true;
      console.log('✅ Notification service initialized successfully');
      console.log('📱 Local notifications: Available');
      console.log('🔔 Media controls: Available');
      console.log('📤 Push notifications: Limited in Expo Go (use development build for full support)');
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Create notification channels for Android devices
   * Sets up different channels for music, system, and now playing notifications
   * @returns Promise<void>
   */
  private async createNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('music', {
        name: 'Music Notifications',
        description: 'Notifications about music and playlists',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1DB954',
      });

      await Notifications.setNotificationChannelAsync('system', {
        name: 'System Notifications',
        description: 'General app notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1DB954',
      });

      await Notifications.setNotificationChannelAsync('now_playing', {
        name: 'Now Playing',
        description: 'Current music playback notifications',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0],
        lightColor: '#1DB954',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
    }
  }

  // Register for push notifications
  private async registerForPushNotifications(): Promise<void> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        this.pushToken = 'no-permission-token';
        return;
      }

      // Skip push token generation in development mode or Expo Go to avoid errors
      if (__DEV__ || process.env.EXPO_PUBLIC_APP_VARIANT === 'expo-go') {
        this.pushToken = 'dev-token-placeholder';
        console.log('Development mode: Using placeholder push token (local notifications will work)');
        return;
      }

      try {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        this.pushToken = token;
        console.log('Push token:', token);
      } catch (pushError) {
        console.log('Push notifications not available in Expo Go - using placeholder token');
        this.pushToken = 'expo-go-placeholder';
      }
    } catch (error) {
      console.log('Push notifications not available - using placeholder token');
      // Set a placeholder token to allow local notifications to work
      this.pushToken = 'error-token-placeholder';
    }
  }

  /**
   * Send a local notification to the device
   * @param title - The notification title
   * @param body - The notification body text
   * @param data - Optional data payload
   * @param type - The type of notification (music, system, now_playing)
   * @returns Promise<string> - The notification ID
   */
  public async sendLocalNotification(
    title: string,
    body: string,
    data?: any,
    type: AppNotification['type'] = 'system'
  ): Promise<string> {
    const channelId = Platform.OS === 'android' ? type : 'default';

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { ...data, type },
        sound: true,
        categoryIdentifier: type.toUpperCase(),
        // Add app icon for notifications
        ...(Platform.OS === 'android' && {
          android: {
            channelId,
            smallIcon: 'ic_launcher',
            largeIcon: require('../assets/images/Emotify.png'),
            color: '#1DB954',
          },
        }),
        ...(Platform.OS === 'ios' && {
          ios: {
            sound: 'default',
            badge: 1,
            _displayInForeground: true,
          },
        }),
      },
      trigger: null,
    });

    // Store notification locally
    const notification: AppNotification = {
      id: notificationId,
      title,
      body,
      data,
      type,
      timestamp: Date.now(),
      read: false,
    };

    this.notifications.unshift(notification);
    await this.saveNotifications();

    return notificationId;
  }

  /**
   * Send a now playing notification with media controls
   * @param track - The track information to display
   * @returns Promise<string> - The notification ID
   */
  public async sendNowPlayingNotification(
    track: NowPlayingNotification
  ): Promise<string> {
    const channelId = Platform.OS === 'android' ? 'now_playing' : 'default';

    // Format time for display
    const formatTime = (ms: number) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const currentTimeFormatted = formatTime(track.currentTime);
    const durationFormatted = formatTime(track.duration);
    const progress = track.duration > 0 ? Math.round((track.currentTime / track.duration) * 100) : 0;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: track.title,
        body: `${track.artist} • ${currentTimeFormatted} / ${durationFormatted} • ${progress}%`,
        data: {
          type: 'now_playing',
          trackId: track.trackId,
          isPlaying: track.isPlaying,
          duration: track.duration,
          currentTime: track.currentTime,
          album: track.album,
          imageUrl: track.imageUrl,
        },
        sound: false, // No sound for now playing
        categoryIdentifier: 'MUSIC_PLAYER',
        // Add media session info for Android
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'now_playing',
            showTimestamp: false,
            color: '#1DB954',
            smallIcon: 'ic_launcher',
            largeIcon: track.imageUrl || require('../assets/images/Emotify.png'),
            style: {
              type: 'media' as any,
              title: track.title,
              body: track.artist,
              picture: track.imageUrl || require('../assets/images/Emotify.png'),
            },
            actions: [
              {
                title: 'Previous',
                icon: 'ic_skip_previous',
                identifier: 'PREVIOUS',
              },
              {
                title: track.isPlaying ? 'Pause' : 'Play',
                icon: track.isPlaying ? 'ic_pause' : 'ic_play_arrow',
                identifier: 'PLAY_PAUSE',
              },
              {
                title: 'Next',
                icon: 'ic_skip_next',
                identifier: 'NEXT',
              },
              {
                title: 'Like',
                icon: 'ic_favorite',
                identifier: 'LIKE',
              },
            ],
          },
        }),
      },
      trigger: null,
    });

    return notificationId;
  }

  // Update now playing notification
  public async updateNowPlayingNotification(
    notificationId: string,
    track: NowPlayingNotification
  ): Promise<void> {
    // Format time for display
    const formatTime = (ms: number) => {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const currentTimeFormatted = formatTime(track.currentTime);
    const durationFormatted = formatTime(track.duration);
    const progress = track.duration > 0 ? Math.round((track.currentTime / track.duration) * 100) : 0;

    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: track.title,
        body: `${track.artist} • ${currentTimeFormatted} / ${durationFormatted} • ${progress}%`,
        data: {
          type: 'now_playing',
          trackId: track.trackId,
          isPlaying: track.isPlaying,
          duration: track.duration,
          currentTime: track.currentTime,
          album: track.album,
          imageUrl: track.imageUrl,
        },
        sound: false,
        categoryIdentifier: 'MUSIC_PLAYER',
        // Add media session info for Android
        ...(Platform.OS === 'android' && {
          android: {
            channelId: 'now_playing',
            showTimestamp: false,
            color: '#1DB954',
            smallIcon: 'ic_launcher',
            largeIcon: track.imageUrl || require('../assets/images/Emotify.png'),
            style: {
              type: 'media' as any,
              title: track.title,
              body: track.artist,
              picture: track.imageUrl || require('../assets/images/Emotify.png'),
            },
            actions: [
              {
                title: 'Previous',
                icon: 'ic_skip_previous',
                identifier: 'PREVIOUS',
              },
              {
                title: track.isPlaying ? 'Pause' : 'Play',
                icon: track.isPlaying ? 'ic_pause' : 'ic_play_arrow',
                identifier: 'PLAY_PAUSE',
              },
              {
                title: 'Next',
                icon: 'ic_skip_next',
                identifier: 'NEXT',
              },
              {
                title: 'Like',
                icon: 'ic_favorite',
                identifier: 'LIKE',
              },
            ],
          },
        }),
      },
      trigger: null,
    });
  }

  // Cancel notification
  public async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Cancel all notifications
  public async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get all notifications
  public getNotifications(): AppNotification[] {
    return this.notifications;
  }

  // Mark notification as read
  public async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await this.saveNotifications();
    }
  }

  // Mark all notifications as read
  public async markAllAsRead(): Promise<void> {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    await this.saveNotifications();
  }

  // Get unread count
  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Clear all notifications
  public async clearAllNotifications(): Promise<void> {
    this.notifications = [];
    await this.saveNotifications();
  }

  // Save notifications to AsyncStorage
  private async saveNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  // Load notifications from AsyncStorage
  private async loadNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  // Get push token
  public getPushToken(): string | null {
    return this.pushToken;
  }

  // Add notification listener
  public addNotificationListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Add notification response listener
  public addNotificationResponseListener(listener: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Test notification with app icon
  public async sendTestNotification(): Promise<string> {
    return await this.sendLocalNotification(
      '🎵 TuneSpace Test',
      'This is a test notification to verify the app icon is displayed correctly!',
      { type: 'test', timestamp: Date.now() },
      'system'
    );
  }

  /**
   * Reset initialization state (for testing or manual reinitialization)
   */
  public resetInitialization(): void {
    this.isInitialized = false;
  }
}

export default NotificationService;