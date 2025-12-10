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
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          name: string | null
          is_group: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          is_group?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          is_group?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          created_at: string
          read_by: string[]
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          created_at?: string
          read_by?: string[]
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          created_at?: string
          read_by?: string[]
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string | null
          tags: string[]
          created_at: string
          updated_at: string
          synced: boolean
          local_updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
          synced?: boolean
          local_updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
          synced?: boolean
          local_updated_at?: string | null
        }
      }
      subjects: {
        Row: {
          id: string
          user_id: string
          name: string
          code: string
          professor: string | null
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          code: string
          professor?: string | null
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          code?: string
          professor?: string | null
          color?: string
          created_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          subject_id: string
          user_id: string
          date: string
          status: 'present' | 'absent' | 'leave'
          created_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          user_id: string
          date: string
          status: 'present' | 'absent' | 'leave'
          created_at?: string
        }
        Update: {
          id?: string
          subject_id?: string
          user_id?: string
          date?: string
          status?: 'present' | 'absent' | 'leave'
          created_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          subject_id: string
          user_id: string
          title: string
          description: string | null
          deadline: string | null
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          user_id: string
          title: string
          description?: string | null
          deadline?: string | null
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          subject_id?: string
          user_id?: string
          title?: string
          description?: string | null
          deadline?: string | null
          completed?: boolean
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}
