export interface ProfileData {
  id?: string
  uid?: string
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
  followers?: string[]
  following?: string[]
  created_at?: string
  updated_at?: string
}
