import { supabase } from './supabase/client'

import type { NotificationType, NotificationData } from '@squibl/types'
export type { NotificationType, NotificationData } from '@squibl/types'

export async function createNotification(data: Omit<NotificationData, 'read'>) {
  try {
    if (data.userId === data.actorId) return

    const { error } = await (supabase
      .from('notifications') as any)
      .insert({
        user_id: data.userId,
        actor_id: data.actorId,
        actor_name: data.actorName,
        actor_avatar: data.actorAvatar || null,
        type: data.type,
        target_id: data.targetId || null,
        content: data.content || null,
        read: false,
      })

    if (error) throw error
  } catch (err: any) {
    console.error('[Notifications] Failed to create notification:', err)
  }
}

export function subscribeToNotifications(userId: string, callback: (notifications: NotificationData[]) => void) {
  let isSubscribed = true
  let currentList: NotificationData[] = []

  async function fetchNotifications() {
    try {
      const { data, error } = await (supabase
        .from('notifications') as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error || !isSubscribed) return

      currentList = ((data || []) as any[]).map(n => ({
        id: n.id,
        userId: n.user_id,
        actorId: n.actor_id,
        actorName: n.actor_name,
        actorAvatar: n.actor_avatar,
        type: n.type as NotificationType,
        targetId: n.target_id,
        content: n.content,
        read: n.read,
        created_at: n.created_at,
      }))

      callback(currentList)
    } catch (err) {
      console.error('[Notifications] fetch error:', err)
    }
  }

  fetchNotifications()

  // Realtime subscription for incoming notifications
  const channel = supabase
    .channel(`user-notifications-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => {
        if (!isSubscribed) return
        const n = payload.new as any
        const formatted: NotificationData = {
          id: n.id,
          userId: n.user_id,
          actorId: n.actor_id,
          actorName: n.actor_name,
          actorAvatar: n.actor_avatar,
          type: n.type as NotificationType,
          targetId: n.target_id,
          content: n.content,
          read: n.read,
          created_at: n.created_at,
        }

        currentList = [formatted, ...currentList.filter(item => item.id !== formatted.id)]
        callback(currentList)
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => {
        if (!isSubscribed) return
        const updated = payload.new as any
        currentList = currentList.map(item => item.id === updated.id ? { ...item, read: updated.read } : item)
        callback(currentList)
      }
    )
    .subscribe()

  return () => {
    isSubscribed = false
    supabase.removeChannel(channel)
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    await (supabase
      .from('notifications') as any)
      .update({ read: true })
      .eq('id', id)
  } catch (err) {
    // Silent fail
  }
}
