import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const POINTS_STORAGE_KEY = 'user_points';
const POINTS_HISTORY_KEY = 'points_history';
const LAST_DAILY_LOGIN_KEY = 'last_daily_login';

// Points values for different actions
export const POINTS_VALUES = {
  EMOTION_DETECTED: 10,      // Analyzing emotion from photo
  SONG_PLAYED: 5,            // Playing a song preview
  SONG_ADDED_TO_PLAYLIST: 8, // Adding song to playlist
  SEARCH_PERFORMED: 3,       // Searching for music
  DAILY_LOGIN: 20,           // Daily login bonus
  FIRST_TIME_ACTION: 15,      // First time doing an action
} as const;

export interface PointsTransaction {
  id: string;
  points: number;
  action: string;
  timestamp: number;
  description: string;
}

class PointsService {
  private static instance: PointsService;
  private currentPoints: number = 0;
  private listeners: Set<(points: number) => void> = new Set();

  private constructor() {}

  static getInstance(): PointsService {
    if (!PointsService.instance) {
      PointsService.instance = new PointsService();
    }
    return PointsService.instance;
  }

  // Initialize points from storage or Supabase
  async initialize(): Promise<number> {
    try {
      // Try to get from Supabase first (if user is logged in)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const points = await this.getPointsFromSupabase(session.user.id);
        if (points !== null) {
          this.currentPoints = points;
          await this.savePointsLocally(points);
          return points;
        }
      }

      // Fallback to local storage
      const localPoints = await this.getPointsFromLocalStorage();
      this.currentPoints = localPoints;
      return localPoints;
    } catch (error) {
      console.error('Error initializing points:', error);
      return 0;
    }
  }

  // Get points from Supabase
  private async getPointsFromSupabase(userId: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('user_details')
        .select('points')
        .eq('uuid', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return data.points || 0;
    } catch (error) {
      console.error('Error fetching points from Supabase:', error);
      return null;
    }
  }

  // Get points from local storage
  private async getPointsFromLocalStorage(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(POINTS_STORAGE_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.error('Error reading points from storage:', error);
      return 0;
    }
  }

  // Save points locally
  private async savePointsLocally(points: number): Promise<void> {
    try {
      await AsyncStorage.setItem(POINTS_STORAGE_KEY, points.toString());
    } catch (error) {
      console.error('Error saving points locally:', error);
    }
  }

  // Save points to Supabase
  private async savePointsToSupabase(userId: string, points: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_details')
        .update({ points })
        .eq('uuid', userId);

      if (error) {
        console.error('Error saving points to Supabase:', error);
      }
    } catch (error) {
      console.error('Error saving points to Supabase:', error);
    }
  }

  // Get current points
  getCurrentPoints(): number {
    return this.currentPoints;
  }

  // Award points for an action
  async awardPoints(
    action: keyof typeof POINTS_VALUES,
    description?: string
  ): Promise<number> {
    const pointsToAdd = POINTS_VALUES[action];
    const newTotal = this.currentPoints + pointsToAdd;
    
    this.currentPoints = newTotal;

    // Save to local storage
    await this.savePointsLocally(newTotal);

    // Save to Supabase if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await this.savePointsToSupabase(session.user.id, newTotal);
    }

    // Record transaction
    await this.recordTransaction(pointsToAdd, action, description || action);

    // Notify listeners
    this.notifyListeners(newTotal);

    return newTotal;
  }

  // Record a points transaction
  private async recordTransaction(
    points: number,
    action: string,
    description: string
  ): Promise<void> {
    try {
      const transaction: PointsTransaction = {
        id: Date.now().toString(),
        points,
        action,
        timestamp: Date.now(),
        description,
      };

      // Get existing history
      const historyJson = await AsyncStorage.getItem(POINTS_HISTORY_KEY);
      const history: PointsTransaction[] = historyJson 
        ? JSON.parse(historyJson) 
        : [];

      // Add new transaction (keep last 50)
      history.unshift(transaction);
      const trimmedHistory = history.slice(0, 50);

      await AsyncStorage.setItem(
        POINTS_HISTORY_KEY,
        JSON.stringify(trimmedHistory)
      );
    } catch (error) {
      console.error('Error recording transaction:', error);
    }
  }

  // Get points history
  async getPointsHistory(limit: number = 20): Promise<PointsTransaction[]> {
    try {
      const historyJson = await AsyncStorage.getItem(POINTS_HISTORY_KEY);
      if (!historyJson) return [];
      
      const history: PointsTransaction[] = JSON.parse(historyJson);
      return history.slice(0, limit);
    } catch (error) {
      console.error('Error getting points history:', error);
      return [];
    }
  }

  // Check and award daily login bonus
  async checkDailyLogin(): Promise<boolean> {
    try {
      const today = new Date().toDateString();
      const lastLogin = await AsyncStorage.getItem(LAST_DAILY_LOGIN_KEY);

      if (lastLogin !== today) {
        await AsyncStorage.setItem(LAST_DAILY_LOGIN_KEY, today);
        await this.awardPoints('DAILY_LOGIN', 'Daily login bonus');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking daily login:', error);
      return false;
    }
  }

  // Subscribe to points changes
  subscribe(listener: (points: number) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners
  private notifyListeners(points: number): void {
    this.listeners.forEach(listener => listener(points));
  }

  // Refresh points from storage/Supabase
  async refresh(): Promise<number> {
    return await this.initialize();
  }
}

export default PointsService;

