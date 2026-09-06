import { supabase } from './supabase/client'
import { sanitizeText } from './sanitize'

import type { MessageData, ConversationItem, MessageItem } from '@squibl/types'
export type { MessageData, ConversationItem, MessageItem } from '@squibl/types'

/**
 * Creates or retrieves a 1-on-1 chat conversation between two participants.
 */
export async function createChat(participants: string[]): Promise<{ data: string | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const uniqueParticipants = Array.from(new Set(participants))

    if (!user || uniqueParticipants.length !== 2 || !uniqueParticipants.includes(user.id)) {
      return { data: null, error: 'A conversation must contain you and exactly one other user.' }
    }

    // Check if conversation already exists between these 2 users
    const otherUserId = uniqueParticipants.find(p => p !== user.id)!

    const { data: myConvs } = await (supabase
      .from('conversation_participants') as any)
      .select('conversation_id')
      .eq('user_id', user.id)

    if (myConvs && myConvs.length > 0) {
      const myConvIds = (myConvs as Array<{ conversation_id: string }>).map(c => c.conversation_id)
      const { data: existingConv } = await (supabase
        .from('conversation_participants') as any)
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', myConvIds)
        .maybeSingle()

      if (existingConv) {
        return { data: (existingConv as { conversation_id: string }).conversation_id, error: null }
      }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await (supabase
      .from('conversations') as any)
      .insert({
        last_message: '',
        last_message_time: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (convError) throw convError

    // Insert participants
    const participantsData = uniqueParticipants.map(uid => ({
      conversation_id: newConv.id,
      user_id: uid,
      unread_count: 0,
      last_read_at: new Date().toISOString(),
    }))

    const { error: partError } = await (supabase
      .from('conversation_participants') as any)
      .insert(participantsData)

    if (partError) throw partError

    return { data: newConv.id, error: null }
  } catch (err: any) {
    console.error('[Chats] createChat error:', err)
    return { data: null, error: err.message || String(err) }
  }
}

/**
 * Sends a message within a conversation.
 */
export async function sendMessage(data: MessageData): Promise<{ data: string | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== data.senderId) {
      return { data: null, error: 'Unauthorized: sender mismatch' }
    }

    const sanitized = sanitizeText(data.content, 1000)
    if (!sanitized) {
      return { data: null, error: 'Message cannot be empty' }
    }

    // Insert message
    const { data: newMsg, error: msgError } = await (supabase
      .from('messages') as any)
      .insert({
        conversation_id: data.chatId,
        sender_id: data.senderId,
        content: sanitized,
        read: false,
      })
      .select('id')
      .single()

    if (msgError) throw msgError

    const now = new Date().toISOString()

    // Update conversation last message
    await (supabase
      .from('conversations') as any)
      .update({
        last_message: sanitized,
        last_message_time: now,
      })
      .eq('id', data.chatId)

    // Increment unread count for other participants
    const { data: participants } = await (supabase
      .from('conversation_participants') as any)
      .select('id, user_id, unread_count')
      .eq('conversation_id', data.chatId)

    if (participants) {
      for (const p of participants) {
        if (p.user_id !== data.senderId) {
          await (supabase
            .from('conversation_participants') as any)
            .update({ unread_count: (p.unread_count || 0) + 1 })
            .eq('id', p.id)
        } else {
          await (supabase
            .from('conversation_participants') as any)
            .update({ unread_count: 0, last_read_at: now })
            .eq('id', p.id)
        }
      }
    }

    return { data: newMsg.id, error: null }
  } catch (err: any) {
    console.error('[Chats] sendMessage error:', err)
    return { data: null, error: err.message || String(err) }
  }
}

/**
 * Subscribes to the user's active conversations.
 */
export function subscribeToChats(userId: string, callback: (chats: any[]) => void) {
  let isSubscribed = true

  async function fetchUserChats() {
    try {
      const { data: participantRows, error } = await (supabase
        .from('conversation_participants') as any)
        .select(`
          conversation_id,
          unread_count,
          conversations (
            id,
            last_message,
            last_message_time
          )
        `)
        .eq('user_id', userId)

      if (error || !participantRows || !isSubscribed) return

      const convIds = (participantRows as any[]).map(p => p.conversation_id)
      if (convIds.length === 0) {
        callback([])
        return
      }

      // Fetch all participants for these conversations
      const { data: allParticipants } = await (supabase
        .from('conversation_participants') as any)
        .select('conversation_id, user_id, unread_count')
        .in('conversation_id', convIds)

      const chatList: ConversationItem[] = (participantRows as any[])
        .filter(p => p.conversations)
        .map(p => {
          const conv = p.conversations as any
          const participants = ((allParticipants || []) as any[])
            .filter(ap => ap.conversation_id === p.conversation_id)
            .map(ap => ap.user_id)

          const unreadCountMap: Record<string, number> = {};
          const matchingParticipants = (allParticipants || []) as any[];
          matchingParticipants.filter(ap => ap.conversation_id === p.conversation_id).forEach(ap => {
            unreadCountMap[ap.user_id] = ap.unread_count || 0;
          });

          return {
            id: conv.id,
            participants,
            lastMessage: conv.last_message || '',
            lastMessageTime: conv.last_message_time || new Date(0).toISOString(),
            unreadCount: unreadCountMap,
          }
        })

      chatList.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
      callback(chatList)
    } catch (err) {
      console.error('[Chats] subscribeToChats fetch error:', err)
    }
  }

  fetchUserChats()

  // Realtime channel for conversation updates
  const channel = supabase
    .channel(`user-chats-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'conversations' },
      () => fetchUserChats()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${userId}` },
      () => fetchUserChats()
    )
    .subscribe()

  return () => {
    isSubscribed = false
    supabase.removeChannel(channel)
  }
}

/**
 * Subscribes to messages within a conversation with Supabase Realtime.
 */
export function subscribeToMessages(chatId: string, callback: (messages: any[]) => void) {
  let isSubscribed = true
  let currentMessages: any[] = []

  async function fetchMessages() {
    try {
      const { data, error } = await (supabase
        .from('messages') as any)
        .select('*')
        .eq('conversation_id', chatId)
        .order('created_at', { ascending: true })

      if (error || !isSubscribed) return

      currentMessages = ((data || []) as any[]).map(m => ({
        id: m.id,
        chatId: m.conversation_id,
        conversation_id: m.conversation_id,
        senderId: m.sender_id,
        sender_id: m.sender_id,
        content: m.content,
        text: m.content,
        read: m.read,
        reactions: m.reactions || {},
        timestamp: m.created_at,
        created_at: m.created_at,
      }))

      callback(currentMessages)
    } catch (err) {
      console.error('[Chats] fetchMessages error:', err)
    }
  }

  fetchMessages()

  const channel = supabase
    .channel(`chat-messages-${chatId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${chatId}` },
      (payload) => {
        if (!isSubscribed) return
        const newMsg = payload.new as any
        const formatted: MessageItem = {
          id: newMsg.id,
          chatId: newMsg.conversation_id,
          conversation_id: newMsg.conversation_id,
          senderId: newMsg.sender_id,
          sender_id: newMsg.sender_id,
          content: newMsg.content,
          text: newMsg.content,
          read: newMsg.read,
          reactions: newMsg.reactions || {},
          timestamp: newMsg.created_at,
          created_at: newMsg.created_at,
        }

        currentMessages = [...currentMessages.filter(m => m.id !== formatted.id), formatted]
        callback(currentMessages)
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${chatId}` },
      (payload) => {
        if (!isSubscribed) return
        const updatedMsg = payload.new as any
        currentMessages = currentMessages.map(m => {
          if (m.id === updatedMsg.id) {
            return {
              ...m,
              content: updatedMsg.content,
              text: updatedMsg.content,
              read: updatedMsg.read,
              reactions: updatedMsg.reactions || {},
            }
          }
          return m
        })
        callback(currentMessages)
      }
    )
    .subscribe()

  return () => {
    isSubscribed = false
    supabase.removeChannel(channel)
  }
}

/**
 * Resets the unread message count to 0 for a user in a specific conversation.
 */
export async function markConversationAsRead(chatId: string, userId: string) {
  try {
    await (supabase
      .from('conversation_participants') as any)
      .update({
        unread_count: 0,
        last_read_at: new Date().toISOString(),
      })
      .eq('conversation_id', chatId)
      .eq('user_id', userId)
  } catch (err) {
    console.error('[Chats] markConversationAsRead error:', err)
  }
}

/**
 * Toggles a message reaction in Supabase.
 */
export async function toggleMessageReaction(
  chatId: string,
  messageId: string,
  emoji: string,
  userId: string,
  currentReactions: any
) {
  try {
    const reactions = currentReactions ? { ...currentReactions } : {}
    const users: string[] = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : []

    if (users.includes(userId)) {
      reactions[emoji] = users.filter(uid => uid !== userId)
      if (reactions[emoji].length === 0) {
        delete reactions[emoji]
      }
    } else {
      reactions[emoji] = [...users, userId]
    }

    await (supabase
      .from('messages') as any)
      .update({ reactions })
      .eq('id', messageId)
      .eq('conversation_id', chatId)
  } catch (err) {
    console.error('[Chats] toggleMessageReaction error:', err)
  }
}
