import { searchTracks } from './deezer';
import NotificationService from './notificationService';
import { supabaseNotificationService } from './supabaseNotifications';

export interface DeezerNotificationData {
  trackId: string;
  title: string;
  artist: string;
  album?: string;
  imageUrl?: string;
  previewUrl?: string;
  duration?: number;
  genre?: string;
}

export interface DeezerNotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  triggerType: 'new_release' | 'trending' | 'discovery' | 'playlist_update' | 'artist_follow';
  priority: 'low' | 'medium' | 'high';
  data?: Record<string, any>;
}

class DeezerNotificationService {
  private static instance: DeezerNotificationService;
  private notificationService: NotificationService;
  private supabaseService: typeof supabaseNotificationService;

  // Notification templates for different Deezer events
  private templates: DeezerNotificationTemplate[] = [
    {
      id: 'new_release',
      name: 'New Release',
      title: '🎵 New Music Alert!',
      body: '{{artist}} just released "{{title}}"! Check it out now.',
      triggerType: 'new_release',
      priority: 'high'
    },
    {
      id: 'trending_track',
      name: 'Trending Track',
      title: '🔥 Trending Now',
      body: '{{title}} by {{artist}} is trending! Don\'t miss out.',
      triggerType: 'trending',
      priority: 'medium'
    },
    {
      id: 'discovery',
      name: 'Music Discovery',
      title: '🎧 Discover New Music',
      body: 'We found "{{title}}" by {{artist}} that you might love!',
      triggerType: 'discovery',
      priority: 'medium'
    },
    {
      id: 'playlist_suggestion',
      name: 'Playlist Suggestion',
      title: '📝 Playlist Update',
      body: 'Add "{{title}}" by {{artist}} to your playlist?',
      triggerType: 'playlist_update',
      priority: 'low'
    },
    {
      id: 'artist_follow',
      name: 'Artist Follow',
      title: '👤 Follow Artist',
      body: 'Follow {{artist}} to get notified about new releases!',
      triggerType: 'artist_follow',
      priority: 'low'
    }
  ];

  private constructor() {
    this.notificationService = NotificationService.getInstance();
    this.supabaseService = supabaseNotificationService;
  }

  public static getInstance(): DeezerNotificationService {
    if (!DeezerNotificationService.instance) {
      DeezerNotificationService.instance = new DeezerNotificationService();
    }
    return DeezerNotificationService.instance;
  }

  /**
   * Send notification for a specific track
   */
  public async sendTrackNotification(
    templateId: string,
    trackData: DeezerNotificationData,
    customTitle?: string,
    customBody?: string
  ): Promise<string> {
    try {
      const template = this.templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      const title = customTitle || this.formatTemplate(template.title, trackData);
      const body = customBody || this.formatTemplate(template.body, trackData);

      // Send local notification
      const notificationId = await this.notificationService.sendLocalNotification(
        title,
        body,
        {
          type: 'music',
          templateId,
          trackData,
          deezerTrackId: trackData.trackId,
          priority: template.priority
        },
        'music'
      );

      // Send to Supabase backend if available
      try {
        await this.supabaseService.sendNotification(
          template.name,
          { trackData, templateId },
          title,
          body,
          { trackData, templateId },
          trackData.imageUrl
        );
      } catch (supabaseError) {
        console.warn('Failed to send to Supabase backend:', supabaseError);
      }

      return notificationId;
    } catch (error) {
      console.error('Error sending track notification:', error);
      throw error;
    }
  }

  /**
   * Send notification for trending tracks
   */
  public async sendTrendingNotification(
    trackData: DeezerNotificationData,
    position?: number
  ): Promise<string> {
    const title = position
      ? `🔥 #${position} Trending: ${trackData.title}`
      : `🔥 Trending: ${trackData.title}`;

    const body = `${trackData.artist} • ${trackData.album || 'Single'}`;

    return await this.sendTrackNotification('trending_track', trackData, title, body);
  }

  /**
   * Send notification for new releases
   */
  public async sendNewReleaseNotification(trackData: DeezerNotificationData): Promise<string> {
    return await this.sendTrackNotification('new_release', trackData);
  }

  /**
   * Send notification for music discovery
   */
  public async sendDiscoveryNotification(trackData: DeezerNotificationData): Promise<string> {
    return await this.sendTrackNotification('discovery', trackData);
  }

  /**
   * Send notification for playlist suggestions
   */
  public async sendPlaylistSuggestionNotification(trackData: DeezerNotificationData): Promise<string> {
    return await this.sendTrackNotification('playlist_suggestion', trackData);
  }

  /**
   * Send notification for artist follow suggestions
   */
  public async sendArtistFollowNotification(trackData: DeezerNotificationData): Promise<string> {
    return await this.sendTrackNotification('artist_follow', trackData);
  }

  /**
   * Send notification for now playing with Deezer data
   */
  public async sendNowPlayingNotification(trackData: DeezerNotificationData): Promise<string> {
    try {
      const notificationId = await this.notificationService.sendNowPlayingNotification({
        id: trackData.trackId,
        title: trackData.title,
        artist: trackData.artist,
        album: trackData.album,
        imageUrl: trackData.imageUrl,
        duration: trackData.duration || 0,
        currentTime: 0,
        isPlaying: true,
        trackId: trackData.trackId
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending now playing notification:', error);
      throw error;
    }
  }

  /**
   * Search for tracks and send discovery notifications
   */
  public async searchAndNotify(
    query: string,
    limit: number = 5,
    templateId: string = 'discovery'
  ): Promise<string[]> {
    try {
      const searchResults = await searchTracks(query, limit);
      const tracks = searchResults?.data || [];

      const notificationIds: string[] = [];

      for (const track of tracks.slice(0, 3)) { // Limit to 3 notifications
        const trackData: DeezerNotificationData = {
          trackId: String(track.id),
          title: track.title,
          artist: track.artist?.name || 'Unknown Artist',
          album: track.album?.title,
          imageUrl: track.album?.cover_medium || track.album?.cover,
          previewUrl: track.preview,
          duration: track.duration,
          genre: track.artist?.name // Using artist name as genre placeholder
        };

        try {
          const notificationId = await this.sendTrackNotification(templateId, trackData);
          notificationIds.push(notificationId);
        } catch (error) {
          console.error(`Failed to send notification for track ${track.id}:`, error);
        }
      }

      return notificationIds;
    } catch (error) {
      console.error('Error in search and notify:', error);
      throw error;
    }
  }

  /**
   * Get trending tracks and send notifications
   */
  public async getTrendingAndNotify(limit: number = 5): Promise<string[]> {
    try {
      // This would typically call a trending tracks API
      // For now, we'll search for popular terms
      const popularTerms = ['pop', 'rock', 'hip hop', 'electronic', 'jazz'];
      const randomTerm = popularTerms[Math.floor(Math.random() * popularTerms.length)];

      return await this.searchAndNotify(randomTerm, limit, 'trending_track');
    } catch (error) {
      console.error('Error getting trending and notifying:', error);
      throw error;
    }
  }

  /**
   * Format template string with track data
   */
  private formatTemplate(template: string, data: DeezerNotificationData): string {
    return template
      .replace(/\{\{title\}\}/g, data.title)
      .replace(/\{\{artist\}\}/g, data.artist)
      .replace(/\{\{album\}\}/g, data.album || 'Single')
      .replace(/\{\{genre\}\}/g, data.genre || 'Music');
  }

  /**
   * Get available notification templates
   */
  public getTemplates(): DeezerNotificationTemplate[] {
    return this.templates;
  }

  /**
   * Get template by ID
   */
  public getTemplate(templateId: string): DeezerNotificationTemplate | undefined {
    return this.templates.find(t => t.id === templateId);
  }

  /**
   * Add custom template
   */
  public addTemplate(template: DeezerNotificationTemplate): void {
    this.templates.push(template);
  }

  /**
   * Remove template
   */
  public removeTemplate(templateId: string): boolean {
    const index = this.templates.findIndex(t => t.id === templateId);
    if (index > -1) {
      this.templates.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Send bulk notifications for multiple tracks
   */
  public async sendBulkTrackNotifications(
    tracks: DeezerNotificationData[],
    templateId: string = 'discovery',
    delayMs: number = 1000
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    for (let i = 0; i < tracks.length; i++) {
      try {
        const notificationId = await this.sendTrackNotification(templateId, tracks[i]);
        notificationIds.push(notificationId);

        // Add delay between notifications to avoid spam
        if (i < tracks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        console.error(`Failed to send notification for track ${tracks[i].trackId}:`, error);
      }
    }

    return notificationIds;
  }

  /**
   * Schedule notification for later
   */
  public async scheduleTrackNotification(
    templateId: string,
    trackData: DeezerNotificationData,
    delayMs: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const notificationId = await this.sendTrackNotification(templateId, trackData);
          resolve(notificationId);
        } catch (error) {
          reject(error);
        }
      }, delayMs);
    });
  }
}

export default DeezerNotificationService;
