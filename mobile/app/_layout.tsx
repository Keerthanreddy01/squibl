import React, { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { isEmailVerified, supabase } from '../lib/supabase';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [session, setSession] = useState<Session | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const isMountedRef = useRef(true);

  // ── Auth Observer & Session Restoration ──────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    // Restore existing session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMountedRef.current) return;
      setSession(initialSession);
      setAuthInitialized(true);
    });

    // Listen for auth state changes across the entire app
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!isMountedRef.current) return;
        setSession(currentSession);
        setAuthInitialized(true);
      }
    );

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── Central Route Guard ──────────────────────────────────────────────────
  useEffect(() => {
    if (!authInitialized) return;

    const firstSegment = segments[0];
    // Allow the splash screen (index) to manage its own initial animation & transition
    if (!firstSegment || firstSegment === 'index') return;

    const inAuthGroup = firstSegment === '(auth)';
    const inTabsGroup = firstSegment === '(tabs)';
    const inOnboarding = firstSegment === 'onboarding';

    if (!session) {
      // Unauthenticated user trying to access protected areas
      if (inTabsGroup || inOnboarding) {
        router.replace('/(auth)/login');
      }
    } else {
      // Authenticated user: prevent staying in auth group
      if (inAuthGroup) {
        // A Supabase session can exist before email confirmation is complete.
        // Keep that user in the auth flow until verifyOtp confirms the email.
        if (!isEmailVerified(session.user)) return;

        // Query onboarding status to navigate cleanly
        (supabase.from('builder_profiles') as any)
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: profile }: any) => {
            if (!isMountedRef.current) return;
            if (profile?.onboarding_completed) {
              router.replace('/(tabs)/feed');
            } else {
              router.replace('/onboarding');
            }
          })
          .catch(() => {
            if (!isMountedRef.current) return;
            router.replace('/(tabs)/feed');
          });
      }
    }
  }, [session, authInitialized, segments, router]);

  return (
    <SafeAreaProvider style={styles.rootContainer}>
      <StatusBar style="dark" />
      {Platform.OS === 'android' && (
        <RNStatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      )}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
          animation: 'fade',
          animationDuration: 220,
        }}
      >
        <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: '#FFFFFF' } }} />
        <Stack.Screen name="(auth)" options={{ contentStyle: { backgroundColor: '#FFFFFF' } }} />
        <Stack.Screen name="onboarding" options={{ contentStyle: { backgroundColor: '#FFFFFF' } }} />
        <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: '#FFFFFF' } }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
