import { z } from 'zod'
import { PROJECT_STATUSES, TEXT_LIMITS } from '@squibl/constants'

export const createProjectSchema = z.object({
  owner_uid: z.string().min(1, 'Owner UID is required'),
  name: z.string().min(1, 'Project name is required').max(TEXT_LIMITS.MAX_SHORT_TEXT_LENGTH),
  tagline: z.string().max(TEXT_LIMITS.MAX_SHORT_TEXT_LENGTH).default(''),
  description: z.string().max(TEXT_LIMITS.MAX_BIO_LENGTH).default(''),
  stack: z.array(z.string()).default([]),
  team: z.array(z.string()).default([]),
  github_url: z.string().url().nullable().optional().or(z.literal('')),
  live_url: z.string().url().nullable().optional().or(z.literal('')),
  status: z.enum(PROJECT_STATUSES).default('BETA'),
  author_name: z.string().optional(),
  author_avatar: z.string().nullable().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
