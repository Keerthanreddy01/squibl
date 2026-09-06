import { z } from 'zod'
import { TEXT_LIMITS } from '@squibl/constants'

export const updateProfileSchema = z.object({
  full_name: z.string().max(TEXT_LIMITS.MAX_SHORT_TEXT_LENGTH).nullable().optional(),
  username: z.string().max(TEXT_LIMITS.MAX_SHORT_TEXT_LENGTH).nullable().optional(),
  avatar_url: z.string().url().nullable().optional().or(z.literal('')),
  bio: z.string().max(TEXT_LIMITS.MAX_BIO_LENGTH).nullable().optional(),
  role: z.string().max(TEXT_LIMITS.MAX_SHORT_TEXT_LENGTH).nullable().optional(),
  location: z.string().max(TEXT_LIMITS.MAX_SHORT_TEXT_LENGTH).nullable().optional(),
  skills: z.array(z.string()).optional(),
  stack: z.array(z.string()).optional(),
  experience_level: z.string().optional(),
  looking_for: z.array(z.string()).optional(),
  availability: z.string().optional(),
  github_url: z.string().url().nullable().optional().or(z.literal('')),
  twitter_url: z.string().url().nullable().optional().or(z.literal('')),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
