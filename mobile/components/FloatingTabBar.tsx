import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Text,
  Platform,
  LayoutChangeEvent,
  Dimensions,
  PanResponder,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tabs } from 'expo-router';

export type FloatingTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

interface TabConfig {
  name: string;
  label: string;
  iconName: keyof typeof Feather.glyphMap;
  badge?: number | string;
}

const BASE_TAB_CONFIGS: Omit<TabConfig, 'badge'>[] = [
  { name: 'feed', label: 'Feed', iconName: 'layers' },
  { name: 'explore', label: 'Explore', iconName: 'compass' },
  { name: 'messages', label: 'Messages', iconName: 'message-square' },
  { name: 'profile', label: 'Profile', iconName: 'user' },
];

const APPLE_SPRING_CONFIG = {
  damping: 24,
  stiffness: 260,
  mass: 0.6,
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_MAX_WIDTH = Math.min(372, SCREEN_WIDTH - 36);
const BAR_HEIGHT = 64;
const PILL_INSET = 5;
const ACTIVE_PILL_HEIGHT = BAR_HEIGHT - PILL_INSET * 2;
const HORIZONTAL_PADDING = 6;
const INITIAL_TAB_WIDTH = Math.max(0, (BAR_MAX_WIDTH - HORIZONTAL_PADDING * 2) / BASE_TAB_CONFIGS.length);

let cachedIndicatorX = HORIZONTAL_PADDING;
let cachedIndicatorWidth = INITIAL_TAB_WIDTH;
let hasPositionCache = false;

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const [tabBarWidth, setTabBarWidth] = useState(BAR_MAX_WIDTH);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const activeIndex = state.index;
  const numTabs = state.routes.length;
  const horizontalPadding = HORIZONTAL_PADDING;
  const availableWidth = Math.max(0, tabBarWidth - horizontalPadding * 2);
  const tabWidth = numTabs > 0 ? availableWidth / numTabs : INITIAL_TAB_WIDTH;

  const barPageXRef = useRef(0);
  const barLayoutRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: BAR_MAX_WIDTH,
    height: BAR_HEIGHT,
  });

  // Track layout measurements for adaptive tab sizing
  const tabLayouts = useRef<Record<number, { x: number; width: number }>>({});

  // Ensure initial position is populated from frame 0
  if (!hasPositionCache) {
    cachedIndicatorX = horizontalPadding + activeIndex * tabWidth;
    cachedIndicatorWidth = tabWidth;
    hasPositionCache = true;
  }

  const translateX = useSharedValue(cachedIndicatorX);
  const indicatorWidth = useSharedValue(cachedIndicatorWidth);
  const stretchX = useSharedValue(1);
  const stretchY = useSharedValue(1);
  const isDraggingShared = useSharedValue(false);

  // References for gesture tracking
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(cachedIndicatorX);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const minX = horizontalPadding;
  const maxX = Math.max(minX, tabBarWidth - horizontalPadding - tabWidth);

  // Dynamically compose tab configs with live badge counts
  const TAB_CONFIGS: TabConfig[] = BASE_TAB_CONFIGS.map((t) => ({
    ...t,
    badge: t.name === 'messages' && unreadMessages > 0 ? unreadMessages : undefined,
  }));

  // Fetch real unread message count from Supabase
  useEffect(() => {
    let channel: any = null;
    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const { supabase: sb } = await import('../lib/supabase');
        const { data: { session } } = await sb.auth.getSession();
        const uid = session?.user?.id;
        if (!uid || cancelled) return;

        const { data } = await (sb.from('conversation_participants') as any)
          .select('unread_count')
          .eq('user_id', uid);

        if (!cancelled) {
          const total = (data ?? []).reduce((sum: number, r: any) => sum + (r.unread_count ?? 0), 0);
          setUnreadMessages(total);
        }

        channel = sb
          .channel('tabbar-unread-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${uid}` },
            async () => {
              const { data: updated } = await (sb.from('conversation_participants') as any)
                .select('unread_count')
                .eq('user_id', uid);
              const newTotal = (updated ?? []).reduce((sum: number, r: any) => sum + (r.unread_count ?? 0), 0);
              if (!cancelled) setUnreadMessages(newTotal);
            }
          )
          .subscribe();
      } catch {
        // Fallback gracefully
      }
    };

    fetchUnread();
    return () => {
      cancelled = true;
      channel?.unsubscribe();
    };
  }, []);

  // Smooth Apple spring movement to active tab
  const animateToTab = useCallback(
    (targetIndex: number) => {
      const layout = tabLayouts.current[targetIndex];
      const targetWidth = layout ? layout.width : tabWidth;
      const targetX = layout ? layout.x : horizontalPadding + targetIndex * tabWidth;

      cachedIndicatorX = targetX;
      cachedIndicatorWidth = targetWidth;

      // Tactile liquid stretch morph
      stretchX.value = withSequence(
        withTiming(1.12, {
          duration: 160,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        }),
        withSpring(1.0, APPLE_SPRING_CONFIG)
      );

      stretchY.value = withSequence(
        withTiming(0.94, {
          duration: 160,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        }),
        withSpring(1.0, APPLE_SPRING_CONFIG)
      );

      translateX.value = withSpring(targetX, APPLE_SPRING_CONFIG);
      indicatorWidth.value = withSpring(targetWidth, APPLE_SPRING_CONFIG);
    },
    [tabWidth, horizontalPadding, translateX, indicatorWidth, stretchX, stretchY]
  );

  // Sync indicator when route changes externally
  useEffect(() => {
    if (!isDraggingRef.current) {
      animateToTab(activeIndex);
    }
  }, [activeIndex, animateToTab]);

  // PanResponder for universal drag & tap across the floating bar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 6,
      onPanResponderGrant: (e) => {
        isDraggingRef.current = false;
        dragStartXRef.current = translateX.value;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isDraggingRef.current && Math.abs(gestureState.dx) > 6) {
          isDraggingRef.current = true;
          isDraggingShared.value = true;
          stretchX.value = withSpring(1.10, { damping: 18, stiffness: 240 });
          stretchY.value = withSpring(0.95, { damping: 18, stiffness: 240 });
        }

        if (isDraggingRef.current) {
          const rawX = dragStartXRef.current + gestureState.dx;
          const clampedX = Math.max(minX, Math.min(maxX, rawX));
          translateX.value = clampedX;
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        const wasDragging = isDraggingRef.current;
        isDraggingRef.current = false;
        isDraggingShared.value = false;

        stretchX.value = withSpring(1, APPLE_SPRING_CONFIG);
        stretchY.value = withSpring(1, APPLE_SPRING_CONFIG);

        if (!wasDragging || Math.abs(gestureState.dx) <= 6) {
          // Instant Tap gesture: identify touched tab slot
          const touchX = e.nativeEvent.locationX;
          const relativeX = touchX - horizontalPadding;
          const tappedIndex = Math.max(
            0,
            Math.min(numTabs - 1, Math.floor(relativeX / tabWidth))
          );

          animateToTab(tappedIndex);
          const targetRoute = state.routes[tappedIndex];
          if (targetRoute) {
            const event = navigation.emit({
              type: 'tabPress',
              target: targetRoute.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              navigation.navigate(targetRoute.name);
            }
          }
          return;
        }

        // Drag/Swipe Gesture: calculate destination with velocity momentum
        const projectedX = translateX.value + gestureState.vx * 35;
        const relativeX = projectedX - horizontalPadding;
        const rawIndex = tabWidth > 0 ? Math.round(relativeX / tabWidth) : activeIndexRef.current;
        const targetIndex = Math.max(0, Math.min(numTabs - 1, rawIndex));

        const snapX = horizontalPadding + targetIndex * tabWidth;
        cachedIndicatorX = snapX;
        cachedIndicatorWidth = tabWidth;
        translateX.value = withSpring(snapX, APPLE_SPRING_CONFIG);

        if (targetIndex !== activeIndexRef.current) {
          const targetRoute = state.routes[targetIndex];
          if (targetRoute) {
            const event = navigation.emit({
              type: 'tabPress',
              target: targetRoute.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              navigation.navigate(targetRoute.name);
            }
          }
        }
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        isDraggingShared.value = false;
        stretchX.value = withSpring(1, APPLE_SPRING_CONFIG);
        stretchY.value = withSpring(1, APPLE_SPRING_CONFIG);
        const snapX = horizontalPadding + activeIndexRef.current * tabWidth;
        translateX.value = withSpring(snapX, APPLE_SPRING_CONFIG);
      },
    })
  ).current;

  // Reanimated style for the sliding black capsule
  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scaleX: stretchX.value },
        { scaleY: stretchY.value },
      ],
      width: indicatorWidth.value,
    };
  });

  // Reanimated style for the inverted tab row inside the black capsule
  const invertedContentAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -translateX.value }],
      width: tabBarWidth,
    };
  });

  const handleBarLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0 && Math.abs(width - tabBarWidth) > 1) {
      setTabBarWidth(width);
      const computedTabWidth = (width - horizontalPadding * 2) / numTabs;
      const targetX = horizontalPadding + activeIndex * computedTabWidth;
      cachedIndicatorX = targetX;
      cachedIndicatorWidth = computedTabWidth;
      if (!isDraggingRef.current) {
        translateX.value = withSpring(targetX, APPLE_SPRING_CONFIG);
        indicatorWidth.value = withSpring(computedTabWidth, APPLE_SPRING_CONFIG);
      }
    }
  };

  const handleTabLayout = (index: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[index] = { x, width };

    if (index === activeIndex && !isDraggingRef.current) {
      cachedIndicatorX = x;
      cachedIndicatorWidth = width;
      translateX.value = withSpring(x, APPLE_SPRING_CONFIG);
      indicatorWidth.value = withSpring(width, APPLE_SPRING_CONFIG);
    }
  };

  // Dynamic bottom elevation respecting home indicators
  const dynamicBottom = Platform.OS === 'ios'
    ? Math.max(insets.bottom, 16) + 8
    : Math.max(insets.bottom, 12) + 8;

  return (
    <View
      style={[styles.floatingContainer, { bottom: dynamicBottom }]}
      pointerEvents="box-none"
    >
      {/* Elevated Glassmorphic Capsule */}
      <View
        style={styles.pillWrapper}
        onLayout={handleBarLayout}
        {...panResponder.panHandlers}
      >
        {/* Real Native Blur Layer */}
        <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />

        {/* Milky-white Frosted Glass Wash */}
        <View style={styles.frostedOverlay} />

        {/* Specular Top Rim Highlight */}
        <View style={styles.specularTopRim} />

        {/* ── Layer 1: Inactive Base Tab Row (High Contrast Slate) ── */}
        <View style={styles.tabRowLayer} pointerEvents="none">
          {state.routes.map((route, index) => {
            const config = TAB_CONFIGS.find((t) => t.name === route.name) || {
              name: route.name,
              label: route.name,
              iconName: 'circle' as keyof typeof Feather.glyphMap,
            };

            return (
              <View
                key={route.key}
                style={styles.tabItemCell}
                onLayout={(e) => handleTabLayout(index, e)}
              >
                <View style={styles.iconContainer}>
                  <Feather
                    name={config.iconName}
                    size={21}
                    color="#71717A"
                  />
                  {config.badge !== undefined && (
                    <View style={styles.badgeInactive}>
                      <Text style={styles.badgeText}>{config.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.tabLabelInactive} numberOfLines={1}>
                  {config.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── Layer 2: Sliding Active Capsule (Solid Builder Black + Inverted Mask) ── */}
        <Animated.View
          style={[styles.slidingIndicator, indicatorAnimatedStyle]}
          pointerEvents="none"
        >
          {/* Active Black Capsule Background */}
          <View style={styles.activeBlackPill}>
            {/* Subtle top inner reflection */}
            <View style={styles.activePillReflection} />

            {/* Inverted White Tab Content (Clipped by the Pill) */}
            <Animated.View style={[styles.invertedRowContainer, invertedContentAnimatedStyle]}>
              <View style={styles.tabRowLayer}>
                {state.routes.map((route) => {
                  const config = TAB_CONFIGS.find((t) => t.name === route.name) || {
                    name: route.name,
                    label: route.name,
                    iconName: 'circle' as keyof typeof Feather.glyphMap,
                  };

                  return (
                    <View key={route.key} style={styles.tabItemCell}>
                      <View style={styles.iconContainer}>
                        <Feather
                          name={config.iconName}
                          size={21}
                          color="#FFFFFF"
                        />
                        {config.badge !== undefined && (
                          <View style={styles.badgeActive}>
                            <Text style={styles.badgeText}>{config.badge}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.activeLabelRow}>
                        <Text style={styles.tabLabelActive} numberOfLines={1}>
                          {config.label}
                        </Text>
                        <View style={styles.activeDot} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
    zIndex: 999,
  },

  // Outer Floating Capsule
  pillWrapper: {
    width: '100%',
    maxWidth: BAR_MAX_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    // Apple-style crisp hairline outer boundary
    borderWidth: 1.2,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    // Deep multi-layered ambient shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },

  // Frosted Glass Milky Overlay
  frostedOverlay: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
  },

  // Top Specular Reflection
  specularTopRim: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },

  // Row Layer for Tabs
  tabRowLayer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    paddingHorizontal: HORIZONTAL_PADDING,
  },

  tabItemCell: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  tabLabelInactive: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.2,
  },

  // Sliding Indicator Wrapper
  slidingIndicator: {
    position: 'absolute',
    top: PILL_INSET,
    bottom: PILL_INSET,
    left: 0,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Solid Builder Black Active Pill
  activeBlackPill: {
    width: '100%',
    height: ACTIVE_PILL_HEIGHT,
    backgroundColor: '#18181B',
    borderRadius: 27,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },

  // Subtle top reflection on the black capsule
  activePillReflection: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Container to synchronize inverted white content with the bar width
  invertedRowContainer: {
    height: '100%',
    justifyContent: 'center',
  },

  activeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  tabLabelActive: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Squibl Red Indicator Dot on Active Tab
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E50914',
  },

  // Badges
  badgeInactive: {
    position: 'absolute',
    top: -4,
    right: -9,
    backgroundColor: '#E50914',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
  },

  badgeActive: {
    position: 'absolute',
    top: -4,
    right: -9,
    backgroundColor: '#E50914',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#18181B',
    elevation: 4,
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
});
