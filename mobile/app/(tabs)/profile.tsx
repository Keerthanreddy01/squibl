import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  Platform,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { PressableScale } from '../../components/PressableScale';

const RED = '#E50914';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BuilderProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
  location: string | null;
  skills: string[];
  stack: string[];
  experience_level: string;
  looking_for: string[];
  availability: string;
  github_url: string | null;
  twitter_url: string | null;
  email: string | null;
}

interface FollowStats { followers: number; following: number; }

interface UserPost {
  id: string;
  content: string;
  stack_tags: string[];
  post_type: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

type EditForm = {
  full_name: string;
  bio: string;
  role: string;
  location: string;
  github_url: string;
  twitter_url: string;
  availability: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
function ProfileSkeleton() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  const S = { backgroundColor: '#F0F0F0', borderRadius: 8 };
  return (
    <Animated.View style={[{ padding: 24, alignItems: 'center' as const }, { opacity: pulse }]}>
      <View style={[{ width: 96, height: 96, borderRadius: 48 }, S, { marginBottom: 16 }]} />
      <View style={[{ width: 140, height: 16 }, S, { marginBottom: 8 }]} />
      <View style={[{ width: 100, height: 12 }, S, { marginBottom: 20 }]} />
      <View style={{ flexDirection: 'row', gap: 24, marginBottom: 20 }}>
        {[0, 1].map((i) => <View key={i} style={[{ width: 60, height: 40 }, S]} />)}
      </View>
      <View style={[{ width: '100%' as const, height: 60 }, S, { marginBottom: 12 }]} />
    </Animated.View>
  );
}

// ─── Availability Badge ───────────────────────────────────────────────────────
function AvailabilityBadge({ status }: { status: string }) {
  const isOpen = status.toLowerCase().includes('open');
  return (
    <View style={[styles.availBadge, isOpen && styles.availBadgeOpen]}>
      <View style={[styles.availDot, isOpen && styles.availDotOpen]} />
      <Text style={[styles.availText, isOpen && styles.availTextOpen]}>{status}</Text>
    </View>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({
  visible,
  profile,
  onClose,
  onSave,
}: {
  visible: boolean;
  profile: BuilderProfile | null;
  onClose: () => void;
  onSave: (updated: Partial<BuilderProfile>) => void;
}) {
  const [form, setForm] = useState<EditForm>({
    full_name: profile?.full_name ?? '',
    bio: profile?.bio ?? '',
    role: profile?.role ?? '',
    location: profile?.location ?? '',
    github_url: profile?.github_url ?? '',
    twitter_url: profile?.twitter_url ?? '',
    availability: profile?.availability ?? 'Open to collab',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        bio: profile.bio ?? '',
        role: profile.role ?? '',
        location: profile.location ?? '',
        github_url: profile.github_url ?? '',
        twitter_url: profile.twitter_url ?? '',
        availability: profile.availability ?? 'Open to collab',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const updated: Partial<BuilderProfile> = {
      full_name: form.full_name.trim() || null,
      bio: form.bio.trim() || null,
      role: form.role.trim() || null,
      location: form.location.trim() || null,
      github_url: form.github_url.trim() || null,
      twitter_url: form.twitter_url.trim() || null,
      availability: form.availability.trim() || 'Open to collab',
    };
    onSave(updated);
    setSaving(false);
  };

  const Field = ({
    label, value, onChange, multiline, placeholder,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    multiline?: boolean;
    placeholder?: string;
  }) => (
    <View style={styles.editField}>
      <Text style={styles.editFieldLabel}>{label}</Text>
      <TextInput
        style={[styles.editFieldInput, multiline && styles.editFieldInputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#A1A1AA"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.editHeader}>
            <TouchableOpacity onPress={onClose} style={styles.editCloseBtn}>
              <Feather name="x" size={20} color="#000" />
            </TouchableOpacity>
            <Text style={styles.editHeaderTitle}>Edit Profile</Text>
            <PressableScale
              style={[styles.editSaveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              activeScale={0.94}
            >
              {saving
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text style={styles.editSaveBtnText}>Save</Text>}
            </PressableScale>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.editBody}
            showsVerticalScrollIndicator={false}
          >
            <Field
              label="Full Name"
              value={form.full_name}
              onChange={(v: string) => setForm((f: EditForm) => ({ ...f, full_name: v }))}
              placeholder="Your full name"
            />
            <Field
              label="Role / Title"
              value={form.role}
              onChange={(v: string) => setForm((f: EditForm) => ({ ...f, role: v }))}
              placeholder="e.g. Full Stack Engineer"
            />
            <Field
              label="Bio"
              value={form.bio}
              onChange={(v: string) => setForm((f: EditForm) => ({ ...f, bio: v }))}
              placeholder="Tell builders about yourself..."
              multiline
            />
            <Field
              label="Location"
              value={form.location}
              onChange={(v: string) => setForm((f: EditForm) => ({ ...f, location: v }))}
              placeholder="City, Country"
            />
            <Field
              label="Availability"
              value={form.availability}
              onChange={(v: string) => setForm((f: EditForm) => ({ ...f, availability: v }))}
              placeholder="Open to collab"
            />
            <Field
              label="GitHub URL"
              value={form.github_url}
              onChange={(v: string) => setForm((f: EditForm) => ({ ...f, github_url: v }))}
              placeholder="https://github.com/..."
            />
            <Field
              label="Twitter / X URL"
              value={form.twitter_url}
              onChange={(v: string) => setForm((f: EditForm) => ({ ...f, twitter_url: v }))}
              placeholder="https://twitter.com/..."
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Profile Screen ──────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<BuilderProfile | null>(null);
  const [followStats, setFollowStats] = useState<FollowStats>({ followers: 0, following: 0 });
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: prof } = await (supabase.from('builder_profiles') as any)
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (prof) setProfile(prof as BuilderProfile);

      const [{ count: followers }, { count: following }] = await Promise.all([
        (supabase.from('connections') as any)
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id),
        (supabase.from('connections') as any)
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id),
      ]);
      setFollowStats({ followers: followers ?? 0, following: following ?? 0 });

      const { data: posts } = await (supabase.from('posts') as any)
        .select('id, content, stack_tags, post_type, created_at, post_likes(user_id), post_comments(id)')
        .eq('uid', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (posts) {
        setUserPosts(
          (posts as any[]).map((p) => ({
            id: p.id as string,
            content: p.content as string,
            stack_tags: (p.stack_tags ?? []) as string[],
            post_type: p.post_type as string,
            likes_count: Array.isArray(p.post_likes) ? p.post_likes.length : 0,
            comments_count: Array.isArray(p.post_comments) ? p.post_comments.length : 0,
            created_at: p.created_at as string,
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) loadProfile();
  }, [user?.id, loadProfile]);

  const handleSignOut = useCallback(async () => {
    setMenuVisible(false);
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }, [router]);

  const handleSaveProfile = useCallback(async (updated: Partial<BuilderProfile>) => {
    if (!user?.id) return;
    const { error } = await (supabase.from('builder_profiles') as any)
      .update(updated)
      .eq('id', user.id);
    if (!error) {
      setProfile((prev: BuilderProfile | null) => prev ? { ...prev, ...updated } : prev);
      setEditVisible(false);
    }
  }, [user?.id]);

  const displayName =
    profile?.full_name ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'Builder';
  const avatarUri =
    profile?.avatar_url ??
    (user?.user_metadata?.avatar_url as string | undefined);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Banner ──────────────────────────────────────────────────── */}
        <View style={styles.bannerWrapper}>
          <View style={styles.banner} />

          <SafeAreaView edges={['top']} style={styles.safeTopBar}>
            <View style={styles.topBar}>
              <Text style={styles.topBarTitle}>Profile</Text>
              <PressableScale style={styles.navBtn} onPress={() => setMenuVisible(true)} activeScale={0.88}>
                <Feather name="more-horizontal" size={18} color="#FFF" />
              </PressableScale>
            </View>
          </SafeAreaView>

          <View style={styles.avatarHaloWrapper}>
            <View style={styles.avatarHalo}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarImage, { backgroundColor: '#18181B', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#FFF', fontSize: 36, fontWeight: '900' }}>
                    {displayName[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <View style={styles.body}>
          <Text style={styles.displayName}>{displayName}</Text>
          {profile?.username ? <Text style={styles.username}>@{profile.username}</Text> : null}
          {profile?.role ? <Text style={styles.role}>{profile.role}</Text> : null}
          {profile?.availability ? <AvailabilityBadge status={profile.availability} /> : null}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{followStats.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{followStats.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Edit Button */}
          <PressableScale style={styles.editProfileBtn} onPress={() => setEditVisible(true)} activeScale={0.95}>
            <Feather name="edit-2" size={14} color="#000" style={{ marginRight: 6 }} />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </PressableScale>

          {/* Bio */}
          {profile?.bio ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          ) : null}

          {/* Location */}
          {profile?.location ? (
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={13} color="#71717A" />
              <Text style={styles.metaText}>{profile.location}</Text>
            </View>
          ) : null}

          {/* Experience */}
          {profile?.experience_level ? (
            <View style={styles.metaRow}>
              <Feather name="bar-chart-2" size={13} color="#71717A" />
              <Text style={styles.metaText}>{profile.experience_level} Level</Text>
            </View>
          ) : null}

          {/* Links */}
          {(profile?.github_url || profile?.twitter_url) ? (
            <View style={styles.linksRow}>
              {profile.github_url ? (
                <View style={styles.linkChip}>
                  <Feather name="github" size={13} color="#52525B" />
                  <Text style={styles.linkChipText}>GitHub</Text>
                </View>
              ) : null}
              {profile.twitter_url ? (
                <View style={styles.linkChip}>
                  <Feather name="twitter" size={13} color="#52525B" />
                  <Text style={styles.linkChipText}>Twitter</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Stack */}
          {profile?.stack && profile.stack.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tech Stack</Text>
              <View style={styles.pillRow}>
                {profile.stack.map((s: string) => (
                  <View key={s} style={styles.stackPill}>
                    <Text style={styles.stackPillText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Skills */}
          {profile?.skills && profile.skills.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skills</Text>
              <View style={styles.pillRow}>
                {profile.skills.map((s: string) => (
                  <View key={s} style={styles.skillPill}>
                    <Text style={styles.skillPillText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Looking For */}
          {profile?.looking_for && profile.looking_for.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Looking For</Text>
              <View style={styles.pillRow}>
                {profile.looking_for.map((l: string) => (
                  <View key={l} style={styles.lookingPill}>
                    <Text style={styles.lookingPillText}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Posts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Posts ({userPosts.length})</Text>
            {userPosts.length === 0 ? (
              <View style={styles.noPostsBox}>
                <Feather name="edit" size={22} color="#D4D4D8" />
                <Text style={styles.noPostsText}>No posts yet. Share your first build update!</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {userPosts.map((p: UserPost) => (
                  <View key={p.id} style={styles.postCard}>
                    <Text style={styles.postContent} numberOfLines={3}>{p.content}</Text>
                    {p.stack_tags.length > 0 && (
                      <View style={styles.tagRow}>
                        {p.stack_tags.slice(0, 3).map((t: string) => (
                          <View key={t} style={styles.tagBadge}>
                            <Text style={styles.tagText}>#{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <View style={styles.postFooter}>
                      <Text style={styles.postTime}>{timeAgo(p.created_at)}</Text>
                      <View style={styles.postStats}>
                        <Feather name="heart" size={12} color="#A1A1AA" />
                        <Text style={styles.postStatNum}>{p.likes_count}</Text>
                        <Feather name="message-circle" size={12} color="#A1A1AA" style={{ marginLeft: 10 }} />
                        <Text style={styles.postStatNum}>{p.comments_count}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Account Menu ────────────────────────────────────────────── */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Account</Text>

            <View style={styles.modalUserBox}>
              <Feather name="user" size={20} color={RED} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.modalUserName}>{displayName}</Text>
                <Text style={styles.modalUserEmail}>{user?.email ?? ''}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => { setMenuVisible(false); setEditVisible(true); }}
            >
              <Feather name="edit-2" size={18} color="#0F172A" />
              <Text style={styles.modalItemText}>Edit Profile</Text>
              <Feather name="chevron-right" size={16} color="#A1A1AA" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalItem, styles.modalItemLast]}
              onPress={handleSignOut}
            >
              <Feather name="log-out" size={18} color={RED} />
              <Text style={[styles.modalItemText, { color: RED }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Edit Profile Modal ──────────────────────────────────────── */}
      <EditProfileModal
        visible={editVisible}
        profile={profile}
        onClose={() => setEditVisible(false)}
        onSave={handleSaveProfile}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const BANNER_H = 180;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 130 },

  bannerWrapper: { height: BANNER_H + 50, position: 'relative' },
  banner: { position: 'absolute', top: 0, left: 0, right: 0, height: BANNER_H, backgroundColor: '#0F172A' },
  safeTopBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8,
  },
  topBarTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  avatarHaloWrapper: { position: 'absolute', bottom: 0, left: 20 },
  avatarHalo: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 4, borderColor: '#FFFFFF',
    backgroundColor: '#18181B', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  avatarImage: { width: 92, height: 92, borderRadius: 46 },

  body: { paddingHorizontal: 20, paddingTop: 12 },
  displayName: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5, marginBottom: 2 },
  username: { fontSize: 13, color: '#71717A', fontWeight: '600', marginBottom: 4 },
  role: { fontSize: 14, color: '#52525B', fontWeight: '600', marginBottom: 10 },

  availBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: '#F4F4F5', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 9999, marginBottom: 16,
  },
  availBadgeOpen: { backgroundColor: '#ECFDF5' },
  availDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#A1A1AA', marginRight: 6 },
  availDotOpen: { backgroundColor: '#10B981' },
  availText: { fontSize: 12, fontWeight: '700', color: '#71717A' },
  availTextOpen: { color: '#059669' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FAFAFA', borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#F4F4F5',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statCount: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: '#71717A', fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#E4E4E7' },

  editProfileBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F4F4F5', borderRadius: 12, paddingVertical: 11, marginBottom: 20,
    borderWidth: 1, borderColor: '#E4E4E7',
  },
  editProfileBtnText: { fontSize: 14, fontWeight: '700', color: '#000000' },

  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2, marginBottom: 10 },
  bioText: { fontSize: 14, color: '#52525B', lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  metaText: { fontSize: 13, color: '#71717A', fontWeight: '500' },

  linksRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  linkChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F4F4F5', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 9999, borderWidth: 1, borderColor: '#E4E4E7',
  },
  linkChipText: { fontSize: 12, fontWeight: '700', color: '#52525B' },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stackPill: { backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  stackPillText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  skillPill: { backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  skillPillText: { color: '#0284C7', fontSize: 12, fontWeight: '700' },
  lookingPill: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  lookingPillText: { color: '#EA580C', fontSize: 12, fontWeight: '700' },

  postCard: { backgroundColor: '#FAFAFA', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F4F4F5' },
  postContent: { fontSize: 13, color: '#27272A', lineHeight: 20, marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tagBadge: { backgroundColor: '#F4F4F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '600', color: '#52525B' },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postTime: { fontSize: 11, color: '#A1A1AA', fontWeight: '500' },
  postStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatNum: { fontSize: 12, color: '#A1A1AA', fontWeight: '600' },

  noPostsBox: {
    alignItems: 'center', paddingVertical: 30,
    backgroundColor: '#FAFAFA', borderRadius: 14,
    borderWidth: 1, borderColor: '#F4F4F5',
  },
  noPostsText: { fontSize: 13, color: '#A1A1AA', fontWeight: '500', marginTop: 10, textAlign: 'center', paddingHorizontal: 20 },

  // Account modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 14 },
  modalUserBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, marginBottom: 16 },
  modalUserName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  modalUserEmail: { fontSize: 12, color: '#64748B', marginTop: 1 },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalItemLast: { borderBottomWidth: 0, marginTop: 8 },
  modalItemText: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginLeft: 12, flex: 1 },

  // Edit modal
  editHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F4F4F5',
  },
  editCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center',
  },
  editHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#000' },
  editSaveBtn: { backgroundColor: RED, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, minWidth: 60, alignItems: 'center' },
  editSaveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  editBody: { paddingHorizontal: 20, paddingVertical: 20, gap: 16 },
  editField: {},
  editFieldLabel: { fontSize: 12, fontWeight: '700', color: '#71717A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  editFieldInput: {
    backgroundColor: '#F4F4F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#000', borderWidth: 1, borderColor: '#E4E4E7',
  },
  editFieldInputMulti: { minHeight: 90, textAlignVertical: 'top' },
});
