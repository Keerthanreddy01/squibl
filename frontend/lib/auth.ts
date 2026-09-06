import { supabase } from './supabase/client'
import { logSecurityEvent } from './security-logger'
import { setAuthCookie, clearAuthCookie } from './auth-cookie'
import type { User, Session } from '@supabase/supabase-js'

// ─── Error Mapping ────────────────────────────────────────────────────────────

/**
 * Maps Supabase Auth errors and codes to safe, user-friendly messages.
 * NEVER expose raw database error messages or internal codes to the UI.
 */
export function mapAuthError(error: any): string {
  if (!error) return 'Something went wrong. Please try again.'

  const message = typeof error === 'string' ? error : error.message || ''
  const lower = message.toLowerCase()

  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return 'Incorrect email or password.'
  }
  if (lower.includes('user already registered') || lower.includes('email already in use')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (lower.includes('password should be at least') || lower.includes('weak_password')) {
    return 'Password is too weak. Use at least 8 characters, a number, and a symbol.'
  }
  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('over_email_send_rate_limit')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Please verify your email before logging in. Check your inbox for a confirmation link.'
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error. Please check your internet connection.'
  }

  return message || 'An unexpected error occurred. Please try again.'
}

// ─── Password Strength ────────────────────────────────────────────────────────

export interface PasswordStrength {
  score: number      // 0–4
  label: string      // 'Weak' | 'Fair' | 'Good' | 'Strong'
  color: string      // Tailwind color class
  errors: string[]   // List of unmet requirements
}

/**
 * Evaluates password strength against security requirements.
 * Returns a score 0–4 and specific error messages for unmet criteria.
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const errors: string[] = []

  if (password.length < 8)            errors.push('At least 8 characters')
  if (!/[A-Z]/.test(password))        errors.push('One uppercase letter')
  if (!/[0-9]/.test(password))        errors.push('One number')
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('One special character (!@#$%...)')

  const score = 4 - errors.length

  const labelMap: Record<number, string> = { 0: 'Very Weak', 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' }
  const colorMap: Record<number, string> = {
    0: '#ef4444',  // red
    1: '#f97316',  // orange
    2: '#eab308',  // yellow
    3: '#22c55e',  // green
    4: '#10b981',  // emerald
  }

  return {
    score,
    label: labelMap[score] ?? 'Very Weak',
    color: colorMap[score] ?? '#ef4444',
    errors,
  }
}

// ─── Auth Functions ───────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  try {
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/dashboard/home`
      : undefined

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: { message: mapAuthError(error) } }
  }
}

export async function signInWithGithub() {
  try {
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/dashboard/home`
      : undefined

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
      },
    })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: { message: mapAuthError(error) } }
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) throw error

    if (data.user) {
      setAuthCookie(data.user.id)
      await logSecurityEvent({ uid: data.user.id, event: 'sign_in_success', method: 'email' })
    }

    return { data: { user: data.user, session: data.session }, error: null }
  } catch (error: any) {
    await logSecurityEvent({
      event: 'sign_in_failure',
      method: 'email',
      metadata: { error: error.message },
    })
    return { data: null, error: { message: mapAuthError(error), code: error.code || 'auth_error' } }
  }
}

export async function signUpWithEmail(email: string, password: string, metadata?: { full_name?: string }) {
  try {
    const strength = checkPasswordStrength(password)
    if (strength.score < 4) {
      return { data: null, error: { message: `Password needs: ${strength.errors.join(', ')}.` } }
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: metadata || {},
      },
    })

    if (error) throw error

    if (data.user) {
      setAuthCookie(data.user.id)
      await logSecurityEvent({ uid: data.user.id, event: 'sign_up_success', method: 'email' })
    }

    return { data: { user: data.user, session: data.session }, error: null }
  } catch (error: any) {
    return { data: null, error: { message: mapAuthError(error), code: error.code || 'signup_error' } }
  }
}

export async function signOut() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) {
      await logSecurityEvent({ uid: user.id, event: 'sign_out' })
    }
    await supabase.auth.signOut()
    clearAuthCookie()
    return { error: null }
  } catch (error: any) {
    clearAuthCookie()
    return { error: { message: 'Failed to sign out. Please try again.' } }
  }
}

export async function resetPasswordForEmail(email: string) {
  try {
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/settings`
      : undefined

    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    })

    if (error) throw error
    await logSecurityEvent({ event: 'password_reset_requested', metadata: { email } })
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: { message: mapAuthError(error) } }
  }
}

export async function getUser(): Promise<{ user: User | null; error: any }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

export async function getSession(): Promise<{ session: Session | null; error: any }> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { session, error: null }
  } catch (error) {
    return { session: null, error }
  }
}
