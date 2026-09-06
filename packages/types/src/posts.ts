import type { PostType, PostVisibility } from '@squibl/constants'

export type PostResult<T = null> = { data: T; error: null } | { data: null; error: Error }
export type VoidResult = { error: null } | { error: Error }

export interface PostItem {
  id: string
  uid: string
  author_name: string | null
  author_avatar: string | null
  author_username: string | null
  content: string
  stack_tags: string[]
  post_type: PostType
  visibility: PostVisibility
  project: string | null
  media_url?: string | null
  mediaUrl?: string | null
  views_count: number
  likes: string[]
  comments_count: number
  created_at: string
  updated_at: string
}
