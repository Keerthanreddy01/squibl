import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Image,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { PressableScale } from '../../components/PressableScale';

const RED = '#E50914';

// ─── Types ───────────────────────────────────────────────────────────────────
interface BuilderCard {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
  bio: string | null;
  skills: string[];
  stack: string[];
  followers_count: number;
  is_following: boolean;
}

interface PostCard {
  id: string;
  author_name: string | null;
  author_avatar: string | null;
  author_username: string | null;
  content: string;
  stack_tags: string[];
  post_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

type Tab = 'builders' | 'posts';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: '#F0F0F0' }]} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ height: 13, width: '50%', backgroundColor: '#F0F0F0', borderRadius: 6 }} />
          <View style={{ height: 11, width: '35%', backgroundColor: '#F0F0F0', borderRadius: 6 }} />
        </View>
      </View>
      <View style={{ height: 11, width: '90%', backgroundColor: '#F0F0F0', borderRadius: 6, marginBottom: 6 }} />
      <View style={{ height: 11, width: '70%', backgroundColor: '#F0F0F0', borderRadius: 6 }} />
    </Animated.View>
  );
}

// ─── Builder Card ─────────────────────────────────────────────────────────────
function BuilderCardItem({
  item,
  currentUserId,
  onFollow,
}: {
  item: BuilderCard;
  currentUserId: string | null;
  onFollow: (id: string, following: boolean) => void;
}) {
  const isOwnProfile = currentUserId === item.id;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>{(item.full_name ?? 'B')[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.builderInfo}>
          <Text style={styles.builderName} numberOfLines={1}>
            {item.full_name ?? 'Builder'}
          </Text>
          <Text style={styles.builderRole} numberOfLines={1}>
            {item.role ?? (item.username ? `@${item.username}` : 'Builder')}
          </Text>
        </View>
        {!isOwnProfile && currentUserId && (
          <PressableScale
            style={[styles.followBtn, item.is_following && styles.followBtnActive]}
            onPress={() => onFollow(item.id, item.is_following)}
            activeScale={0.92}
          >
            <Text style={[styles.followBtnText, item.is_following && styles.followBtnTextActive]}>
              {item.is_following ? 'Following' : 'Follow'}
            </Text>
          </PressableScale>
        )}
      </View>

      {item.bio ? (
        <Text style={styles.builderBio} numberOfLines={2}>{item.bio}</Text>
      ) : null}

      {item.stack && item.stack.length > 0 && (
        <View style={styles.tagRow}>
          {item.stack.slice(0, 5).map((s) => (
            <View key={s} style={styles.tagBadge}>
              <Text style={styles.tagText}>{s}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.followerCount}>
        {item.followers_count} follower{item.followers_count !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCardItem({ item }: { item: PostCard }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.author_avatar ? (
          <Image source={{ uri: item.author_avatar }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>{(item.author_name ?? 'B')[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.builderInfo}>
          <Text style={styles.builderName} numberOfLines={1}>{item.author_name ?? 'Builder'}</Text>
          <Text style={styles.builderRole}>{timeAgo(item.created_at)}</Text>
        </View>
        <View style={[styles.typePill, { backgroundColor: item.post_type === 'looking_for' ? '#F5F3FF' : item.post_type === 'build_log' ? '#ECFDF5' : '#EFF6FF' }]}>
          <Text style={[styles.typePillText, { color: item.post_type === 'looking_for' ? '#7C3AED' : item.post_type === 'build_log' ? '#059669' : '#0284C7' }]}>
            {item.post_type === 'looking_for' ? 'Looking For' : item.post_type === 'build_log' ? 'Build Log' : 'Update'}
          </Text>
        </View>
      </View>

      <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>

      {item.stack_tags && item.stack_tags.length > 0 && (
        <View style={styles.tagRow}>
          {item.stack_tags.slice(0, 4).map((t) => (
            <View key={t} style={styles.tagBadge}>
              <Text style={styles.tagText}>#{t}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.postFooter}>
        <View style={styles.postStat}>
          <Feather name="heart" size={12} color="#A1A1AA" />
          <Text style={styles.postStatText}>{item.likes_count}</Text>
        </View>
        <View style={styles.postStat}>
          <Feather name="message-circle" size={12} color="#A1A1AA" />
          <Text style={styles.postStatText}>{item.comments_count}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const [tab, setTab] = useState<Tab>('builders');
  const [search, setSearch] = useState('');
  const [builders, setBuilders] = useState<BuilderCard[]>([]);
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user.id ?? null);
    });
  }, []);

  // Load builders
  const loadBuilders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: profiles, error: pErr } = await (supabase.from('builder_profiles') as any)
        .select('id, full_name, username, avatar_url, role, bio, skills, stack')
        .order('created_at', { ascending: false })
        .limit(50);
      if (pErr) throw pErr;

      // Get follower counts
      const { data: connData } = await (supabase.from('connections') as any)
        .select('following_id');

      const followerCounts: Record<string, number> = {};
      (connData || []).forEach((c: any) => {
        followerCounts[c.following_id] = (followerCounts[c.following_id] ?? 0) + 1;
      });

      // Get who current user follows
      let followingSet: Set<string> = new Set();
      if (currentUserId) {
        const { data: myFollowing } = await (supabase.from('connections') as any)
          .select('following_id')
          .eq('follower_id', currentUserId);
        (myFollowing || []).forEach((c: any) => followingSet.add(c.following_id));
      }

      const cards: BuilderCard[] = (profiles || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        username: p.username,
        avatar_url: p.avatar_url,
        role: p.role,
        bio: p.bio,
        skills: p.skills || [],
        stack: p.stack || [],
        followers_count: followerCounts[p.id] ?? 0,
        is_following: followingSet.has(p.id),
      }));

      setBuilders(cards);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load builders');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Load posts
  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: pErr } = await (supabase.from('posts') as any)
        .select('*, post_likes(user_id), post_comments(id)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (pErr) throw pErr;

      const cards: PostCard[] = (data || []).map((p: any) => ({
        id: p.id,
        author_name: p.author_name,
        author_avatar: p.author_avatar,
        author_username: p.author_username,
        content: p.content,
        stack_tags: p.stack_tags || [],
        post_type: p.post_type,
        likes_count: Array.isArray(p.post_likes) ? p.post_likes.length : 0,
        comments_count: Array.isArray(p.post_comments) ? p.post_comments.length : 0,
        created_at: p.created_at,
      }));

      setPosts(cards);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'builders') {
      loadBuilders();
    } else {
      loadPosts();
    }
  }, [tab, loadBuilders, loadPosts]);

  // Follow / Unfollow
  const handleFollow = useCallback(async (targetId: string, isFollowing: boolean) => {
    if (!currentUserId) return;

    // Optimistic update
    setBuilders((prev) =>
      prev.map((b) =>
        b.id === targetId
          ? {
              ...b,
              is_following: !isFollowing,
              followers_count: isFollowing ? b.followers_count - 1 : b.followers_count + 1,
            }
          : b
      )
    );

    try {
      if (isFollowing) {
        await (supabase.from('connections') as any)
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetId);
      } else {
        await (supabase.from('connections') as any)
          .insert({ follower_id: currentUserId, following_id: targetId });
      }
    } catch {
      // Revert
      setBuilders((prev) =>
        prev.map((b) =>
          b.id === targetId
            ? {
                ...b,
                is_following: isFollowing,
                followers_count: isFollowing ? b.followers_count + 1 : b.followers_count - 1,
              }
            : b
        )
      );
    }
  }, [currentUserId]);

  // Filter by search
  const filteredBuilders = builders.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (b.full_name ?? '').toLowerCase().includes(q) ||
      (b.username ?? '').toLowerCase().includes(q) ||
      (b.role ?? '').toLowerCase().includes(q) ||
      b.stack.some((s) => s.toLowerCase().includes(q))
    );
  });

  const filteredPosts = posts.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.content.toLowerCase().includes(q) ||
      (p.author_name ?? '').toLowerCase().includes(q) ||
      p.stack_tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSubtitle}>Discover builders, projects &amp; posts</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Feather name="search" size={16} color="#A1A1AA" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={tab === 'builders' ? 'Search builders, skills...' : 'Search posts, tags...'}
          placeholderTextColor="#A1A1AA"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'builders' && styles.tabActive]}
          onPress={() => setTab('builders')}
        >
          <Text style={[styles.tabText, tab === 'builders' && styles.tabTextActive]}>
            Builders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'posts' && styles.tabActive]}
          onPress={() => setTab('posts')}
        >
          <Text style={[styles.tabText, tab === 'posts' && styles.tabTextActive]}>
            Posts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(i) => String(i)}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Feather name="wifi-off" size={32} color="#D4D4D8" />
          <Text style={styles.emptyTitle}>Couldn't load</Text>
          <PressableScale
            style={styles.retryBtn}
            onPress={() => tab === 'builders' ? loadBuilders() : loadPosts()}
            activeScale={0.92}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </PressableScale>
        </View>
      ) : tab === 'builders' ? (
        <FlatList
          data={filteredBuilders}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <BuilderCardItem
              item={item}
              currentUserId={currentUserId}
              onFollow={handleFollow}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="users" size={32} color="#D4D4D8" />
              <Text style={styles.emptyTitle}>
                {search ? 'No builders match your search' : 'No builders yet'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCardItem item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="layers" size={32} color="#D4D4D8" />
              <Text style={styles.emptyTitle}>
                {search ? 'No posts match your search' : 'No posts yet'}
              </Text>
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#000000', letterSpacing: -0.6 },
  headerSubtitle: { fontSize: 12, color: '#71717A', fontWeight: '500', marginTop: 2 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#F4F4F5',
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#000',
  },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#71717A' },
  tabTextActive: { color: '#000000', fontWeight: '700' },

  listContent: { paddingHorizontal: 16, paddingBottom: 110, gap: 12 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarImg: { width: 42, height: 42, borderRadius: 21, marginRight: 12 },
  avatarPlaceholder: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#18181B',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  avatarLetter: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  builderInfo: { flex: 1 },
  builderName: { fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 2 },
  builderRole: { fontSize: 12, color: '#71717A', fontWeight: '500' },
  builderBio: { fontSize: 13, color: '#52525B', lineHeight: 19, marginBottom: 10 },
  followerCount: { fontSize: 12, color: '#A1A1AA', fontWeight: '600', marginTop: 8 },

  followBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: '#18181B',
    backgroundColor: 'transparent',
  },
  followBtnActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  followBtnText: { fontSize: 12, fontWeight: '700', color: '#18181B' },
  followBtnTextActive: { color: '#FFFFFF' },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tagBadge: { backgroundColor: '#F4F4F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '600', color: '#52525B' },

  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typePillText: { fontSize: 10, fontWeight: '700' },

  postContent: { fontSize: 13, color: '#27272A', lineHeight: 20, marginBottom: 10 },
  postFooter: { flexDirection: 'row', gap: 14, marginTop: 4 },
  postStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatText: { fontSize: 12, color: '#A1A1AA', fontWeight: '600' },

  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 60, paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 17, fontWeight: '800', color: '#18181B',
    marginTop: 12, textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16, backgroundColor: RED,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  retryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
