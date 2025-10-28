import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import DeezerNotificationService, { DeezerNotificationData, DeezerNotificationTemplate } from '../lib/deezerNotificationService';
import NotificationService, { AppNotification, NowPlayingNotification } from '../lib/notificationService';
import ReminderService, { ReminderSettings } from '../lib/reminderService';
import { supabaseNotificationService } from '../lib/supabaseNotifications';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  sendNotification: (title: string, body: string, data?: any, type?: AppNotification['type']) => Promise<string>;
  sendNowPlayingNotification: (track: NowPlayingNotification) => Promise<string>;
  updateNowPlayingNotification: (notificationId: string, track: NowPlayingNotification) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  cancelNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => void;
  // Supabase backend methods
  syncWithBackend: () => Promise<void>;
  sendTemplateNotification: (templateName: string, templateData?: Record<string, any>) => Promise<boolean>;
  getUserPreferences: () => Promise<any>;
  updateUserPreferences: (preferences: any) => Promise<boolean>;
  // Reminder methods
  getReminderSettings: () => Promise<ReminderSettings>;
  updateReminderSettings: (settings: Partial<ReminderSettings>) => Promise<boolean>;
  scheduleReminders: () => Promise<void>;
  sendImmediateReminder: () => Promise<string>;
  cancelAllReminders: () => Promise<void>;
  getReminderStats: () => Promise<any>;
  // Deezer notification methods
  sendDeezerNotification: (templateId: string, trackData: DeezerNotificationData, customTitle?: string, customBody?: string) => Promise<string>;
  sendTrendingNotification: (trackData: DeezerNotificationData, position?: number) => Promise<string>;
  sendNewReleaseNotification: (trackData: DeezerNotificationData) => Promise<string>;
  sendDiscoveryNotification: (trackData: DeezerNotificationData) => Promise<string>;
  sendPlaylistSuggestionNotification: (trackData: DeezerNotificationData) => Promise<string>;
  sendArtistFollowNotification: (trackData: DeezerNotificationData) => Promise<string>;
  sendDeezerNowPlayingNotification: (trackData: DeezerNotificationData) => Promise<string>;
  searchAndNotify: (query: string, limit?: number, templateId?: string) => Promise<string[]>;
  getTrendingAndNotify: (limit?: number) => Promise<string[]>;
  getDeezerTemplates: () => DeezerNotificationTemplate[];
  getDeezerTemplate: (templateId: string) => DeezerNotificationTemplate | undefined;
  // Test notification method
  sendTestNotification: () => Promise<string>;
}

// Create a default context value to avoid undefined issues
const defaultContextValue: NotificationContextType = {
  notifications: [],
  unreadCount: 0,
  sendNotification: async () => '',
  sendNowPlayingNotification: async () => '',
  updateNowPlayingNotification: async () => { },
  markAsRead: async () => { },
  markAllAsRead: async () => { },
  clearAllNotifications: async () => { },
  cancelNotification: async () => { },
  refreshNotifications: () => { },
  syncWithBackend: async () => { },
  sendTemplateNotification: async () => false,
  getUserPreferences: async () => ({}),
  updateUserPreferences: async () => false,
  getReminderSettings: async () => ({ enabled: false, frequency: 'daily', time: '20:00', days: [1, 2, 3, 4, 5, 6, 7], reminderCount: 0 }),
  updateReminderSettings: async () => false,
  scheduleReminders: async () => { },
  sendImmediateReminder: async () => '',
  cancelAllReminders: async () => { },
  getReminderStats: async () => ({ totalSent: 0, lastSent: null, nextReminderScheduled: Date.now() }),
  sendDeezerNotification: async () => '',
  sendTrendingNotification: async () => '',
  sendNewReleaseNotification: async () => '',
  sendDiscoveryNotification: async () => '',
  sendPlaylistSuggestionNotification: async () => '',
  sendArtistFollowNotification: async () => '',
  sendDeezerNowPlayingNotification: async () => '',
  searchAndNotify: async () => [],
  getTrendingAndNotify: async () => [],
  getDeezerTemplates: () => [],
  getDeezerTemplate: () => undefined,
  sendTestNotification: async () => ''
};

const NotificationContext = createContext<NotificationContextType>(defaultContextValue);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const [notificationService] = useState(() => {
    try {
      return NotificationService.getInstance();
    } catch (error) {
      console.error('Failed to create NotificationService:', error);
      return null;
    }
  });
  const [reminderService] = useState(() => {
    try {
      return ReminderService.getInstance();
    } catch (error) {
      console.error('Failed to create ReminderService:', error);
      return null;
    }
  });
  const [deezerNotificationService] = useState(() => {
    try {
      return DeezerNotificationService.getInstance();
    } catch (error) {
      console.error('Failed to create DeezerNotificationService:', error);
      return null;
    }
  });

  // Create a fallback context value if services fail to initialize
  const createFallbackContext = (): NotificationContextType => ({
    notifications: [],
    unreadCount: 0,
    sendNotification: async () => '',
    sendNowPlayingNotification: async () => '',
    updateNowPlayingNotification: async () => { },
    markAsRead: async () => { },
    markAllAsRead: async () => { },
    clearAllNotifications: async () => { },
    cancelNotification: async () => { },
    refreshNotifications: () => { },
    syncWithBackend: async () => { },
    sendTemplateNotification: async () => false,
    getUserPreferences: async () => ({}),
    updateUserPreferences: async () => false,
    getReminderSettings: async () => ({ enabled: false, frequency: 'daily', time: '20:00', days: [1, 2, 3, 4, 5, 6, 7], reminderCount: 0 }),
    updateReminderSettings: async () => false,
    scheduleReminders: async () => { },
    sendImmediateReminder: async () => '',
    cancelAllReminders: async () => { },
    getReminderStats: async () => ({ totalSent: 0, lastSent: null, nextReminderScheduled: Date.now() }),
    sendDeezerNotification: async () => '',
    sendTrendingNotification: async () => '',
    sendNewReleaseNotification: async () => '',
    sendDiscoveryNotification: async () => '',
    sendPlaylistSuggestionNotification: async () => '',
    sendArtistFollowNotification: async () => '',
    sendDeezerNowPlayingNotification: async () => '',
    searchAndNotify: async () => [],
    getTrendingAndNotify: async () => [],
    getDeezerTemplates: () => [],
    getDeezerTemplate: () => undefined,
    sendTestNotification: async () => ''
  });

  // Initialize notification service
  useEffect(() => {
    if (!notificationService) {
      console.warn('NotificationService not available');
      return;
    }

    const initializeNotifications = async () => {
      try {
        if (notificationService) {
          await notificationService.initialize();
          await syncWithBackend();
          refreshNotifications();
        }
        if (reminderService) {
          await reminderService.scheduleReminders();
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        // Log more specific error information for debugging
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        }
        // Still mark as initialized even if services fail
        setIsInitialized(true);
      }
    };

    initializeNotifications();
  }, [notificationService, reminderService]);

  // Initialize reminder service
  useEffect(() => {
    if (!reminderService) {
      console.warn('ReminderService not available');
      return;
    }

    const initializeReminders = async () => {
      try {
        await reminderService.createReminderChannels();
        await reminderService.scheduleReminders();
      } catch (error) {
        console.error('Failed to initialize reminders:', error);
      }
    };

    initializeReminders();
  }, [reminderService]);

  // Set up notification listeners
  useEffect(() => {
    if (!notificationService) {
      return;
    }

    const notificationListener = notificationService.addNotificationListener(
      (notification) => {
        console.log('Notification received:', notification);
        refreshNotifications();
      }
    );

    const responseListener = notificationService.addNotificationResponseListener(
      (response) => {
        console.log('Notification response:', response);
        const { data } = response.notification.request.content;
        const actionIdentifier = response.actionIdentifier;

        // Handle different notification types
        if (data?.type === 'now_playing') {
          // Handle music player actions
          handleMusicPlayerAction({ ...data, actionIdentifier });
        } else {
          // Handle other notification actions
          handleNotificationAction(data);
        }
      }
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [notificationService]);

  // Refresh notifications from service
  const refreshNotifications = () => {
    if (!notificationService) {
      return;
    }
    const allNotifications = notificationService.getNotifications();
    const unread = notificationService.getUnreadCount();
    setNotifications(allNotifications);
    setUnreadCount(unread);
  };

  // Send notification
  const sendNotification = async (
    title: string,
    body: string,
    data?: any,
    type: AppNotification['type'] = 'system'
  ): Promise<string> => {
    if (!notificationService) {
      throw new Error('Notification service not available');
    }
    const notificationId = await notificationService.sendLocalNotification(title, body, data, type);
    refreshNotifications();
    return notificationId;
  };

  // Send now playing notification
  const sendNowPlayingNotification = async (track: NowPlayingNotification): Promise<string> => {
    if (!notificationService) {
      throw new Error('Notification service not available');
    }
    const notificationId = await notificationService.sendNowPlayingNotification(track);
    return notificationId;
  };

  // Update now playing notification
  const updateNowPlayingNotification = async (
    notificationId: string,
    track: NowPlayingNotification
  ): Promise<void> => {
    if (!notificationService) {
      throw new Error('Notification service not available');
    }
    await notificationService.updateNowPlayingNotification(notificationId, track);
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string): Promise<void> => {
    if (!notificationService) {
      throw new Error('Notification service not available');
    }
    await notificationService.markAsRead(notificationId);
    refreshNotifications();
  };

  // Mark all notifications as read
  const markAllAsRead = async (): Promise<void> => {
    if (!notificationService) {
      throw new Error('Notification service not available');
    }
    await notificationService.markAllAsRead();
    refreshNotifications();
  };

  // Clear all notifications
  const clearAllNotifications = async (): Promise<void> => {
    if (!notificationService) {
      throw new Error('Notification service not available');
    }
    await notificationService.clearAllNotifications();
    refreshNotifications();
  };

  // Cancel notification
  const cancelNotification = async (notificationId: string): Promise<void> => {
    if (!notificationService) {
      throw new Error('Notification service not available');
    }
    await notificationService.cancelNotification(notificationId);
    refreshNotifications();
  };

  // Handle music player actions from notifications
  const handleMusicPlayerAction = (data: any) => {
    console.log('Music player action:', data);

    // Use a timeout to avoid circular import issues
    setTimeout(async () => {
      try {
        const { default: MusicPlayerService } = await import('../lib/musicPlayerService');
        const musicPlayer = MusicPlayerService.getInstance();

        // Use the music player's handleNotificationAction method
        if (data.actionIdentifier) {
          await musicPlayer.handleNotificationAction(data.actionIdentifier);
        }
      } catch (error) {
        console.error('Failed to handle music player action:', error);
      }
    }, 0);
  };

  // Handle other notification actions
  const handleNotificationAction = (data: any) => {
    console.log('Notification action:', data);
    // Handle navigation or other actions based on notification data
  };

  // Sync with Supabase backend
  const syncWithBackend = async (): Promise<void> => {
    try {
      // Get notifications from backend
      const backendNotifications = await supabaseNotificationService.getUserNotifications();

      // Get unread count from backend
      const backendUnreadCount = await supabaseNotificationService.getUnreadCount();

      // Update local state
      setUnreadCount(backendUnreadCount);

      // Convert backend notifications to local format
      const localNotifications: AppNotification[] = backendNotifications.map(notif => ({
        id: notif.id,
        title: notif.title,
        body: notif.body,
        data: notif.data,
        type: notif.type,
        timestamp: new Date(notif.created_at).getTime(),
        read: !!notif.read_at,
        imageUrl: notif.image_url,
      }));

      setNotifications(localNotifications);
    } catch (error) {
      console.error('Error syncing with backend:', error);
      // Provide more context about the sync failure
      if (error instanceof Error) {
        console.error('Backend sync error details:', {
          message: error.message,
          operation: 'syncWithBackend',
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  // Send notification using template
  const sendTemplateNotification = async (
    templateName: string,
    templateData: Record<string, any> = {}
  ): Promise<boolean> => {
    try {
      return await supabaseNotificationService.sendNotification(
        templateName,
        templateData
      );
    } catch (error) {
      console.error('Error sending template notification:', error);
      // Log template-specific error details
      if (error instanceof Error) {
        console.error('Template notification error details:', {
          message: error.message,
          templateName,
          templateData,
          timestamp: new Date().toISOString()
        });
      }
      return false;
    }
  };

  // Get user preferences
  const getUserPreferences = async (): Promise<any> => {
    console.log('getUserPreferences called');
    try {
      const result = await supabaseNotificationService.getUserPreferences();
      console.log('getUserPreferences result:', result);
      return result;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  };

  // Update user preferences
  const updateUserPreferences = async (preferences: any): Promise<boolean> => {
    console.log('updateUserPreferences called with:', preferences);
    try {
      const result = await supabaseNotificationService.updateUserPreferences(preferences);
      console.log('updateUserPreferences result:', result);
      return !!result;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  };

  // Reminder methods
  const getReminderSettings = async (): Promise<ReminderSettings> => {
    if (!reminderService) {
      throw new Error('Reminder service not available');
    }
    return await reminderService.getReminderSettings();
  };

  const updateReminderSettings = async (settings: Partial<ReminderSettings>): Promise<boolean> => {
    if (!reminderService) {
      throw new Error('Reminder service not available');
    }
    return await reminderService.updateReminderSettings(settings);
  };

  const scheduleReminders = async (): Promise<void> => {
    if (!reminderService) {
      throw new Error('Reminder service not available');
    }
    return await reminderService.scheduleReminders();
  };

  const sendImmediateReminder = async (): Promise<string> => {
    if (!reminderService) {
      throw new Error('Reminder service not available');
    }
    return await reminderService.sendImmediateReminder();
  };

  const cancelAllReminders = async (): Promise<void> => {
    if (!reminderService) {
      throw new Error('Reminder service not available');
    }
    return await reminderService.cancelAllReminders();
  };

  const getReminderStats = async (): Promise<any> => {
    if (!reminderService) {
      throw new Error('Reminder service not available');
    }
    return await reminderService.getReminderStats();
  };

  // Deezer notification methods
  const sendDeezerNotification = async (
    templateId: string,
    trackData: DeezerNotificationData,
    customTitle?: string,
    customBody?: string
  ): Promise<string> => {
    if (!deezerNotificationService) {
      throw new Error('Deezer notification service not available');
    }
    return await deezerNotificationService.sendTrackNotification(templateId, trackData, customTitle, customBody);
  };

  const sendTrendingNotification = async (trackData: DeezerNotificationData, position?: number): Promise<string> => {
    if (!deezerNotificationService) {
      throw new Error('Deezer notification service not available');
    }
    return await deezerNotificationService.sendTrendingNotification(trackData, position);
  };

  const sendNewReleaseNotification = async (trackData: DeezerNotificationData): Promise<string> => {
    if (!deezerNotificationService) {
      throw new Error('Deezer notification service not available');
    }
    return await deezerNotificationService.sendNewReleaseNotification(trackData);
  };

  const sendDiscoveryNotification = async (trackData: DeezerNotificationData): Promise<string> => {
    if (!deezerNotificationService) {
      throw new Error('Deezer notification service not available');
    }
    return await deezerNotificationService.sendDiscoveryNotification(trackData);
  };

  const sendPlaylistSuggestionNotification = async (trackData: DeezerNotificationData): Promise<string> => {
    if (!deezerNotificationService) {
      throw new Error('Deezer notification service not available');
    }
    return await deezerNotificationService.sendPlaylistSuggestionNotification(trackData);
  };

  const sendArtistFollowNotification = async (trackData: DeezerNotificationData): Promise<string> => {
    if (!deezerNotificationService) {
      throw new Error('Deezer notification service not available');
    }
    return await deezerNotificationService.sendArtistFollowNotification(trackData);
  };

  const sendDeezerNowPlayingNotification = async (trackData: DeezerNotificationData): Promise<string> => {
    if (!deezerNotificationService) {
      throw new Error('Deezer notification service not available');
    }
    return await deezerNotificationService.sendNowPlayingNotification(trackData);
  };

  const searchAndNotify = async (query: string, limit?: number, templateId?: string): Promise<string[]> => {
    if (!deezerNotificationService) {
      throw new Error('Deezer notification service not available');
    }
    return await deezerNotificationService.searchAndNotify(query, limit, templateId);
  };

  const getTrendingAndNotify = async (limit?: number): Promise<string[]> => {
    if (!deezerNotificationService) {
      throw new Error('Deezer notification service not available');
    }
    return await deezerNotificationService.getTrendingAndNotify(limit);
  };

  const getDeezerTemplates = (): DeezerNotificationTemplate[] => {
    if (!deezerNotificationService) {
      return [];
    }
    return deezerNotificationService.getTemplates();
  };

  const getDeezerTemplate = (templateId: string): DeezerNotificationTemplate | undefined => {
    if (!deezerNotificationService) {
      return undefined;
    }
    return deezerNotificationService.getTemplate(templateId);
  };

  // Test notification method
  const sendTestNotification = async (): Promise<string> => {
    if (!notificationService) {
      throw new Error('Notification service not available');
    }
    return await notificationService.sendTestNotification();
  };

  // Create a robust context value that handles service failures gracefully
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    sendNotification: sendNotification || (() => Promise.resolve('')),
    sendNowPlayingNotification: sendNowPlayingNotification || (() => Promise.resolve('')),
    updateNowPlayingNotification: updateNowPlayingNotification || (() => Promise.resolve()),
    markAsRead: markAsRead || (() => Promise.resolve()),
    markAllAsRead: markAllAsRead || (() => Promise.resolve()),
    clearAllNotifications: clearAllNotifications || (() => Promise.resolve()),
    cancelNotification: cancelNotification || (() => Promise.resolve()),
    refreshNotifications: refreshNotifications || (() => { }),
    syncWithBackend: syncWithBackend || (() => Promise.resolve()),
    sendTemplateNotification: sendTemplateNotification || (() => Promise.resolve(false)),
    getUserPreferences: getUserPreferences || (() => Promise.resolve({})),
    updateUserPreferences: updateUserPreferences || (() => Promise.resolve(false)),
    // Reminder methods
    getReminderSettings: getReminderSettings || (() => Promise.resolve({ enabled: false, frequency: 'daily', time: '20:00', days: [1, 2, 3, 4, 5, 6, 7], reminderCount: 0 })),
    updateReminderSettings: updateReminderSettings || (() => Promise.resolve(false)),
    scheduleReminders: scheduleReminders || (() => Promise.resolve()),
    sendImmediateReminder: sendImmediateReminder || (() => Promise.resolve('')),
    cancelAllReminders: cancelAllReminders || (() => Promise.resolve()),
    getReminderStats: getReminderStats || (() => Promise.resolve({ totalSent: 0, lastSent: null, nextReminderScheduled: Date.now() })),
    // Deezer notification methods
    sendDeezerNotification: sendDeezerNotification || (() => Promise.resolve('')),
    sendTrendingNotification: sendTrendingNotification || (() => Promise.resolve('')),
    sendNewReleaseNotification: sendNewReleaseNotification || (() => Promise.resolve('')),
    sendDiscoveryNotification: sendDiscoveryNotification || (() => Promise.resolve('')),
    sendPlaylistSuggestionNotification: sendPlaylistSuggestionNotification || (() => Promise.resolve('')),
    sendArtistFollowNotification: sendArtistFollowNotification || (() => Promise.resolve('')),
    sendDeezerNowPlayingNotification: sendDeezerNowPlayingNotification || (() => Promise.resolve('')),
    searchAndNotify: searchAndNotify || (() => Promise.resolve([])),
    getTrendingAndNotify: getTrendingAndNotify || (() => Promise.resolve([])),
    getDeezerTemplates: getDeezerTemplates || (() => []),
    getDeezerTemplate: getDeezerTemplate || (() => undefined),
    // Test notification method
    sendTestNotification: sendTestNotification || (() => Promise.resolve('')),
  };

  // Always render children, even if services fail to initialize
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  return context;
};
