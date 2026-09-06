import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { isAllowedOrigin } from '@/lib/env'

export const dynamic = 'force-dynamic'

function createRefCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = 'SQ-'
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

async function verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) return true // dev fallback if not configured

  if (!token) return false

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (ip) formData.append('remoteip', ip)

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    const data = await res.json()
    return !!data.success
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const platform = body?.platform
  const referredBy = typeof body?.referredBy === 'string' ? body.referredBy.trim().toUpperCase() : null

  if (!isValidEmail(email) || !['android', 'ios', 'both'].includes(platform)) {
    return NextResponse.json({ error: 'Invalid waitlist details.' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null
  if (!(await verifyTurnstile(body?.turnstileToken, ip))) {
    return NextResponse.json({ error: 'Security check failed. Please refresh and try again.' }, { status: 403 })
  }

  try {
    const supabaseAdmin = createAdminClient()

    // Check if email already exists
    const { data: existing } = await (supabaseAdmin.from('app_waitlist') as any)
      .select('position, ref_code')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        success: true,
        position: existing.position,
        refCode: existing.ref_code,
        message: 'Already registered!',
      })
    }

    const refCode = createRefCode()

    // Insert new waitlist row
    const { data: inserted, error: insertError } = await (supabaseAdmin.from('app_waitlist') as any)
      .insert({
        email,
        platform,
        referred_by: referredBy,
        ref_code: refCode,
      })
      .select('position, ref_code')
      .single()

    if (insertError) {
      // Handle potential race condition on unique email constraint
      if (insertError.code === '23505') {
        const { data: raceRecord } = await (supabaseAdmin.from('app_waitlist') as any)
          .select('position, ref_code')
          .eq('email', email)
          .single()

        if (raceRecord) {
          return NextResponse.json({
            success: true,
            position: raceRecord.position,
            refCode: raceRecord.ref_code,
            message: 'Already registered!',
          })
        }
      }
      throw insertError
    }

    return NextResponse.json({
      success: true,
      position: inserted?.position || 1,
      refCode: inserted?.ref_code || refCode,
      message: 'Pre-registered successfully!',
    })
  } catch (err: any) {
    console.error('Waitlist registration failed:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to save waitlist reservation.' },
      { status: 500 }
    )
  }
}
