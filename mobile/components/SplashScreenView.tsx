import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface SplashScreenViewProps {
  onFinish: (hasSession: boolean) => void;
}

const { width } = Dimensions.get('window');
const RED = '#E50914';

export function SplashScreenView({ onFinish }: SplashScreenViewProps) {
  // Inner content entrance animation
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const contentScaleAnim = useRef(new Animated.Value(0.92)).current;

  // Screen exit fade animation (starts fully opaque at 1)
  const screenFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance: animate logo and typography in
    Animated.parallel([
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(contentScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Check auth session in parallel with display delay
    let isMounted = true;
    const minDisplayPromise = new Promise((resolve) => setTimeout(resolve, 2200));
    const authPromise = supabase.auth.getSession();

    Promise.all([minDisplayPromise, authPromise])
      .then(([_, { data }]) => {
        if (!isMounted) return;
        const hasSession = !!data?.session;

        // Smooth exit fade
        Animated.timing(screenFadeAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => {
          onFinish(hasSession);
        });
      })
      .catch(() => {
        if (!isMounted) return;
        Animated.timing(screenFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onFinish(false);
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: screenFadeAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.centerContent,
          {
            opacity: contentFadeAnim,
            transform: [{ scale: contentScaleAnim }],
          },
        ]}
      >
        {/* Centered Logo in Clean Rounded Card */}
        <View style={styles.logoCard}>
          <Image
            source={require('../assets/squibl-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* App Title in Bold Oversized Display Typography */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>SQUIBL</Text>
          <View style={styles.redDot} />
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Where developers find teammates, build projects, and grow together
        </Text>
      </Animated.View>

      {/* Subtle Bottom Brand Bar */}
      <View style={styles.footer}>
        <View style={styles.pillIndicator}>
          <View style={styles.pillBar} />
        </View>
        <Text style={styles.footerText}>BY BUILDERS • FOR BUILDERS</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 28,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoCard: {
    width: 124,
    height: 124,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 26,
    borderWidth: 1.5,
    borderColor: '#F4F4F5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  logo: {
    width: 106,
    height: 106,
    borderRadius: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -1.5,
  },
  redDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: RED,
    marginLeft: 5,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: '#52525B',
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: width * 0.82,
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    width: '100%',
  },
  pillIndicator: {
    width: 48,
    height: 4,
    backgroundColor: '#F4F4F5',
    borderRadius: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  pillBar: {
    width: 24,
    height: '100%',
    backgroundColor: RED,
    borderRadius: 2,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 2,
  },
});
