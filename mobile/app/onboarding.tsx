import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { PressableScale } from '../components/PressableScale';

const RED = '#E50914';

const ROLE_OPTIONS = [
  'Full Stack Developer',
  'Frontend Engineer',
  'Backend Engineer',
  'Mobile Developer',
  'AI / ML Engineer',
  'UI/UX Designer',
  'Founder / Product',
];

const AVAILABILITY_OPTIONS = [
  'Open to collab',
  'Building solo',
  'Looking for team',
  'Advising',
];

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80',
];

export default function OnboardingScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'ArchivoBlack-Regular': require('../assets/fonts/ArchivoBlack-Regular.ttf'),
    'Geist-UltraBlack': require('../assets/fonts/Geist-UltraBlack.ttf'),
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState(AVAILABILITY_OPTIONS[0]);
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0]);

  // Validation & Availability States
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Load Current User & Existing Profile ───────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/(auth)/login');
        return;
      }

      if (!isMounted) return;
      const user = session.user;
      setUserId(user.id);
      setUserEmail(user.email ?? null);

      // Pre-fill from existing record if available
      const { data: profile } = await (supabase.from('builder_profiles') as any)
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (profile) {
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.username) setUsername(profile.username);
        if (profile.role) setRole(profile.role);
        if (profile.bio) setBio(profile.bio);
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        if (profile.availability) setAvailability(profile.availability);
      } else {
        // Fallback default suggestions
        const metaName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const metaAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (metaName) setFullName(metaName);
        if (metaAvatar) setAvatarUrl(metaAvatar);

        const emailPrefix = user.email ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : '';
        if (emailPrefix) setUsername(emailPrefix);
      }
    }

    loadUser();
    return () => { isMounted = false; };
  }, [router]);

  // ── Debounced Username Check ───────────────────────────────────────────────
  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (!clean) {
      setIsUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      setIsUsernameAvailable(false);
      setUsernameError('3-20 characters: lowercase letters, numbers, underscores only');
      return;
    }

    setUsernameError(null);
    setIsCheckingUsername(true);

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await (supabase.from('builder_profiles') as any)
          .select('id')
          .eq('username', clean);

        if (error) throw error;

        // Available if no rows or the only row belongs to the current user
        const taken = Array.isArray(data) && data.some((r: any) => r.id !== userId);
        setIsUsernameAvailable(!taken);
        if (taken) {
          setUsernameError('Handle already claimed by another builder');
        } else {
          setUsernameError(null);
        }
      } catch {
        setIsUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username, userId]);

  // ── Submit Profile ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (saving) return;

    const trimmedName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (!trimmedName) {
      setGeneralError('Please enter your full name.');
      return;
    }

    if (!cleanUsername || isUsernameAvailable === false) {
      setGeneralError('Please choose an available builder handle.');
      return;
    }

    if (!userId) {
      setGeneralError('Session expired. Please log in again.');
      router.replace('/(auth)/login');
      return;
    }

    setSaving(true);
    setGeneralError(null);

    try {
      const payload = {
        id: userId,
        email: userEmail,
        full_name: trimmedName,
        username: cleanUsername,
        avatar_url: avatarUrl,
        bio: bio.trim(),
        role: role.trim(),
        availability,
        skills: [],
        stack: [],
        experience_level: 'Mid',
        looking_for: ['teammates', 'projects'],
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase.from('builder_profiles') as any)
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        throw error;
      }

      // Success -> Enter Squibl Feed
      router.replace('/(tabs)/feed');
    } catch (err: any) {
      setGeneralError(err?.message ?? 'Failed to save profile. Please try again.');
      setSaving(false);
    }
  }, [saving, fullName, username, isUsernameAvailable, userId, userEmail, avatarUrl, bio, role, availability, router]);

  const fontTitleStyle = fontsLoaded ? styles.titleFontArchivo : styles.titleDisplay;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image
                source={require('../assets/squibl-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <Text style={styles.brandTag}>BUILDER ONBOARDING</Text>
            </View>
            <Text style={[styles.title, fontTitleStyle]}>CREATE YOUR{'\n'}BUILDER IDENTITY</Text>
            <Text style={styles.subtitle}>
              Connect with high-signal developers, collaborate on projects, and build in public.
            </Text>
          </View>

          {/* General Error Banner */}
          {generalError && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={15} color="#DC2626" />
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          )}

          {/* Avatar Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PROFILE PICTURE</Text>
            <View style={styles.avatarRow}>
              <Image source={{ uri: avatarUrl }} style={styles.mainAvatar} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsContainer}
              >
                {AVATAR_PRESETS.map((preset, idx) => {
                  const isSelected = preset === avatarUrl;
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setAvatarUrl(preset)}
                      activeOpacity={0.8}
                      style={[styles.presetWrap, isSelected && styles.presetWrapSelected]}
                    >
                      <Image source={{ uri: preset }} style={styles.presetImage} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Full Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FULL NAME *</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Alex Rivera"
                placeholderTextColor="#A1A1AA"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  setGeneralError(null);
                }}
                autoCapitalize="words"
                editable={!saving}
              />
            </View>
          </View>

          {/* Username */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.sectionLabel}>BUILDER HANDLE *</Text>
              {isCheckingUsername && (
                <ActivityIndicator size="small" color="#71717A" />
              )}
              {!isCheckingUsername && isUsernameAvailable === true && (
                <View style={styles.availableBadge}>
                  <Feather name="check" size={12} color="#16A34A" />
                  <Text style={styles.availableText}>Available</Text>
                </View>
              )}
            </View>
            <View style={[styles.inputCard, usernameError && styles.inputCardError]}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={styles.textInputWithPrefix}
                placeholder="handle"
                placeholderTextColor="#A1A1AA"
                value={username}
                onChangeText={(text) => {
                  setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                  setGeneralError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />
            </View>
            {usernameError && (
              <Text style={styles.fieldErrorText}>{usernameError}</Text>
            )}
          </View>

          {/* Role */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PRIMARY ROLE / DISCIPLINE</Text>
            <View style={styles.chipGrid}>
              {ROLE_OPTIONS.map((r) => {
                const isSelected = r === role;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AVAILABILITY</Text>
            <View style={styles.chipGrid}>
              {AVAILABILITY_OPTIONS.map((opt) => {
                const isSelected = opt === availability;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setAvailability(opt)}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SHORT BIO</Text>
            <View style={[styles.inputCard, styles.bioCard]}>
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                placeholder="What are you hacking on? Stack, goals, or dream teammates..."
                placeholderTextColor="#A1A1AA"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                maxLength={200}
                editable={!saving}
              />
            </View>
            <Text style={styles.bioCount}>{bio.length}/200</Text>
          </View>

          {/* Submit Action */}
          <View style={styles.submitSection}>
            <PressableScale
              onPress={handleSubmit}
              disabled={saving || isCheckingUsername || isUsernameAvailable === false}
              style={[
                styles.submitBtn,
                (saving || isCheckingUsername || isUsernameAvailable === false) && styles.submitBtnDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.submitContent}>
                  <Text style={styles.submitText}>Enter Builder Network</Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" />
                </View>
              )}
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  brandLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  brandTag: {
    fontSize: 11,
    fontWeight: '800',
    color: RED,
    letterSpacing: 1.5,
  },
  titleFontArchivo: {
    fontFamily: 'ArchivoBlack-Regular',
  },
  titleDisplay: {
    fontWeight: '900',
  },
  title: {
    fontSize: 28,
    color: '#09090B',
    lineHeight: 33,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#71717A',
    lineHeight: 20,
    fontWeight: '400',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },

  section: {
    marginBottom: 22,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#52525B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  // Avatar Selection
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mainAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: RED,
  },
  presetsContainer: {
    alignItems: 'center',
    gap: 10,
    paddingRight: 10,
  },
  presetWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  presetWrapSelected: {
    borderColor: RED,
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },

  // Input Cards
  inputCard: {
    backgroundColor: '#F4F4F5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputCardError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#09090B',
    padding: 0,
  },
  atSymbol: {
    fontSize: 15,
    fontWeight: '800',
    color: '#71717A',
    marginRight: 2,
  },
  textInputWithPrefix: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#09090B',
    padding: 0,
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    marginTop: 6,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availableText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '700',
  },

  // Chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: '#09090B',
    borderColor: '#09090B',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525B',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },

  // Bio
  bioCard: {
    alignItems: 'flex-start',
    minHeight: 88,
    paddingVertical: 12,
  },
  bioInput: {
    textAlignVertical: 'top',
    height: '100%',
  },
  bioCount: {
    fontSize: 11,
    color: '#A1A1AA',
    textAlign: 'right',
    marginTop: 4,
  },

  // Submit
  submitSection: {
    marginTop: 10,
  },
  submitBtn: {
    backgroundColor: RED,
    borderRadius: 20,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
