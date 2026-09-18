import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { PressableScale } from '../../components/PressableScale';

const RED = '#E50914';

// ─── Types ───────────────────────────────────────────────────────────────────
interface OtherParticipant {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

interface ConvRow {
  id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  other: OtherParticipant | null;
}

interface MsgRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  reactions: Record<string, string[]>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function avatarLetter(name: string | null): string {
  return (name ?? 'B')[0].toUpperCase();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  return (
    <Animated.View style={[styles.convRow, { opacity: pulse }]}>
      <View style={[styles.convAvatar, { backgroundColor: '#F0F0F0' }]} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ height: 13, width: '50%', backgroundColor: '#F0F0F0', borderRadius: 6 }} />
        <View style={{ height: 11, width: '80%', backgroundColor: '#F0F0F0', borderRadius: 6 }} />
      </View>
    </Animated.View>
  );
}

// ─── Conversation Row ─────────────────────────────────────────────────────────
function ConversationRow({ item, onPress }: { item: ConvRow; onPress: () => void }) {
  return (
    <PressableScale style={styles.convRow} onPress={onPress} activeScale={0.97}>
      {item.other?.avatar_url ? (
        <Image source={{ uri: item.other.avatar_url }} style={styles.convAvatar} />
      ) : (
        <View style={[styles.convAvatar, styles.convAvatarPlaceholder]}>
          <Text style={styles.convAvatarText}>{avatarLetter(item.other?.full_name ?? null)}</Text>
        </View>
      )}
      <View style={styles.convInfo}>
        <View style={styles.convTopRow}>
          <Text style={styles.convName} numberOfLines={1}>
            {item.other?.full_name ?? item.other?.username ?? 'Builder'}
          </Text>
          <Text style={styles.convTime}>{timeAgo(item.last_message_time)}</Text>
        </View>
        {item.other?.username ? (
          <Text style={styles.convUsername}>@{item.other.username}</Text>
        ) : null}
        <Text style={styles.convLastMsg} numberOfLines={1}>
          {item.last_message || 'No messages yet'}
        </Text>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>
            {item.unread_count > 9 ? '9+' : item.unread_count}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isMine }: { msg: MsgRow; isMine: boolean }) {
  return (
    <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
      <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
        {msg.content}
      </Text>
      <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
        {timeAgo(msg.created_at)}
      </Text>
    </View>
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────
function ChatView({
  conv,
  currentUserId,
  currentUserProfile,
  onBack,
}: {
  conv: ConvRow;
  currentUserId: string;
  currentUserProfile: { full_name?: string; avatar_url?: string } | null;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

  // Load message history
  const loadMessages = useCallback(async () => {
    const { data, error } = await (supabase.from('messages') as any)
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });
    if (!error && data) setMessages(data);
    setLoading(false);
  }, [conv.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Mark as read
  useEffect(() => {
    (supabase.from('conversation_participants') as any)
      .update({ unread_count: 0, last_read_at: new Date().toISOString() })
      .eq('conversation_id', conv.id)
      .eq('user_id', currentUserId)
      .then(() => {});
  }, [conv.id, currentUserId]);

  // Realtime subscription
  useEffect(() => {
    channelRef.current = supabase
      .channel(`messages:${conv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conv.id}`,
        },
        (payload) => {
          const newMsg = payload.new as MsgRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [conv.id]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    setSending(true);
    setInputText('');

    try {
      const { error } = await (supabase.from('messages') as any).insert({
        conversation_id: conv.id,
        sender_id: currentUserId,
        content: text,
      });
      if (error) throw error;

      // Update conversation last_message
      await (supabase.from('conversations') as any)
        .update({ last_message: text, last_message_time: new Date().toISOString() })
        .eq('id', conv.id);

      // Increment unread for other participants
      await (supabase.from('conversation_participants') as any)
        .update({ unread_count: (supabase as any).rpc('increment', { x: 1 }) })
        .eq('conversation_id', conv.id)
        .neq('user_id', currentUserId);
    } catch {
      setInputText(text); // restore on fail
    } finally {
      setSending(false);
    }
  }, [inputText, sending, conv.id, currentUserId]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Chat Header */}
      <SafeAreaView edges={['top']} style={styles.chatHeader}>
        <PressableScale onPress={onBack} style={styles.chatBackBtn} activeScale={0.88}>
          <Feather name="arrow-left" size={20} color="#000" />
        </PressableScale>
        {conv.other?.avatar_url ? (
          <Image source={{ uri: conv.other.avatar_url }} style={styles.chatHeaderAvatar} />
        ) : (
          <View style={[styles.chatHeaderAvatar, { backgroundColor: '#18181B', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#FFF', fontWeight: '800' }}>{avatarLetter(conv.other?.full_name ?? null)}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.chatHeaderName}>
            {conv.other?.full_name ?? conv.other?.username ?? 'Builder'}
          </Text>
          {conv.other?.username ? (
            <Text style={styles.chatHeaderRole}>@{conv.other.username}</Text>
          ) : null}
        </View>
      </SafeAreaView>

      {/* Messages */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={RED} />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MessageBubble msg={item} isMine={item.sender_id === currentUserId} />
          )}
          contentContainerStyle={styles.chatMessages}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Feather name="message-circle" size={40} color="#D4D4D8" />
              <Text style={{ color: '#A1A1AA', marginTop: 12, fontWeight: '600' }}>
                Start the conversation
              </Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Message..."
          placeholderTextColor="#A1A1AA"
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <PressableScale
          style={[styles.sendBtn, (!inputText.trim() || sending) && { opacity: 0.4 }]}
          onPress={sendMessage}
          activeScale={0.88}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Feather name="send" size={16} color="#FFFFFF" />
          )}
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Main Messages Screen ─────────────────────────────────────────────────────
export default function MessagesScreen() {
  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [openConv, setOpenConv] = useState<ConvRow | null>(null);
  const channelRef = useRef<any>(null);

  // Get session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      setCurrentUserId(uid);
      if (uid) loadProfile(uid);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user.id ?? null;
      setCurrentUserId(uid);
      if (uid) loadProfile(uid);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid: string) => {
    const { data } = await (supabase.from('builder_profiles') as any)
      .select('full_name, avatar_url')
      .eq('id', uid)
      .maybeSingle();
    if (data) setCurrentUserProfile(data);
  };

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    try {
      // Get all conversations this user is in
      const { data: myParts, error: partErr } = await (supabase.from('conversation_participants') as any)
        .select('conversation_id, unread_count')
        .eq('user_id', currentUserId);

      if (partErr) throw partErr;
      if (!myParts || myParts.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const convIds = myParts.map((p: any) => p.conversation_id);

      // Get conversation details
      const { data: convs, error: convErr } = await (supabase.from('conversations') as any)
        .select('*')
        .in('id', convIds)
        .order('last_message_time', { ascending: false });

      if (convErr) throw convErr;

      // Get other participants
      const { data: allParts, error: allPartsErr } = await (supabase.from('conversation_participants') as any)
        .select('conversation_id, user_id')
        .in('conversation_id', convIds)
        .neq('user_id', currentUserId);

      if (allPartsErr) throw allPartsErr;

      // Get profiles of other participants
      const otherUserIds = [...new Set((allParts || []).map((p: any) => p.user_id))];
      let profilesMap: Record<string, any> = {};

      if (otherUserIds.length > 0) {
        const { data: profiles } = await (supabase.from('builder_profiles') as any)
          .select('id, full_name, avatar_url, username')
          .in('id', otherUserIds);
        if (profiles) {
          profilesMap = Object.fromEntries(profiles.map((pr: any) => [pr.id, pr]));
        }
      }

      // Map unread counts
      const unreadMap: Record<string, number> = {};
      myParts.forEach((p: any) => {
        unreadMap[p.conversation_id] = p.unread_count ?? 0;
      });

      // Other participant per conversation
      const otherPartsMap: Record<string, any> = {};
      (allParts || []).forEach((p: any) => {
        if (!otherPartsMap[p.conversation_id]) {
          otherPartsMap[p.conversation_id] = p.user_id;
        }
      });

      const rows: ConvRow[] = (convs || []).map((c: any) => {
        const otherUid = otherPartsMap[c.id];
        const profile = otherUid ? profilesMap[otherUid] : null;
        return {
          id: c.id,
          last_message: c.last_message ?? '',
          last_message_time: c.last_message_time ?? c.created_at,
          unread_count: unreadMap[c.id] ?? 0,
          other: profile
            ? {
                user_id: profile.id,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                username: profile.username,
              }
            : null,
        };
      });

      setConversations(rows);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      setLoading(true);
      loadConversations();
    }
  }, [currentUserId, loadConversations]);

  // Realtime: refresh list on new messages
  useEffect(() => {
    if (!currentUserId) return;
    channelRef.current = supabase
      .channel('conv-list-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => loadConversations()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_participants' },
        () => loadConversations()
      )
      .subscribe();
    return () => channelRef.current?.unsubscribe();
  }, [currentUserId, loadConversations]);

  // Open conversation
  const handleOpenConv = useCallback((conv: ConvRow) => {
    setOpenConv(conv);
  }, []);

  const handleBack = useCallback(() => {
    setOpenConv(null);
    loadConversations();
  }, [loadConversations]);

  // ─── Chat open ────────────────────────────────────────────────────────────
  if (openConv && currentUserId) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <ChatView
          conv={openConv}
          currentUserId={currentUserId}
          currentUserProfile={currentUserProfile}
          onBack={handleBack}
        />
      </View>
    );
  }

  // ─── Conversation List ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Direct conversations</Text>
      </View>

      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(i) => String(i)}
          renderItem={() => <SkeletonRow />}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Feather name="wifi-off" size={32} color="#D4D4D8" />
          <Text style={styles.emptyTitle}>Couldn't load messages</Text>
          <PressableScale style={styles.retryBtn} onPress={() => { setLoading(true); loadConversations(); }} activeScale={0.92}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </PressableScale>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="message-square" size={30} color="#A1A1AA" />
          </View>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Connect with builders and start a conversation.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ConversationRow item={item} onPress={() => handleOpenConv(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#000000', letterSpacing: -0.6 },
  headerSubtitle: { fontSize: 12, color: '#71717A', fontWeight: '500', marginTop: 2 },
  listContent: { paddingTop: 8, paddingBottom: 110 },

  // Conversation row
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FAFAFA',
  },
  convAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 14 },
  convAvatarPlaceholder: {
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 },
  convInfo: { flex: 1 },
  convTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  convName: { fontSize: 15, fontWeight: '700', color: '#000000', flex: 1 },
  convTime: { fontSize: 11, color: '#A1A1AA', fontWeight: '500' },
  convUsername: { fontSize: 11, color: '#71717A', fontWeight: '600', marginBottom: 3 },
  convLastMsg: { fontSize: 13, color: '#71717A' },
  unreadBadge: {
    backgroundColor: RED,
    borderRadius: 9999,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  // Chat
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
    backgroundColor: '#FFFFFF',
  },
  chatBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F4F4F5',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  chatHeaderAvatar: { width: 38, height: 38, borderRadius: 19, marginRight: 10 },
  chatHeaderName: { fontSize: 15, fontWeight: '700', color: '#000' },
  chatHeaderRole: { fontSize: 11, color: '#71717A', fontWeight: '500' },
  chatMessages: { padding: 16, paddingBottom: 24, gap: 8 },

  // Bubbles
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 6,
  },
  bubbleMine: {
    backgroundColor: RED,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#F4F4F5',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, color: '#18181B', lineHeight: 20 },
  bubbleTextMine: { color: '#FFFFFF' },
  bubbleTime: { fontSize: 10, color: '#A1A1AA', marginTop: 4, textAlign: 'right' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F4F4F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty / Error
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#F4F4F5',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18, fontWeight: '800', color: '#18181B',
    marginBottom: 8, textAlign: 'center',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13, color: '#71717A', textAlign: 'center', lineHeight: 20,
  },
  retryBtn: {
    marginTop: 20, backgroundColor: RED,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  retryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
