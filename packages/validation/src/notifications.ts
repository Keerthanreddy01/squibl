import { z } from 'zod'
import { NOTIFICATION_TYPES } from '@squibl/constants'

export const createNotificationSchema = z.object({
  userId: z.string().min(1, 'Target user ID is required'),
  actorId: z.string().min(1, 'Actor ID is required'),
  actorName: z.string().min(1, 'Actor name is required'),
  actorAvatar: z.string().nullable().optional(),
  type: z.enum(NOTIFICATION_TYPES),
  targetId: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
})

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>
