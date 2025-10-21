import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import NotificationService, { AppNotification, NowPlayingNotification } from '../lib/notificationService';
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationService] = useState(() => {
    try {
      return NotificationService.getInstance();
    } catch (error) {
      console.error('Failed to create NotificationService:', error);
      return null;
    }
  });

  // Initialize notification service
  useEffect(() => {
    if (!notificationService) {
      console.warn('NotificationService not available');
      return;
    }

    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
        await syncWithBackend();
        refreshNotifications();
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
      }
    };

    initializeNotifications();
  }, [notificationService]);

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
    try {
      return await supabaseNotificationService.getUserPreferences();
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  };

  // Update user preferences
  const updateUserPreferences = async (preferences: any): Promise<boolean> => {
    try {
      const result = await supabaseNotificationService.updateUserPreferences(preferences);
      return !!result;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  };

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    sendNotification: sendNotification || (() => Promise.reject(new Error('Notification service not available'))),
    sendNowPlayingNotification: sendNowPlayingNotification || (() => Promise.reject(new Error('Notification service not available'))),
    updateNowPlayingNotification: updateNowPlayingNotification || (() => Promise.reject(new Error('Notification service not available'))),
    markAsRead: markAsRead || (() => Promise.reject(new Error('Notification service not available'))),
    markAllAsRead: markAllAsRead || (() => Promise.reject(new Error('Notification service not available'))),
    clearAllNotifications: clearAllNotifications || (() => Promise.reject(new Error('Notification service not available'))),
    cancelNotification: cancelNotification || (() => Promise.reject(new Error('Notification service not available'))),
    refreshNotifications: refreshNotifications || (() => {}),
    syncWithBackend: syncWithBackend || (() => Promise.resolve()),
    sendTemplateNotification: sendTemplateNotification || (() => Promise.resolve(false)),
    getUserPreferences: getUserPreferences || (() => Promise.resolve(null)),
    updateUserPreferences: updateUserPreferences || (() => Promise.resolve(false)),
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
