import { supabase } from './supabase/client'
import { sanitizeShortText, sanitizeBio } from './sanitize'

import type { ProjectData } from '@squibl/types'
export type { ProjectData } from '@squibl/types'

export async function createProject(project: ProjectData) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== project.owner_uid) {
      throw new Error('Must be logged in to create a project')
    }

    const { data, error } = await (supabase
      .from('projects') as any)
      .insert({
        owner_uid: project.owner_uid,
        name: sanitizeShortText(project.name),
        tagline: sanitizeShortText(project.tagline),
        description: sanitizeBio(project.description),
        stack: Array.isArray(project.stack) ? project.stack.map(sanitizeShortText) : [],
        team: Array.isArray(project.team) ? project.team.map(sanitizeShortText) : [],
        github_url: project.github_url || null,
        live_url: project.live_url || null,
        status: project.status || 'BETA',
        author_name: project.author_name || user.user_metadata?.full_name || 'Builder',
        author_avatar: project.author_avatar || user.user_metadata?.avatar_url || null,
      })
      .select('id')
      .single()

    if (error) throw error
    return { data: { id: data.id }, error: null }
  } catch (error: any) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error.message || error)) }
  }
}

export async function getAllProjects(): Promise<{ data: ProjectData[]; error: any }> {
  try {
    const { data: projects, error } = await (supabase
      .from('projects') as any)
      .select(`
        *,
        project_likes ( user_id )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formatted = (projects || []).map((p: any) => ({
      id: p.id,
      owner_uid: p.owner_uid,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      stack: p.stack || [],
      team: p.team || [],
      github_url: p.github_url,
      live_url: p.live_url,
      status: p.status,
      author_name: p.author_name,
      author_avatar: p.author_avatar,
      likes: Array.isArray(p.project_likes) ? p.project_likes.map((l: any) => l.user_id) : [],
      created_at: p.created_at,
      updated_at: p.updated_at,
    }))

    return { data: formatted, error: null }
  } catch (error) {
    return { data: [], error }
  }
}

export async function getUserProjects(userId: string): Promise<{ data: ProjectData[]; error: any }> {
  try {
    const { data: projects, error } = await (supabase
      .from('projects') as any)
      .select(`
        *,
        project_likes ( user_id )
      `)
      .eq('owner_uid', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formatted = (projects || []).map((p: any) => ({
      id: p.id,
      owner_uid: p.owner_uid,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      stack: p.stack || [],
      team: p.team || [],
      github_url: p.github_url,
      live_url: p.live_url,
      status: p.status,
      author_name: p.author_name,
      author_avatar: p.author_avatar,
      likes: Array.isArray(p.project_likes) ? p.project_likes.map((l: any) => l.user_id) : [],
      created_at: p.created_at,
      updated_at: p.updated_at,
    }))

    return { data: formatted, error: null }
  } catch (error) {
    return { data: [], error }
  }
}
