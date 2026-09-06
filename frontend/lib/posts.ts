import { supabase } from './supabase/client'
import { sanitizePost, sanitizeText } from './sanitize'

import type { PostItem, PostResult, VoidResult } from '@squibl/types'
export type { PostItem, PostResult, VoidResult } from '@squibl/types'

export async function createPost(post: {
  uid: string
  author_name: string
  author_avatar: string
  author_username: string
  content: string
  stack_tags: string[]
  post_type: 'update' | 'looking_for' | 'build_log'
  visibility?: 'public' | 'collabs'
  project?: string | null
  media_url?: string | null
  mediaUrl?: string | null
}): Promise<PostResult<{ id: string }>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== post.uid) {
      throw new Error('Must be logged in to post')
    }
    if (!post.content || post.content.trim().length === 0) {
      throw new Error('Post content cannot be empty')
    }
    if (post.content.length > 2000) {
      throw new Error('Post too long (max 2000 characters)')
    }

    const safePost = sanitizePost(post as Record<string, unknown>)
    const { data, error } = await (supabase
      .from('posts') as any)
      .insert({
        uid: post.uid,
        author_name: (safePost.author_name as string) || user.user_metadata?.full_name || 'Builder',
        author_avatar: (safePost.author_avatar as string) || user.user_metadata?.avatar_url || null,
        author_username: (safePost.author_username as string) || user.user_metadata?.username || user.email?.split('@')[0] || 'builder',
        content: (safePost.content as string) || post.content.trim(),
        stack_tags: Array.isArray(safePost.stack_tags) ? safePost.stack_tags as string[] : [],
        post_type: post.post_type || 'update',
        visibility: post.visibility || 'public',
        project: (safePost.project as string) || null,
        media_url: (safePost.media_url as string) || (safePost.mediaUrl as string) || null,
      })
      .select('id')
      .single()

    if (error) throw error
    return { data: { id: data.id }, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

export async function getAllPosts(limitCount = 50): Promise<{ data: PostItem[]; error: any }> {
  try {
    const { data: posts, error } = await (supabase
      .from('posts') as any)
      .select(`
        *,
        post_likes ( user_id ),
        post_comments ( id )
      `)
      .order('created_at', { ascending: false })
      .limit(limitCount)

    if (error) throw error

    const formattedPosts: PostItem[] = (posts || []).map((post: any) => {
      const likesList = Array.isArray(post.post_likes)
        ? post.post_likes.map((l: any) => l.user_id)
        : []
      const commentsCount = Array.isArray(post.post_comments)
        ? post.post_comments.length
        : 0

      return {
        id: post.id,
        uid: post.uid,
        author_name: post.author_name,
        author_avatar: post.author_avatar,
        author_username: post.author_username,
        content: post.content,
        stack_tags: post.stack_tags || [],
        post_type: post.post_type,
        visibility: post.visibility,
        project: post.project,
        media_url: post.media_url,
        mediaUrl: post.media_url,
        views_count: post.views_count || 0,
        likes: likesList,
        comments_count: commentsCount,
        created_at: post.created_at,
        updated_at: post.updated_at,
      }
    })

    return { data: formattedPosts, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

export async function likePost(postId: string, userId: string): Promise<VoidResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) return { error: new Error('Unauthorized') }

    // Check if like exists
    const { data: existingLike } = await (supabase
      .from('post_likes') as any)
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await (supabase
        .from('post_likes') as any)
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) throw deleteError
    } else {
      // Like
      const { error: insertError } = await (supabase
        .from('post_likes') as any)
        .insert({
          post_id: postId,
          user_id: userId,
        })

      if (insertError) throw insertError
    }

    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) }
  }
}

export async function incrementViews(postId: string): Promise<VoidResult> {
  try {
    await (supabase as any).rpc('increment_post_views', { p_post_id: postId })
  } catch {
    // Non-critical metric
  }
  return { error: null }
}

export async function addComment(postId: string, comment: {
  uid: string
  author_name: string
  author_avatar: string
  author_username: string
  content: string
}): Promise<VoidResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== comment.uid) return { error: new Error('Unauthorized') }

    const sanitizedContent = sanitizeText(comment.content, 1000)
    if (!sanitizedContent) return { error: new Error('Comment cannot be empty') }

    const { error } = await (supabase
      .from('post_comments') as any)
      .insert({
        post_id: postId,
        author_uid: comment.uid,
        author_name: sanitizeText(comment.author_name, 100),
        author_avatar: comment.author_avatar,
        author_username: sanitizeText(comment.author_username, 100),
        content: sanitizedContent,
      })

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) }
  }
}

export async function getComments(postId: string) {
  try {
    const { data, error } = await (supabase
      .from('post_comments') as any)
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: [], error }
  }
}

export function computePostScore(post: any): number {
  const likesCount = Array.isArray(post.likes) ? post.likes.length : 0
  const commentsCount = post.comments_count || 0
  const viewsCount = post.views_count || 0

  let recencyBoost = 0
  if (post.created_at) {
    const hoursSincePost = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60)
    if (hoursSincePost < 1) {
      recencyBoost = 50
    } else if (hoursSincePost < 6) {
      recencyBoost = 30
    } else if (hoursSincePost < 24) {
      recencyBoost = 10
    }
  }

  return (likesCount * 3) + (commentsCount * 5) + (viewsCount * 0.5) + recencyBoost
}
