import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { PostItem } from '@squibl/types';
import { supabase } from '../../lib/supabase';
import { PressableScale } from '../../components/PressableScale';

const RED = '#E50914';

interface FeedCardData {
  id: string;
  authorName: string;
  authorRole: string;
  avatarLetter: string;
  timeAgo: string;
  title: string;
  content: string;
  tags: string[];
  likesCount: number;
}

const SAMPLE_POSTS: FeedCardData[] = [
  {
    id: 'post-1',
    authorName: 'Alex Rivera',
    authorRole: 'Full Stack Engineer',
    avatarLetter: 'A',
    timeAgo: '12m ago',
    title: 'Building an AI Agent orchestrator in TypeScript',
    content:
      'Looking for a mobile engineer experienced with React Native and Expo to collaborate on our open-source companion app.',
    tags: ['React Native', 'TypeScript', 'AI'],
    likesCount: 18,
  },
  {
    id: 'post-2',
    authorName: 'Keerthan Reddy',
    authorRole: 'Squibl Founder',
    avatarLetter: 'K',
    timeAgo: '1h ago',
    title: 'Welcome to the Squibl mobile experience!',
    content:
      'Engineered from the ground up for high-performance builder networking. Responsive interactions, 60 FPS motion, and zero bloat.',
    tags: ['Squibl', 'Community', 'Builders'],
    likesCount: 42,
  },
  {
    id: 'post-3',
    authorName: 'Sarah Chen',
    authorRole: 'Systems Architect',
    avatarLetter: 'S',
    timeAgo: '3h ago',
    title: 'PostgreSQL Real-Time Subscriptions benchmark',
    content:
      'Benchmarking row-level security policies under high concurrent load with Supabase. Write-ups and metrics coming soon.',
    tags: ['PostgreSQL', 'Supabase', 'Perf'],
    likesCount: 29,
  },
];

const FeedCardItem = React.memo<{ item: FeedCardData }>(({ item }) => {
  return (
    <PressableScale style={styles.card} activeScale={0.98}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.avatarLetter}</Text>
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.authorName}</Text>
          <Text style={styles.authorRole}>{item.authorRole} • {item.timeAgo}</Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardContent}>{item.content}</Text>

      <View style={styles.tagRow}>
        {item.tags.map((tag) => (
          <View key={tag} style={styles.tagBadge}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.likesText}>❤️ {item.likesCount} builders</Text>
      </View>
    </PressableScale>
  );
});

export default function FeedScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState(SAMPLE_POSTS);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }, [router]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setPosts([...SAMPLE_POSTS]);
      setRefreshing(false);
    }, 600);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FeedCardData }) => <FeedCardItem item={item} />,
    []
  );

  const keyExtractor = useCallback((item: FeedCardData) => item.id, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>SQUIBL</Text>
          <Text style={styles.feedSubtitle}>Builder Feed</Text>
        </View>

        <PressableScale
          style={styles.devLogoutBtn}
          onPress={handleLogout}
          activeScale={0.92}
        >
          <Text style={styles.devLogoutText}>Logout</Text>
        </PressableScale>
      </View>

      {/* 60 FPS Native Scroll Feed */}
      <FlatList
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={RED}
            colors={[RED]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
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
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.5,
  },
  feedSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
  },
  devLogoutBtn: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(244, 244, 245, 0.9)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  devLogoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: RED,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#18181B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  authorRole: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  cardContent: {
    fontSize: 14,
    color: '#3F3F46',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagBadge: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#52525B',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
    paddingTop: 10,
  },
  likesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
  },
});
