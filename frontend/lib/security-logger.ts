/**
 * lib/security-logger.ts
 * Lightweight security audit trail for Squibl.
 *
 * Writes auth events to the Supabase `auth_events` table so administrators
 * can detect suspicious patterns (repeated failed logins, etc.) without storing
 * any sensitive passwords or tokens.
 *
 * Each event row contains:
 *  - user_id        (who)
 *  - event          (what happened)
 *  - method         (how: email | google | github)
 *  - created_at     (when)
 *  - user_agent     (browser fingerprint — no PII)
 *  - metadata       (non-sensitive context)
 */

import { supabase } from './supabase/client'

export type AuthEventType =
  | 'sign_in_success'
  | 'sign_in_failure'
  | 'sign_up_success'
  | 'sign_out'
  | 'password_reset_requested'
  | 'profile_updated'

export interface AuthEventPayload {
  uid?: string          // undefined on failed sign-in (user not authenticated)
  event: AuthEventType
  method?: 'email' | 'google' | 'github'
  metadata?: Record<string, string | number | boolean | null>
}

/**
 * Logs a security-relevant event to Supabase.
 * Fails silently — logging errors should never block auth or user experience.
 */
export async function logSecurityEvent(payload: AuthEventPayload): Promise<void> {
  try {
    const entry = {
      user_id:    payload.uid ?? null,
      event:      payload.event,
      method:     payload.method ?? 'unknown',
      user_agent: typeof navigator !== 'undefined'
        ? navigator.userAgent.slice(0, 200)
        : 'server',
      metadata:   (payload.metadata ?? {}) as any,
    }

    await (supabase.from('auth_events') as any).insert(entry)
  } catch {
    // Non-critical audit log — never throw
  }
}
