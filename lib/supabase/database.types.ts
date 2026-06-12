// Supabase Database Types for FORGE Training Platform
// These types match the database schema created in Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'student' | 'manager' | 'admin'
          plan: 'free' | 'team' | 'enterprise'
          is_premium: boolean
          premium_until: string | null
          subscription_status: 'active' | 'trialing' | 'expired' | 'cancelled' | null
          subscription_started_at: string | null
          subscription_ends_at: string | null
          organization_id: string | null
          seat_limit: number
          seats_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          role?: 'student' | 'manager' | 'admin'
          plan?: 'free' | 'team' | 'enterprise'
          is_premium?: boolean
          premium_until?: string | null
          subscription_status?: 'active' | 'trialing' | 'expired' | 'cancelled' | null
          subscription_started_at?: string | null
          subscription_ends_at?: string | null
          organization_id?: string | null
          seat_limit?: number
          seats_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'student' | 'manager' | 'admin'
          plan?: 'free' | 'team' | 'enterprise'
          is_premium?: boolean
          premium_until?: string | null
          subscription_status?: 'active' | 'trialing' | 'expired' | 'cancelled' | null
          subscription_started_at?: string | null
          subscription_ends_at?: string | null
          organization_id?: string | null
          seat_limit?: number
          seats_used?: number
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          thumbnail_url: string | null
          level: string
          category: string
          is_published: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          thumbnail_url?: string | null
          level: string
          category: string
          is_published?: boolean
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          thumbnail_url?: string | null
          level?: string
          category?: string
          is_published?: boolean
          created_by?: string
          created_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          order?: number
          created_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          course_id: string
          title: string
          content: string | null
          video_url: string | null
          order_index: number
          lesson_type: string | null
          is_published: boolean
          simulator_config: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          content?: string | null
          video_url?: string | null
          order_index: number
          lesson_type?: string | null
          is_published?: boolean
          simulator_config?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          content?: string | null
          video_url?: string | null
          order_index?: number
          lesson_type?: string | null
          is_published?: boolean
          simulator_config?: Json | null
          created_at?: string
        }
      }
      course_enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          enrolled_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          enrolled_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          enrolled_at?: string
        }
      }
      user_course_progress: {
        Row: {
          id: string
          user_id: string
          course_id: string
          lesson_id: string
          progress_percent: number
          is_completed: boolean
          last_accessed: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          lesson_id: string
          progress_percent?: number
          is_completed?: boolean
          last_accessed?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          lesson_id?: string
          progress_percent?: number
          is_completed?: boolean
          last_accessed?: string
        }
      },
      learning_sessions: {
        Row: {
          id: string
          user_id: string
          course_id: string
          lesson_id: string
          started_at: string
          ended_at: string | null
          duration_seconds: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          lesson_id: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          lesson_id?: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number
          created_at?: string
          updated_at?: string
        }
      },
      simulator_sessions: {
        Row: {
          id: string
          user_id: string
          course_id: string
          lesson_id: string
          status: 'in_progress' | 'completed' | 'abandoned'
          current_stage: string
          current_score: number
          session_avg: number
          turns_count: number
          last_feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          lesson_id: string
          status?: 'in_progress' | 'completed' | 'abandoned'
          current_stage?: string
          current_score?: number
          session_avg?: number
          turns_count?: number
          last_feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          lesson_id?: string
          status?: 'in_progress' | 'completed' | 'abandoned'
          current_stage?: string
          current_score?: number
          session_avg?: number
          turns_count?: number
          last_feedback?: string | null
          created_at?: string
          updated_at?: string
        }
      },
      simulator_messages: {
        Row: {
          id: string
          session_id: string
          user_id: string
          role: 'system' | 'sales' | 'customer'
          content: string
          audio_url: string | null
          response_source: string | null
          score_delta: number | null
          stage: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          role: 'system' | 'sales' | 'customer'
          content: string
          audio_url?: string | null
          response_source?: string | null
          score_delta?: number | null
          stage?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          role?: 'system' | 'sales' | 'customer'
          content?: string
          audio_url?: string | null
          response_source?: string | null
          score_delta?: number | null
          stage?: string | null
          created_at?: string
        }
      }
    },
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easy access
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type Module = Database['public']['Tables']['modules']['Row']
export type Lesson = Database['public']['Tables']['lessons']['Row']
export type CourseEnrollment = Database['public']['Tables']['course_enrollments']['Row']
export type UserCourseProgress = Database['public']['Tables']['user_course_progress']['Row']
export type SimulatorSession = Database['public']['Tables']['simulator_sessions']['Row']
export type SimulatorMessage = Database['public']['Tables']['simulator_messages']['Row']
export type LearningSession = Database['public']['Tables']['learning_sessions']['Row']
