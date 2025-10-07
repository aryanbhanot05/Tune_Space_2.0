import { supabase } from './supabase';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  music_enabled: boolean;
  system_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  type: 'music' | 'system' | 'now_playing';
  title: string;
  body: string;
  data: any;
  image_url?: string;
  action_url?: string;
  read_at?: string;
  created_at: string;
  expires_at?: string;
}

export interface PushTokenData {
  token: string;
  device_type: 'ios' | 'android' | 'web';
  device_id?: string;
  last_used_at: string;
}

export interface NotificationTemplate {
  id: string;
  type: 'music' | 'system';
  name: string;
  title_template: string;
  body_template: string;
  default_data: any;
  is_active: boolean;
}

class SupabaseNotificationService {
  // Get user notification preferences
  async getUserPreferences(): Promise<NotificationPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_user_notification_preferences', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching notification preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserPreferences:', error);
      return null;
    }
  }

  // Update user notification preferences
  async updateUserPreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.rpc('update_user_notification_preferences', {
        p_user_id: user.id,
        p_music_enabled: preferences.music_enabled,
        p_system_enabled: preferences.system_enabled,
        p_push_enabled: preferences.push_enabled,
        p_email_enabled: preferences.email_enabled,
        p_quiet_hours_start: preferences.quiet_hours_start,
        p_quiet_hours_end: preferences.quiet_hours_end,
        p_quiet_hours_enabled: preferences.quiet_hours_enabled,
      });

      if (error) {
        console.error('Error updating notification preferences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateUserPreferences:', error);
      return null;
    }
  }

  // Store user push token
  async storePushToken(token: string, deviceType: 'ios' | 'android' | 'web', deviceId?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase.rpc('store_user_push_token', {
        p_user_id: user.id,
        p_token: token,
        p_device_type: deviceType,
        p_device_id: deviceId,
      });

      if (error) {
        console.error('Error storing push token:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in storePushToken:', error);
      return false;
    }
  }

  // Get user notifications with pagination
  async getUserNotifications(
    limit: number = 20,
    offset: number = 0,
    type?: 'music' | 'system' | 'now_playing'
  ): Promise<Notification[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_user_notifications', {
        p_user_id: user.id,
        p_limit: limit,
        p_offset: offset,
        p_type: type,
      });

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      return [];
    }
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase.rpc('get_unread_notification_count', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return 0;
    }
  }

  // Send notification using template
  async sendNotification(
    templateName: string,
    templateData: Record<string, any> = {},
    customTitle?: string,
    customBody?: string,
    additionalData?: any,
    imageUrl?: string,
    actionUrl?: string
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          user_id: user.id,
          template_name: templateName,
          template_data: templateData,
          custom_title: customTitle,
          custom_body: customBody,
          data: additionalData,
          image_url: imageUrl,
          action_url: actionUrl,
        }
      });

      if (error) {
        console.error('Error sending notification:', error);
        return false;
      }

      return data?.success || false;
    } catch (error) {
      console.error('Error in sendNotification:', error);
      return false;
    }
  }

  // Send direct push notification
  async sendPushNotification(
    title: string,
    body: string,
    data?: any,
    imageUrl?: string,
    actionUrl?: string
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          title,
          body,
          data,
          image_url: imageUrl,
          action_url: actionUrl,
        }
      });

      if (error) {
        console.error('Error sending push notification:', error);
        return false;
      }

      return data?.success || false;
    } catch (error) {
      console.error('Error in sendPushNotification:', error);
      return false;
    }
  }

  // Get notification templates
  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true)
        .order('type', { ascending: true });

      if (error) {
        console.error('Error fetching notification templates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getNotificationTemplates:', error);
      return [];
    }
  }
}

export const supabaseNotificationService = new SupabaseNotificationService();
