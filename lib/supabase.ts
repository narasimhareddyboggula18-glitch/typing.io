import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          xp: number;
          rank: string;
          rating: number;
          best_wpm: number;
          avg_wpm: number;
          total_words: number;
          total_time: number;
          streak_days: number;
          last_active: string;
          created_at: string;
        };
      };
      level_progress: {
        Row: {
          id: string;
          user_id: string;
          level_id: number;
          stars: number;
          wpm: number;
          accuracy: number;
          completed_at: string;
        };
      };
      typing_sessions: {
        Row: {
          id: string;
          user_id: string;
          wpm: number;
          accuracy: number;
          duration: number;
          mode: string;
          created_at: string;
        };
      };
      mistake_log: {
        Row: {
          id: string;
          user_id: string;
          key: string;
          count: number;
        };
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          code: string;
          host_id: string;
          status: string;
          game_text: string;
          created_at: string;
        };
      };
    };
  };
};
