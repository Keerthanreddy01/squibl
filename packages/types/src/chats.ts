export interface MessageData {
  chatId: string
  senderId: string
  content: string
}

export interface ConversationItem {
  id: string
  participants: string[]
  lastMessage: string
  lastMessageTime: string
  unreadCount?: Record<string, number>
}

export interface MessageItem {
  id: string
  chatId: string
  conversation_id?: string
  senderId: string
  sender_id?: string
  content: string
  text?: string
  read: boolean
  reactions: Record<string, string[]>
  timestamp: string
  created_at?: string
}
