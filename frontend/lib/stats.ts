/**
 * stats.ts
 * Centralized service for fetching live platform statistics from Supabase PostgreSQL.
 * All metrics are fetched from the database — no hardcoded values.
 */

import { supabase } from './supabase/client'

export interface PlatformStats {
  activeBuilders: number
  projectsLaunched: number
  openCollabRequests: number
  teamsFormed: number
  discussionsCreated: number
  countriesRepresented: number
}

function safeCount(raw: number | null | undefined): number {
  if (typeof raw !== 'number' || !isFinite(raw) || raw < 0) return 0
  return Math.floor(raw)
}

async function fetchCountriesRepresented(): Promise<number> {
  try {
    const { data, error } = await (supabase
      .from('builder_profiles') as any)
      .select('location')

    if (error || !data) return 0

    const locationSet = new Set<string>()
    ;(data as any[]).forEach((row) => {
      const rawLocation = (row.location ?? '').trim()
      if (!rawLocation) return
      const parts = rawLocation.split(',')
      const country = parts[parts.length - 1].trim().toLowerCase()
      if (country) locationSet.add(country)
    })
    return locationSet.size
  } catch {
    return 0
  }
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  try {
    const [
      { count: buildersCount },
      { count: projectsCount },
      { count: collabCount },
      { count: spacesCount },
      { count: postsCount },
      countriesRepresented,
    ] = await Promise.all([
      (supabase.from('builder_profiles') as any).select('*', { count: 'exact', head: true }),
      (supabase.from('projects') as any).select('*', { count: 'exact', head: true }),
      (supabase.from('posts') as any).select('*', { count: 'exact', head: true }).eq('post_type', 'looking_for'),
      (supabase.from('spaces') as any).select('*', { count: 'exact', head: true }),
      (supabase.from('posts') as any).select('*', { count: 'exact', head: true }),
      fetchCountriesRepresented(),
    ])

    return {
      activeBuilders: safeCount(buildersCount),
      projectsLaunched: safeCount(projectsCount),
      openCollabRequests: safeCount(collabCount),
      teamsFormed: safeCount(spacesCount),
      discussionsCreated: safeCount(postsCount),
      countriesRepresented,
    }
  } catch (error) {
    console.error('[Squibl] Failed to fetch platform stats:', error)
    return {
      activeBuilders: 0,
      projectsLaunched: 0,
      openCollabRequests: 0,
      teamsFormed: 0,
      discussionsCreated: 0,
      countriesRepresented: 0,
    }
  }
}
