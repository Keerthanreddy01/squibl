import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Prevent clickjacking — stops the app from being embedded in iframes
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Prevent MIME-type sniffing attacks
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Control how much referrer info is sent with requests
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Disable potentially dangerous browser APIs not used by this app
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Force HTTPS for 1 year (including subdomains)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // Content Security Policy — restrict where scripts/styles/media can load from
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + Next.js inline + EmailJS + Lottie WASM + Vercel + Turnstile
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.emailjs.com https://unpkg.com https://va.vercel-scripts.com https://challenges.cloudflare.com",
      // Styles: self + inline (needed for Tailwind)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: self + Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + data URIs + dicebear avatars + Supabase Storage + CloudFront + GitHub avatars + Google user content
      "img-src 'self' data: blob: https://*.googleusercontent.com https://api.dicebear.com https://*.supabase.co https://*.supabase.in https://*.cloudfront.net https://*.githubusercontent.com",
      // Media: self + CloudFront (video) + Supabase Storage
      "media-src 'self' blob: https://*.cloudfront.net https://*.supabase.co https://*.supabase.in",
      // Connect (API calls): self + Supabase + EmailJS + Lottie WASM fetching + Cloudflare Turnstile
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.in wss://*.supabase.in https://api.emailjs.com https://unpkg.com https://challenges.cloudflare.com",
      // Frames: self + Google auth popup + Turnstile
      "frame-src 'self' https://accounts.google.com https://challenges.cloudflare.com",
      // No plugins
      "object-src 'none'",
      // Base URI restriction
      "base-uri 'self'",
      // Form submissions only to self
      "form-action 'self'",
      // Workers: Lottie uses web workers for parsing sometimes
      "worker-src 'self' blob: https://unpkg.com",
    ].join('; '),
  },
]

const nextConfig = {
  transpilePackages: [
    '@squibl/database',
    '@squibl/types',
    '@squibl/constants',
    '@squibl/validation',
  ],
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  devIndicators: {
    appIsrStatus: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: '**.githubusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
