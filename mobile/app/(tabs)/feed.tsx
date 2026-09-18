import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
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
import type { PostItem } from '@squibl/types';

const RED = '#E50914';
const PAGE_SIZE = 15;

// ─── Skeleton Card ───────────────────────────────────────────────────────────
function SkeletonCard() {
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
    <Animated.View style={[styles.card, { opacity: pulse }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, styles.skeletonBox]} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[styles.skeletonBox, { height: 12, width: '55%', borderRadius: 6 }]} />
          <View style={[styles.skeletonBox, { height: 10, width: '35%', borderRadius: 6 }]} />
        </View>
      </View>
      <View style={[styles.skeletonBox, { height: 14, width: '80%', borderRadius: 6, marginBottom: 8 }]} />
      <View style={[styles.skeletonBox, { height: 12, width: '100%', borderRadius: 6, marginBottom: 6 }]} />
      <View style={[styles.skeletonBox, { height: 12, width: '70%', borderRadius: 6 }]} />
    </Animated.View>
  );
}

// ─── Time Formatter ──────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Post Type Badge ──────────────────────────────────────────────────────────
function PostTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    update: { label: 'Update', color: '#0284C7', bg: '#EFF6FF' },
    looking_for: { label: 'Looking For', color: '#7C3AED', bg: '#F5F3FF' },
    build_log: { label: 'Build Log', color: '#059669', bg: '#ECFDF5' },
  };
  const c = config[type] ?? config.update;
  return (
    <View style={[styles.typeBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.typeBadgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

// ─── Feed Card ────────────────────────────────────────────────────────────────
interface FeedCardProps {
  item: PostItem;
  currentUserId: string | null;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
}

const FeedCard = React.memo<FeedCardProps>(({ item, currentUserId, onLike, onComment }) => {
  const isLiked = currentUserId ? item.likes.includes(currentUserId) : false;
  const likeCount = item.likes.length;

  const avatarLetter = (item.author_name ?? 'B')[0].toUpperCase();

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        {item.author_avatar ? (
          <Image source={{ uri: item.author_avatar }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
        )}
        <View style={styles.authorInfo}>
          <Text style={styles.authorName} numberOfLines={1}>
            {item.author_name ?? 'Builder'}
          </Text>
          <Text style={styles.authorMeta}>
            {item.author_username ? `@${item.author_username}` : ''} · {timeAgo(item.created_at)}
          </Text>
        </View>
        <PostTypeBadge type={item.post_type} />
      </View>

      {/* Content */}
      <Text style={styles.cardContent}>{item.content}</Text>

      {/* Media */}
      {item.media_url ? (
        <Image
          source={{ uri: item.media_url }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
      ) : null}

      {/* Tags */}
      {item.stack_tags && item.stack_tags.length > 0 && (
        <View style={styles.tagRow}>
          {item.stack_tags.slice(0, 4).map((tag) => (
            <View key={tag} style={styles.tagBadge}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer Actions */}
      <View style={styles.cardFooter}>
        <PressableScale
          style={[styles.actionBtn, isLiked && styles.actionBtnLiked]}
          onPress={() => onLike(item.id)}
          activeScale={0.88}
        >
          <Feather
            name="heart"
            size={15}
            color={isLiked ? RED : '#71717A'}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.actionText, isLiked && { color: RED }]}>
            {likeCount > 0 ? likeCount : ''}
            {likeCount > 0 ? ' ' : ''}Like{likeCount !== 1 ? 's' : ''}
          </Text>
        </PressableScale>

        <PressableScale
          style={styles.actionBtn}
          onPress={() => onComment(item.id)}
          activeScale={0.88}
        >
          <Feather name="message-circle" size={15} color="#71717A" style={{ marginRight: 5 }} />
          <Text style={styles.actionText}>
            {item.comments_count > 0 ? `${item.comments_count} ` : ''}
            Comment{item.comments_count !== 1 ? 's' : ''}
          </Text>
        </PressableScale>
      </View>
    </View>
  );
});

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyFeed() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Feather name="layers" size={32} color="#A1A1AA" />
      </View>
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to share a build update, or follow more builders to see their posts here.
      </Text>
    </View>
  );
}

// ─── Error State ─────────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Feather name="wifi-off" size={32} color="#A1A1AA" style={{ marginBottom: 12 }} />
      <Text style={styles.emptyTitle}>Couldn't load posts</Text>
      <Text style={styles.emptySubtitle}>Check your connection and try again.</Text>
      <PressableScale style={styles.retryBtn} onPress={onRetry} activeScale={0.94}>
        <Text style={styles.retryBtnText}>Retry</Text>
      </PressableScale>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function FeedScreen() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const offsetRef = useRef(0);

  // Get current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setCurrentUserId(session?.user.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async (offset = 0, replace = true) => {
    try {
      const { data, error: qErr } = await (supabase.from('posts') as any)
        .select(`
          *,
          post_likes ( user_id ),
          post_comments ( id )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (qErr) throw qErr;

      const formatted: PostItem[] = (data || []).map((p: any) => ({
        id: p.id,
        uid: p.uid,
        author_name: p.author_name,
        author_avatar: p.author_avatar,
        author_username: p.author_username,
        content: p.content,
        stack_tags: p.stack_tags || [],
        post_type: p.post_type,
        visibility: p.visibility,
        project: p.project,
        media_url: p.media_url,
        mediaUrl: p.media_url,
        views_count: p.views_count || 0,
        likes: Array.isArray(p.post_likes) ? p.post_likes.map((l: any) => l.user_id) : [],
        comments_count: Array.isArray(p.post_comments) ? p.post_comments.length : 0,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));

      setHasMore(formatted.length === PAGE_SIZE);
      offsetRef.current = offset + formatted.length;

      if (replace) {
        setPosts(formatted);
      } else {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((x) => x.id));
          const newOnes = formatted.filter((x) => !existingIds.has(x.id));
          return [...prev, ...newOnes];
        });
      }
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'Unknown error');
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    offsetRef.current = 0;
    fetchPosts(0, true).finally(() => setLoading(false));
  }, [fetchPosts]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    offsetRef.current = 0;
    await fetchPosts(0, true);
    setRefreshing(false);
  }, [fetchPosts]);

  // Pagination
  const onEndReached = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPosts(offsetRef.current, false);
    setLoadingMore(false);
  }, [loadingMore, hasMore, fetchPosts]);

  // Like / Unlike
  const handleLike = useCallback(async (postId: string) => {
    if (!currentUserId) return;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const already = p.likes.includes(currentUserId);
        return {
          ...p,
          likes: already
            ? p.likes.filter((id) => id !== currentUserId)
            : [...p.likes, currentUserId],
        };
      })
    );

    // Persist to Supabase
    try {
      const { data: existing } = await (supabase.from('post_likes') as any)
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (existing) {
        await (supabase.from('post_likes') as any).delete().eq('id', existing.id);
      } else {
        await (supabase.from('post_likes') as any).insert({ post_id: postId, user_id: currentUserId });
      }
    } catch {
      // Revert optimistic update on failure
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const already = p.likes.includes(currentUserId);
          return {
            ...p,
            likes: already
              ? p.likes.filter((id) => id !== currentUserId)
              : [...p.likes, currentUserId],
          };
        })
      );
    }
  }, [currentUserId]);

  const handleComment = useCallback((_postId: string) => {
    // TODO: open comment sheet
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: PostItem }) => (
      <FeedCard
        item={item}
        currentUserId={currentUserId}
        onLike={handleLike}
        onComment={handleComment}
      />
    ),
    [currentUserId, handleLike, handleComment]
  );

  const keyExtractor = useCallback((item: PostItem) => item.id, []);

  const ListFooter = () =>
    loadingMore ? (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={RED} />
      </View>
    ) : null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>SQUIBL</Text>
          <Text style={styles.feedSubtitle}>Builder Feed</Text>
        </View>
        <PressableScale style={styles.refreshBtn} onPress={onRefresh} activeScale={0.88}>
          <Feather name="refresh-cw" size={16} color="#52525B" />
        </PressableScale>
      </View>

      {/* Loading skeletons */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(i) => String(i)}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      ) : error ? (
        <ErrorState onRetry={() => { setLoading(true); fetchPosts(0, true).finally(() => setLoading(false)); }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<EmptyFeed />}
          ListFooterComponent={<ListFooter />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={RED}
              colors={[RED]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  brandTitle: { fontSize: 20, fontWeight: '900', color: '#000000', letterSpacing: -0.5 },
  feedSubtitle: { fontSize: 12, fontWeight: '600', color: '#71717A', marginTop: 1 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F4F4F5',
    alignItems: 'center', justifyContent: 'center',
  },

  listContent: { padding: 16, paddingBottom: 110 },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#18181B',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
  },
  avatarImg: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '700', color: '#000000' },
  authorMeta: { fontSize: 11, color: '#71717A', fontWeight: '500', marginTop: 1 },

  typeBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 6,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },

  cardContent: {
    fontSize: 14, color: '#27272A', lineHeight: 21,
    marginBottom: 12,
  },
  mediaImage: {
    width: '100%', height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F4F4F5',
  },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  tagBadge: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: { fontSize: 11, fontWeight: '600', color: '#52525B' },

  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
    paddingTop: 12,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  actionBtnLiked: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  actionText: { fontSize: 12, fontWeight: '600', color: '#71717A' },

  // Skeleton
  skeletonBox: { backgroundColor: '#F0F0F0' },

  // Empty / Error
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingTop: 80,
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
  },
  emptySubtitle: {
    fontSize: 13, color: '#71717A', textAlign: 'center', lineHeight: 20,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: RED,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  // Pagination
  loadingMore: { paddingVertical: 20, alignItems: 'center' },
});
