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
  data: Record<string, unknown>;
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
  default_data: Record<string, unknown>;
  is_active: boolean;
}

class SupabaseNotificationService {
  // Get user notification preferences
  async getUserPreferences(): Promise<NotificationPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Try to get from notification_preferences table first
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching notification preferences:', error);
        return null;
      }

      // If no preferences exist, return default preferences
      if (!data) {
        return {
          id: '',
          user_id: user.id,
          music_enabled: true,
          system_enabled: true,
          push_enabled: true,
          email_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          quiet_hours_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
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

      // Check if preferences already exist
      const { data: existingData } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const updateData = {
        user_id: user.id,
        music_enabled: preferences.music_enabled ?? true,
        system_enabled: preferences.system_enabled ?? true,
        push_enabled: preferences.push_enabled ?? true,
        email_enabled: preferences.email_enabled ?? false,
        quiet_hours_start: preferences.quiet_hours_start ?? '22:00',
        quiet_hours_end: preferences.quiet_hours_end ?? '08:00',
        quiet_hours_enabled: preferences.quiet_hours_enabled ?? false,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (existingData) {
        // Update existing preferences
        const { data, error } = await supabase
          .from('notification_preferences')
          .update(updateData)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating notification preferences:', error);
          return null;
        }
        result = data;
      } else {
        // Insert new preferences
        const { data, error } = await supabase
          .from('notification_preferences')
          .insert([{
            ...updateData,
            created_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating notification preferences:', error);
          return null;
        }
        result = data;
      }

      return result;
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

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

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

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
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

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

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

      // First, get the count of unread notifications
      const { count: unreadCount, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (countError) {
        console.error('Error getting unread count:', countError);
        return 0;
      }

      // Then update all unread notifications
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (updateError) {
        console.error('Error marking all notifications as read:', updateError);
        return 0;
      }

      return unreadCount || 0;
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
    additionalData?: Record<string, unknown>,
    imageUrl?: string,
    actionUrl?: string
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.functions.invoke<{ success: boolean }>('send-notification', {
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
    data?: Record<string, unknown>,
    imageUrl?: string,
    actionUrl?: string
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: response, error } = await supabase.functions.invoke<{ success: boolean }>('send-push-notification', {
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

      return response?.success || false;
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
