import { supabase } from './supabase/client'
import { sanitizeShortText, sanitizeUrl, sanitizeProfileUpdate } from './sanitize'

import type { ProfileData } from '@squibl/types'
export type { ProfileData } from '@squibl/types'

export async function getProfile(userId: string): Promise<{ data: ProfileData | null; error: any }> {
  try {
    const { data: profile, error } = await (supabase
      .from('builder_profiles') as any)
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    if (!profile) return { data: null, error: null }

    // Fetch followers and following relationships
    const [{ data: followersData }, { data: followingData }] = await Promise.all([
      (supabase.from('connections') as any).select('follower_id').eq('following_id', userId),
      (supabase.from('connections') as any).select('following_id').eq('follower_id', userId),
    ])

    const followers = (followersData || []).map((f: any) => f.follower_id)
    const following = (followingData || []).map((f: any) => f.following_id)

    return {
      data: {
        ...profile,
        uid: profile.id,
        followers,
        following,
      },
      error: null,
    }
  } catch (error) {
    return { data: null, error }
  }
}

export async function createProfile(profile: {
  uid: string
  full_name?: string
  avatar_url?: string
  email?: string
  username?: string
  stack?: string[]
  bio?: string
}) {
  try {
    const safeProfile = {
      id: profile.uid,
      full_name: sanitizeShortText(profile.full_name),
      avatar_url: sanitizeUrl(profile.avatar_url),
      username: sanitizeShortText(profile.username)?.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      email: profile.email,
      bio: profile.bio || '',
      stack: Array.isArray(profile.stack)
        ? profile.stack.map(sanitizeShortText).slice(0, 20)
        : [],
      availability: 'open',
      onboarding_completed: false,
    }

    const { data, error } = await (supabase
      .from('builder_profiles') as any)
      .upsert(safeProfile, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error
    return { data: { ...data, uid: data.id }, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function updateProfile(
  userId: string,
  updates: Record<string, unknown>
) {
  try {
    const safeUpdates = sanitizeProfileUpdate(updates)
    const { data, error } = await (supabase
      .from('builder_profiles') as any)
      .update(safeUpdates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function getAllProfiles(): Promise<{ data: ProfileData[]; error: any }> {
  try {
    const { data: profiles, error } = await (supabase
      .from('builder_profiles') as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch all connections for follower/following lists
    const { data: connections } = await (supabase
      .from('connections') as any)
      .select('follower_id, following_id')

    const followersMap: Record<string, string[]> = {}
    const followingMap: Record<string, string[]> = {}

    connections?.forEach((c: any) => {
      if (!followersMap[c.following_id]) followersMap[c.following_id] = []
      followersMap[c.following_id].push(c.follower_id)

      if (!followingMap[c.follower_id]) followingMap[c.follower_id] = []
      followingMap[c.follower_id].push(c.following_id)
    })

    const enrichedProfiles = (profiles || []).map((p: any) => ({
      ...p,
      uid: p.id,
      followers: followersMap[p.id] || [],
      following: followingMap[p.id] || [],
    }))

    return { data: enrichedProfiles, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

export async function connectToBuilder(followerId: string, followingId: string) {
  try {
    if (!followerId || !followingId || followerId === followingId) {
      throw new Error('Invalid connection')
    }

    const { error } = await (supabase
      .from('connections') as any)
      .insert({
        follower_id: followerId,
        following_id: followingId,
      })

    if (error && error.code !== '23505') {
      throw error
    }

    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function disconnectFromBuilder(followerId: string, followingId: string) {
  try {
    const { error } = await (supabase
      .from('connections') as any)
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function getUserStats(userId: string) {
  try {
    const [
      { count: postsCount },
      { count: projectsCount },
      { count: followersCount },
      { count: followingCount },
    ] = await Promise.all([
      (supabase.from('posts') as any).select('*', { count: 'exact', head: true }).eq('uid', userId),
      (supabase.from('projects') as any).select('*', { count: 'exact', head: true }).eq('owner_uid', userId),
      (supabase.from('connections') as any).select('*', { count: 'exact', head: true }).eq('following_id', userId),
      (supabase.from('connections') as any).select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ])

    return {
      data: {
        posts: postsCount ?? 0,
        projects: projectsCount ?? 0,
        followers: followersCount ?? 0,
        following: followingCount ?? 0,
      },
      error: null,
    }
  } catch (error) {
    return { data: { posts: 0, projects: 0, followers: 0, following: 0 }, error }
  }
}

export async function getUserSpaces(userId: string) {
  try {
    const { data, error } = await (supabase
      .from('spaces') as any)
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: [], error }
  }
}

export async function createSpace(userId: string, space: { label: string; dotColor: string }) {
  try {
    const { data, error } = await (supabase
      .from('spaces') as any)
      .insert({
        created_by: userId,
        label: space.label,
        dot_color: space.dotColor,
      })
      .select()
      .single()

    if (error) throw error
    return { data: { id: data.id, ...space }, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
