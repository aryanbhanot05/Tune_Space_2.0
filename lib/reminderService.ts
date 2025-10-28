import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface ReminderSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'custom';
  time: string; // HH:MM format
  days: number[]; // 0-6 (Sunday-Saturday) for weekly reminders
  lastReminderSent?: number;
  reminderCount: number;
}

export interface ReminderTemplate {
  id: string;
  title: string;
  body: string;
  type: 'welcome' | 'discovery' | 'playlist' | 'trending' | 'social';
  priority: 'low' | 'medium' | 'high';
}

class ReminderService {
  private static instance: ReminderService;
  private isInitialized: boolean = false;
  private reminderTemplates: ReminderTemplate[] = [
    {
      id: 'welcome',
      title: '🎵 Welcome to TuneSpace!',
      body: 'Discover amazing music and create your perfect playlist. Start exploring now!',
      type: 'welcome',
      priority: 'high'
    },
    {
      id: 'discovery',
      title: '🔍 Discover New Music',
      body: 'Check out trending tracks and popular artists. Your next favorite song is waiting!',
      type: 'discovery',
      priority: 'medium'
    },
    {
      id: 'playlist',
      title: '📝 Build Your Playlist',
      body: 'Create the perfect playlist for your mood. Add songs and share your musical taste!',
      type: 'playlist',
      priority: 'medium'
    },
    {
      id: 'trending',
      title: '🔥 Trending Now',
      body: 'See what\'s popular right now! New trending tracks are waiting for you.',
      type: 'trending',
      priority: 'low'
    },
    {
      id: 'social',
      title: '👥 Share Your Music',
      body: 'Share your favorite tracks with friends and discover what they\'re listening to!',
      type: 'social',
      priority: 'low'
    }
  ];

  private constructor() {
    this.initializeReminderTemplates();
  }

  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  private async initializeReminderTemplates(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('reminderTemplates');
      if (!stored) {
        await AsyncStorage.setItem('reminderTemplates', JSON.stringify(this.reminderTemplates));
      }
    } catch (error) {
      console.error('Error initializing reminder templates:', error);
    }
  }

  /**
   * Get current reminder settings
   */
  public async getReminderSettings(): Promise<ReminderSettings> {
    try {
      const stored = await AsyncStorage.getItem('reminderSettings');
      if (stored) {
        return JSON.parse(stored);
      }

      // Default settings - automatic reminders every 2 hours
      const defaultSettings: ReminderSettings = {
        enabled: true,
        frequency: 'daily',
        time: '20:00',
        days: [1, 2, 3, 4, 5, 6, 7], // Every day
        reminderCount: 0
      };

      await this.saveReminderSettings(defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error getting reminder settings:', error);
      return {
        enabled: false,
        frequency: 'daily',
        time: '20:00',
        days: [1, 2, 3, 4, 5],
        reminderCount: 0
      };
    }
  }

  /**
   * Update reminder settings
   */
  public async updateReminderSettings(settings: Partial<ReminderSettings>): Promise<boolean> {
    try {
      const currentSettings = await this.getReminderSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await this.saveReminderSettings(updatedSettings);

      // Reschedule reminders if settings changed
      if (settings.enabled !== undefined || settings.frequency || settings.time || settings.days) {
        await this.scheduleReminders();
      }

      return true;
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      return false;
    }
  }

  /**
   * Save reminder settings to storage
   */
  private async saveReminderSettings(settings: ReminderSettings): Promise<void> {
    try {
      await AsyncStorage.setItem('reminderSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving reminder settings:', error);
    }
  }

  /**
   * Schedule reminder notifications based on settings
   */
  public async scheduleReminders(): Promise<void> {
    if (this.isInitialized) {
      console.log('Reminders already scheduled, skipping...');
      return;
    }

    try {
      // Cancel existing reminders
      await this.cancelAllReminders();

      // Schedule automatic reminders every 2 hours
      await this.scheduleAutomaticReminders();

      this.isInitialized = true;
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  }

  /**
   * Schedule automatic reminders every 2 hours
   */
  private async scheduleAutomaticReminders(): Promise<void> {
    try {
      // Schedule reminders every 2 hours starting from now
      for (let i = 0; i < 12; i++) { // Schedule for next 24 hours (12 reminders)
        const trigger: Notifications.TimeIntervalTriggerInput = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: (i + 1) * 2 * 60 * 60, // Every 2 hours
          repeats: true,
        };

        await this.scheduleReminderNotification(`auto_${i}`, trigger);
      }
    } catch (error) {
      console.error('Error scheduling automatic reminders:', error);
    }
  }

  /**
   * Schedule daily reminder
   */
  private async scheduleDailyReminder(hours: number, minutes: number): Promise<void> {
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    };

    await this.scheduleReminderNotification('daily', trigger);
  }

  /**
   * Schedule weekly reminder for specific day
   */
  private async scheduleWeeklyReminder(dayOfWeek: number, hours: number, minutes: number): Promise<void> {
    const trigger: Notifications.CalendarTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday: dayOfWeek,
      hour: hours,
      minute: minutes,
    };

    await this.scheduleReminderNotification(`weekly_${dayOfWeek}`, trigger);
  }

  /**
   * Schedule a reminder notification with a random template
   */
  private async scheduleReminderNotification(identifier: string, trigger: Notifications.NotificationTriggerInput): Promise<void> {
    try {
      const template = this.getRandomReminderTemplate();
      const channelId = Platform.OS === 'android' ? 'reminders' : 'default';

      await Notifications.scheduleNotificationAsync({
        identifier: `reminder_${identifier}`,
        content: {
          title: template.title,
          body: template.body,
          data: {
            type: 'reminder',
            templateId: template.id,
            priority: template.priority,
          },
          sound: true,
          categoryIdentifier: 'REMINDER',
        },
        trigger,
      });

      // Update reminder count without triggering reschedule
      const settings = await this.getReminderSettings();
      await this.saveReminderSettings({
        ...settings,
        reminderCount: settings.reminderCount + 1,
        lastReminderSent: Date.now()
      });
    } catch (error) {
      console.error('Error scheduling reminder notification:', error);
    }
  }

  /**
   * Get a random reminder template
   */
  private getRandomReminderTemplate(): ReminderTemplate {
    const availableTemplates = this.reminderTemplates.filter(t => t.priority !== 'low' || Math.random() < 0.3);
    const randomIndex = Math.floor(Math.random() * availableTemplates.length);
    return availableTemplates[randomIndex] || this.reminderTemplates[0];
  }

  /**
   * Send immediate reminder notification
   */
  public async sendImmediateReminder(): Promise<string> {
    try {
      const template = this.getRandomReminderTemplate();
      const channelId = Platform.OS === 'android' ? 'reminders' : 'default';

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: template.title,
          body: template.body,
          data: {
            type: 'reminder',
            templateId: template.id,
            priority: template.priority,
            immediate: true,
          },
          sound: true,
          categoryIdentifier: 'REMINDER',
        },
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending immediate reminder:', error);
      throw error;
    }
  }

  /**
   * Cancel all reminder notifications
   */
  public async cancelAllReminders(): Promise<void> {
    try {
      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      // Cancel reminder notifications
      const reminderIds = scheduledNotifications
        .filter(notification =>
          notification.identifier?.startsWith('reminder_') ||
          notification.content.data?.type === 'reminder'
        )
        .map(notification => notification.identifier);

      for (const id of reminderIds) {
        if (id) {
          await Notifications.cancelScheduledNotificationAsync(id);
        }
      }
    } catch (error) {
      console.error('Error canceling reminders:', error);
    }
  }

  /**
   * Get reminder statistics
   */
  public async getReminderStats(): Promise<{
    totalReminders: number;
    lastReminderSent?: number;
    nextReminderScheduled?: number;
  }> {
    try {
      const settings = await this.getReminderSettings();
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      const reminderNotifications = scheduledNotifications.filter(
        notification => notification.identifier?.startsWith('reminder_')
      );

      return {
        totalReminders: settings.reminderCount,
        lastReminderSent: settings.lastReminderSent,
        nextReminderScheduled: reminderNotifications.length > 0
          ? Date.now()
          : undefined
      };
    } catch (error) {
      console.error('Error getting reminder stats:', error);
      return {
        totalReminders: 0
      };
    }
  }

  /**
   * Create notification channels for Android
   */
  public async createReminderChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'App Reminders',
        description: 'Reminders to use the app and discover music',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1DB954',
      });
    }
  }

  /**
   * Reset initialization state (for testing or manual rescheduling)
   */
  public resetInitialization(): void {
    this.isInitialized = false;
  }
}

export default ReminderService;
