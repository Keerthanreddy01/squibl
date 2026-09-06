import { z } from 'zod'
import { POST_TYPES, POST_VISIBILITY, TEXT_LIMITS } from '@squibl/constants'

export const createPostSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
  author_name: z.string().optional(),
  author_avatar: z.string().nullable().optional(),
  author_username: z.string().optional(),
  content: z
    .string()
    .min(1, 'Post content cannot be empty')
    .max(TEXT_LIMITS.MAX_POST_LENGTH, `Post too long (max ${TEXT_LIMITS.MAX_POST_LENGTH} characters)`),
  stack_tags: z.array(z.string()).default([]),
  post_type: z.enum(POST_TYPES),
  visibility: z.enum(POST_VISIBILITY).default('public'),
  project: z.string().nullable().optional(),
  media_url: z.string().nullable().optional(),
  mediaUrl: z.string().nullable().optional(),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
