/**
 * usePlatformStats.ts
 * Custom React hook for consuming live platform statistics.
 *
 * Features:
 * - Fetches data on mount
 * - In-memory caching (1-minute TTL) to avoid redundant database reads
 * - Loading skeleton support via `isLoading` flag
 * - Graceful error handling — always returns 0 values on failure
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { fetchPlatformStats, PlatformStats } from '@/lib/stats'

interface UsePlatformStatsResult {
  stats: PlatformStats
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Module-level cache (persists across re-renders in the same session)
let cachedStats: PlatformStats | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 60 * 1000 // 1 minute

const DEFAULT_STATS: PlatformStats = {
  activeBuilders: 0,
  projectsLaunched: 0,
  openCollabRequests: 0,
  teamsFormed: 0,
  discussionsCreated: 0,
  countriesRepresented: 0,
}

export function usePlatformStats(): UsePlatformStatsResult {
  const [stats, setStats] = useState<PlatformStats>(
    cachedStats ?? DEFAULT_STATS
  )
  const [isLoading, setIsLoading] = useState<boolean>(!cachedStats)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  const loadStats = async () => {
    // Return cached data if still fresh
    const now = Date.now()
    if (cachedStats && now - cacheTimestamp < CACHE_TTL_MS) {
      setStats(cachedStats)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchPlatformStats()
      if (isMountedRef.current) {
        setStats(data)
        cachedStats = data
        cacheTimestamp = Date.now()
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Failed to load platform statistics')
        setStats(DEFAULT_STATS)
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    loadStats()
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return { stats, isLoading, error, refetch: loadStats }
}
