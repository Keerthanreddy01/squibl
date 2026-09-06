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
      builder_profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          username: string | null
          avatar_url: string | null
          bio: string | null
          role: string | null
          location: string | null
          skills: string[]
          stack: string[]
          experience_level: string
          looking_for: string[]
          availability: string
          github_url: string | null
          twitter_url: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: string | null
          location?: string | null
          skills?: string[]
          stack?: string[]
          experience_level?: string
          looking_for?: string[]
          availability?: string
          github_url?: string | null
          twitter_url?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: string | null
          location?: string | null
          skills?: string[]
          stack?: string[]
          experience_level?: string
          looking_for?: string[]
          availability?: string
          github_url?: string | null
          twitter_url?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          uid: string
          author_name: string | null
          author_avatar: string | null
          author_username: string | null
          content: string
          stack_tags: string[]
          post_type: 'update' | 'looking_for' | 'build_log'
          visibility: 'public' | 'collabs'
          project: string | null
          media_url: string | null
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          uid: string
          author_name?: string | null
          author_avatar?: string | null
          author_username?: string | null
          content: string
          stack_tags?: string[]
          post_type?: 'update' | 'looking_for' | 'build_log'
          visibility?: 'public' | 'collabs'
          project?: string | null
          media_url?: string | null
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          uid?: string
          author_name?: string | null
          author_avatar?: string | null
          author_username?: string | null
          content?: string
          stack_tags?: string[]
          post_type?: 'update' | 'looking_for' | 'build_log'
          visibility?: 'public' | 'collabs'
          project?: string | null
          media_url?: string | null
          views_count?: number
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
          author_uid: string
          author_name: string | null
          author_avatar: string | null
          author_username: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_uid: string
          author_name?: string | null
          author_avatar?: string | null
          author_username?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_uid?: string
          author_name?: string | null
          author_avatar?: string | null
          author_username?: string | null
          content?: string
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          owner_uid: string
          name: string
          tagline: string | null
          description: string | null
          stack: string[]
          team: string[]
          github_url: string | null
          live_url: string | null
          status: 'SHIPPED' | 'LIVE' | 'BETA' | 'OPEN SOURCE'
          author_name: string | null
          author_avatar: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_uid: string
          name: string
          tagline?: string | null
          description?: string | null
          stack?: string[]
          team?: string[]
          github_url?: string | null
          live_url?: string | null
          status?: 'SHIPPED' | 'LIVE' | 'BETA' | 'OPEN SOURCE'
          author_name?: string | null
          author_avatar?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_uid?: string
          name?: string
          tagline?: string | null
          description?: string | null
          stack?: string[]
          team?: string[]
          github_url?: string | null
          live_url?: string | null
          status?: 'SHIPPED' | 'LIVE' | 'BETA' | 'OPEN SOURCE'
          author_name?: string | null
          author_avatar?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_likes: {
        Row: {
          id: string
          project_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          last_message: string
          last_message_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          last_message?: string
          last_message_time?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          last_message?: string
          last_message_time?: string
          created_at?: string
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          unread_count: number
          last_read_at: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          unread_count?: number
          last_read_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          unread_count?: number
          last_read_at?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          read: boolean
          reactions: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          read?: boolean
          reactions?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          read?: boolean
          reactions?: Json
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string
          actor_name: string
          actor_avatar: string | null
          type: 'like' | 'comment' | 'follow'
          target_id: string | null
          content: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id: string
          actor_name: string
          actor_avatar?: string | null
          type: 'like' | 'comment' | 'follow'
          target_id?: string | null
          content?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          actor_id?: string
          actor_name?: string
          actor_avatar?: string | null
          type?: 'like' | 'comment' | 'follow'
          target_id?: string | null
          content?: string | null
          read?: boolean
          created_at?: string
        }
      }
      spaces: {
        Row: {
          id: string
          created_by: string
          label: string
          dot_color: string
          created_at: string
        }
        Insert: {
          id?: string
          created_by: string
          label: string
          dot_color: string
          created_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          label?: string
          dot_color?: string
          created_at?: string
        }
      }
      auth_events: {
        Row: {
          id: string
          user_id: string | null
          event: string
          method: string | null
          user_agent: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event: string
          method?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event?: string
          method?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      app_waitlist: {
        Row: {
          id: string
          email: string
          platform: 'android' | 'ios' | 'both'
          referred_by: string | null
          position: number
          ref_code: string
          joined_at: string
        }
        Insert: {
          id?: string
          email: string
          platform: 'android' | 'ios' | 'both'
          referred_by?: string | null
          position?: number
          ref_code: string
          joined_at?: string
        }
        Update: {
          id?: string
          email?: string
          platform?: 'android' | 'ios' | 'both'
          referred_by?: string | null
          position?: number
          ref_code?: string
          joined_at?: string
        }
      }
    }
  }
}
