export const PROJECT_STATUSES = ['SHIPPED', 'LIVE', 'BETA', 'OPEN SOURCE'] as const
export type ProjectStatus = typeof PROJECT_STATUSES[number]

export const POST_TYPES = ['update', 'looking_for', 'build_log'] as const
export type PostType = typeof POST_TYPES[number]

export const POST_VISIBILITY = ['public', 'collabs'] as const
export type PostVisibility = typeof POST_VISIBILITY[number]

export const NOTIFICATION_TYPES = ['like', 'comment', 'follow'] as const
export type NotificationType = typeof NOTIFICATION_TYPES[number]

export const WAITLIST_PLATFORMS = ['android', 'ios', 'both'] as const
export type WaitlistPlatform = typeof WAITLIST_PLATFORMS[number]

export const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://squibl.vercel.app',
] as const

export const TEXT_LIMITS = {
  MAX_SHORT_TEXT_LENGTH: 100,
  MAX_BIO_LENGTH: 500,
  MAX_POST_LENGTH: 2000,
} as const
