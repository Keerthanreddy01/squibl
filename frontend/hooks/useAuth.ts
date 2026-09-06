"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { setAuthCookie, clearAuthCookie, getAuthCookieUid } from '@/lib/auth-cookie'
import type { User, Session } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    // Initial session fetch
    async function getInitialSession() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        if (!isMounted) return

        if (initialSession?.user) {
          setUser(initialSession.user)
          setSession(initialSession)
          if (!getAuthCookieUid()) {
            setAuthCookie(initialSession.user.id)
          }
        } else {
          setUser(null)
          setSession(null)
        }
      } catch (err) {
        console.error('[useAuth] Error fetching initial session:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return

      const currentUser = currentSession?.user ?? null
      setUser(currentUser)
      setSession(currentSession)
      setLoading(false)

      if (currentUser) {
        if (!getAuthCookieUid()) {
          setAuthCookie(currentUser.id)
        }

        // Client-side waitlist gate check if applicable
        const adminUids = (process.env.NEXT_PUBLIC_ADMIN_UIDS || "")
          .split(',')
          .map(uid => uid.trim())
          .filter(Boolean)

        if (typeof window !== 'undefined') {
          const isLockedPage = window.location.pathname === '/pre-register'
          const isAuthRoute = ['/', '/login', '/signup'].includes(window.location.pathname)

          if (adminUids.length > 0 && !adminUids.includes(currentUser.id) && !isLockedPage && !isAuthRoute) {
            router.push('/pre-register')
          }
        }
      } else {
        clearAuthCookie()
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router])

  /**
   * Securely signs out the user:
   * 1. Calls Supabase signOut (invalidates the session)
   * 2. Clears local React state & cookies
   * 3. Redirects to login page
   */
  const signOutAndClear = useCallback(async () => {
    try {
      await signOut()
      clearAuthCookie()
      setUser(null)
      setSession(null)
      router.push('/login')
    } catch {
      // Fallback: force redirect even if signOut throws
      clearAuthCookie()
      setUser(null)
      setSession(null)
      router.push('/login')
    }
  }, [router])

  return { user, session, loading, signOutAndClear }
}
