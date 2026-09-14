import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  // If the provider returned an error, safely redirect to login with error indicator
  if (error || errorDescription) {
    return NextResponse.redirect(`${origin}/login?error=oauth_error`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  try {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError || !data?.user) {
      return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`)
    }

    const uid = data.user.id

    // Check admin/waitlist gate if configured
    const adminUids = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean)

    if (adminUids.length > 0 && !adminUids.includes(uid)) {
      const response = NextResponse.redirect(`${origin}/pre-register`)
      response.cookies.set('cs_uid', uid, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      })
      return response
    }

    // Check onboarding completion status
    const { data: profile } = await (supabase.from('builder_profiles') as any)
      .select('onboarding_completed')
      .eq('id', uid)
      .maybeSingle()

    const targetPath = profile?.onboarding_completed ? '/dashboard/home' : '/onboarding'
    const response = NextResponse.redirect(`${origin}${targetPath}`)

    response.cookies.set('cs_uid', uid, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    })

    return response
  } catch {
    return NextResponse.redirect(`${origin}/login?error=oauth_unexpected_error`)
  }
}
