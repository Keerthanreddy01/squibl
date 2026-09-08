import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { PressableScale } from '../../components/PressableScale';

const RED = '#E50914';

export default function ProfileScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial session from AsyncStorage
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Builder Profile</Text>
          <Text style={styles.subtitle}>Account credentials & workspace status</Text>
        </View>

        {user ? (
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>AUTHENTICATED BUILDER</Text>
              </View>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.label}>Email Address</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.label}>User UUID</Text>
              <Text style={styles.valueSmall}>{user.id}</Text>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.label}>Session Persistence</Text>
              <Text style={styles.value}>AsyncStorage (Secure Store)</Text>
            </View>

            <PressableScale
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeScale={0.96}
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </PressableScale>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <View style={styles.badgeGuest}>
                <Text style={styles.badgeGuestText}>GUEST SESSION</Text>
              </View>
            </View>
            <Text style={styles.guestDesc}>No active user session found.</Text>
            <PressableScale
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/login')}
              activeScale={0.96}
            >
              <Text style={styles.signInButtonText}>Sign In / Sign Up</Text>
            </PressableScale>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 22,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#71717A',
    fontWeight: '500',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  badgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeGuest: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  badgeGuestText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#18181B',
    fontWeight: '700',
  },
  valueSmall: {
    fontSize: 13,
    color: '#52525B',
    fontFamily: 'monospace',
  },
  guestDesc: {
    fontSize: 14,
    color: '#71717A',
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: RED,
    borderRadius: 9999,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    shadowColor: RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 6,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  signOutButton: {
    backgroundColor: 'rgba(244, 244, 245, 0.9)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 9999,
    paddingVertical: 15,
    marginTop: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  signOutButtonText: {
    color: '#18181B',
    fontSize: 15,
    fontWeight: '700',
  },
});
