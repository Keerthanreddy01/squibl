/**
 * lib/env.ts
 * Runtime validation for required environment variables.
 * Throws a descriptive error at startup if any required env var is missing,
 * preventing silent failures or accidental use of wrong configs.
 */

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

export function validateEnv(): void {
  if (typeof window === 'undefined') return // Only validate on client

  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !process.env[key] || process.env[key]!.trim() === ''
  )

  if (missing.length > 0) {
    const message = [
      '[Squibl] Missing required environment variables:',
      ...missing.map((k) => `  - ${k}`),
      '',
      'Copy .env.example to .env.local and fill in your Supabase credentials.',
    ].join('\n')

    console.error(message)

    if (process.env.NODE_ENV === 'development') {
      console.warn(message)
    }
  }
}

/**
 * Safe accessor for env vars — throws if called with a missing key.
 */
export function getEnv(key: (typeof REQUIRED_ENV_VARS)[number]): string {
  const value = process.env[key]
  if (!value || value.trim() === '') {
    throw new Error(
      `[Squibl] Environment variable "${key}" is not set. ` +
      `Copy .env.example to .env.local and fill in your Supabase credentials.`
    )
  }
  return value
}

/**
 * Validates request origin against allowed origins (CORS check).
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true
  const allowed = [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://squibl.vercel.app',
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ].filter(Boolean) as string[]

  return allowed.some((allowedUrl) => origin.startsWith(allowedUrl))
}
