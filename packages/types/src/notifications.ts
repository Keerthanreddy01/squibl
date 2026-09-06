import type { NotificationType } from '@squibl/constants'

export type { NotificationType }

export interface NotificationData {
  id?: string
  userId: string   // Recipient
  actorId: string  // Performer of action
  actorName: string
  actorAvatar?: string | null
  type: NotificationType
  targetId?: string | null
  content?: string | null
  read: boolean
  created_at?: string
}
