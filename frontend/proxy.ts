import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block admin routes in production
  if (pathname.startsWith('/admin')) {
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ── Waitlist Gate ───────────────────────────────────────────────────────────
  // We use the `cs_uid` cookie purely as a routing signal to know someone is 
  // logged in. Actual authorization is handled by Supabase client-side.
  const csUid = request.cookies.get('cs_uid')?.value;
  
  // Get admin UIDs from env, fallback to empty array
  const adminUids = (process.env.NEXT_PUBLIC_ADMIN_UIDS || "")
    .split(',')
    .map(uid => uid.trim())
    .filter(Boolean);

  const isApi = pathname.startsWith('/api/');
  const isStatic = pathname.startsWith('/_next/') || pathname === '/favicon.ico' || pathname.startsWith('/newlogo.png');
  // ── Waitlist Gate Disabled ─────────────────────────────────────────────────
  // Redirect logic removed to allow full application navigation.

  // Add security headers to all responses
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
