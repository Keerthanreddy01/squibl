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
  type SharedValue,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import type { Tabs } from 'expo-router';

export type FloatingTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

interface TabConfig {
  name: string;
  label: string;
  iconName: keyof typeof Feather.glyphMap;
}

const TAB_CONFIGS: TabConfig[] = [
  { name: 'feed', label: 'Feed', iconName: 'layers' },
  { name: 'explore', label: 'Explore', iconName: 'compass' },
  { name: 'messages', label: 'Messages', iconName: 'message-square' },
  { name: 'profile', label: 'Profile', iconName: 'user' },
];

// Apple segmented control spring physics: fluid, natural, responsive settling
const APPLE_SPRING_CONFIG = {
  damping: 24,
  stiffness: 220,
  mass: 0.7,
};

// Module-level cache guarantees the single glass bubble never resets or blinks during tab changes
const INITIAL_BAR_WIDTH = Math.min(380, Dimensions.get('window').width - 40);
const INITIAL_TAB_WIDTH = Math.max(0, (INITIAL_BAR_WIDTH - 12) / TAB_CONFIGS.length);
let cachedIndicatorX = 6;
let cachedIndicatorWidth = INITIAL_TAB_WIDTH;
let hasPositionCache = false;

// Sub-component for individual tab items: applies subtle optical lens magnification & refraction
// dynamically based on proximity to the moving glass lens (zero DOM duplication, zero ghosting)
interface AnimatedTabItemProps {
  route: { key: string; name: string };
  index: number;
  config: TabConfig;
  translateX: SharedValue<number>;
  indicatorWidth: SharedValue<number>;
  isDraggingShared: SharedValue<boolean>;
  tabWidth: number;
  horizontalPadding: number;
  isFocused: boolean;
  isHovered: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onHoverIn: () => void;
  onHoverOut: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  accessibilityLabel?: string;
  testID?: string;
}

function AnimatedTabItem({
  route,
  index,
  config,
  translateX,
  indicatorWidth,
  isDraggingShared,
  tabWidth,
  horizontalPadding,
  isFocused,
  isHovered,
  onPress,
  onLongPress,
  onHoverIn,
  onHoverOut,
  onLayout,
  accessibilityLabel,
  testID,
}: AnimatedTabItemProps) {
  // Continuous optical lens distortion & magnification curve (1.0x to 1.05x resting, 1.075x dragging)
  const animatedLensStyle = useAnimatedStyle(() => {
    if (tabWidth <= 0) return { transform: [{ scale: 1 }] };

    const tabCenterX = horizontalPadding + (index + 0.5) * tabWidth;
    const bubbleCenterX = translateX.value + indicatorWidth.value / 2;
    const distance = Math.abs(bubbleCenterX - tabCenterX);
    const influenceRadius = tabWidth * 0.85;

    // Organic cubic lens falloff curve
    const t = Math.max(0, 1 - distance / influenceRadius);
    const curve = t * t * (3 - 2 * t);

    // Subtle optical magnification: 1.03-1.06x as requested
    const dragBoost = isDraggingShared.value ? 0.025 : 0;
    const scale = 1.0 + curve * (0.05 + dragBoost);

    // Microscopic lateral optical displacement toward the lens curvature center (max 1.5px)
    const deltaX = bubbleCenterX - tabCenterX;
    const displacementX = Math.sign(deltaX) * Math.min(Math.abs(deltaX) * 0.03, 1.5) * curve;

    return {
      transform: [
        { translateX: displacementX },
        { scale: scale },
      ],
    };
  });

  // Smooth optical illumination curve: items under the glass lens brighten to pure white
  const animatedOpacityStyle = useAnimatedStyle(() => {
    if (tabWidth <= 0) return { opacity: isFocused ? 1 : 0.45 };

    const tabCenterX = horizontalPadding + (index + 0.5) * tabWidth;
    const bubbleCenterX = translateX.value + indicatorWidth.value / 2;
    const distance = Math.abs(bubbleCenterX - tabCenterX);
    const influenceRadius = tabWidth * 0.85;

    const t = Math.max(0, 1 - distance / influenceRadius);
    const curve = t * t * (3 - 2 * t);
    const opacity = isHovered ? 0.75 : 0.45 + curve * 0.55;

    return {
      opacity: opacity,
    };
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onLayout={onLayout}
      style={[
        styles.tabButton,
        isHovered && styles.tabButtonHovered,
      ]}
      // Inactive tabs receive clicks directly; active tab passes through to the draggable bubble
      pointerEvents={isFocused ? 'none' : 'auto'}
    >
      <Animated.View style={[styles.tabContentContainer, animatedLensStyle]}>
        <Animated.View style={[styles.iconWrapper, animatedOpacityStyle]}>
          <Feather
            name={config.iconName}
            size={20}
            color="#FFFFFF"
          />
        </Animated.View>
        <Animated.Text
          style={[
            styles.tabLabel,
            animatedOpacityStyle,
            isFocused && styles.tabLabelActive,
          ]}
          numberOfLines={1}
        >
          {config.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: FloatingTabBarProps) {
  const [tabBarWidth, setTabBarWidth] = useState(INITIAL_BAR_WIDTH);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const activeIndex = state.index;
  const numTabs = state.routes.length;

  const horizontalPadding = 6;
  const availableWidth = Math.max(0, tabBarWidth - horizontalPadding * 2);
  const tabWidth = numTabs > 0 ? availableWidth / numTabs : INITIAL_TAB_WIDTH;

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
  const scale = useSharedValue(1);
  const isDraggingShared = useSharedValue(false);

  // References for gesture tracking
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(cachedIndicatorX);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const minX = horizontalPadding;
  const maxX = Math.max(minX, tabBarWidth - horizontalPadding - tabWidth);

  // Animate the single persistent glass bubble to a target tab
  const animateToTab = useCallback(
    (targetIndex: number) => {
      const layout = tabLayouts.current[targetIndex];
      const targetWidth = layout ? layout.width : tabWidth;
      const targetX = layout ? layout.x : horizontalPadding + targetIndex * tabWidth;

      cachedIndicatorX = targetX;
      cachedIndicatorWidth = targetWidth;

      translateX.value = withSpring(targetX, APPLE_SPRING_CONFIG);
      indicatorWidth.value = withSpring(targetWidth, APPLE_SPRING_CONFIG);
    },
    [tabWidth, horizontalPadding, translateX, indicatorWidth]
  );

  // Keep bubble synchronized when route changes externally (unless user is actively dragging)
  useEffect(() => {
    if (!isDraggingRef.current) {
      animateToTab(activeIndex);
    }
  }, [activeIndex, animateToTab]);

  // PanResponder for universal drag on iOS, Android, and Desktop mouse
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 3,
      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        isDraggingShared.value = true;
        setIsDragging(true);
        dragStartXRef.current = translateX.value;
        // Fluidity: subtly increase bubble scale while being dragged
        scale.value = withSpring(1.04, { damping: 15, stiffness: 240 });
      },
      onPanResponderMove: (_, gestureState) => {
        const rawX = dragStartXRef.current + gestureState.dx;
        const clampedX = Math.max(minX, Math.min(maxX, rawX));
        translateX.value = clampedX;
      },
      onPanResponderRelease: (_, gestureState) => {
        isDraggingRef.current = false;
        isDraggingShared.value = false;
        setIsDragging(false);
        scale.value = withSpring(1, { damping: 18, stiffness: 200 });

        const currentX = translateX.value;
        const relativeX = currentX - horizontalPadding;
        const rawIndex = tabWidth > 0 ? Math.round(relativeX / tabWidth) : activeIndexRef.current;
        const targetIndex = Math.max(0, Math.min(numTabs - 1, rawIndex));

        const snapX = horizontalPadding + targetIndex * tabWidth;
        cachedIndicatorX = snapX;
        cachedIndicatorWidth = tabWidth;
        translateX.value = withSpring(snapX, APPLE_SPRING_CONFIG);

        // If dragged to another tab, navigate
        if (targetIndex !== activeIndexRef.current) {
          navigation.navigate(state.routes[targetIndex].name);
        } else if (Math.abs(gestureState.dx) < 5) {
          // Tap on active bubble
          navigation.emit({
            type: 'tabPress',
            target: state.routes[targetIndex].key,
            canPreventDefault: true,
          });
        }
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        isDraggingShared.value = false;
        setIsDragging(false);
        scale.value = withSpring(1, { damping: 18, stiffness: 200 });
        const snapX = horizontalPadding + activeIndexRef.current * tabWidth;
        translateX.value = withSpring(snapX, APPLE_SPRING_CONFIG);
      },
    })
  ).current;

  // Pointer event capture on Web
  const handlePointerDown = (e: any) => {
    if (Platform.OS === 'web' && e?.target?.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch { }
    }
  };

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
      ],
      width: indicatorWidth.value,
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

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      {/* Frosted Dark Glass Dock Container */}
      <View style={styles.tabBarPill} onLayout={handleBarLayout}>
        {/* ONE persistent draggable liquid-glass bubble */}
        <Animated.View
          {...panResponder.panHandlers}
          onPointerDown={handlePointerDown}
          style={[
            styles.slidingIndicatorWrapper,
            indicatorAnimatedStyle,
          ]}
        >
          {/* Seamless, continuous translucent frosted liquid glass bubble */}
          <View
            style={[
              styles.liquidGlassBubble,
              isDragging && styles.liquidGlassBubbleActive,
            ]}
          >
            {/* Subtle inner light reflection */}
            <View style={styles.innerGlassGlow} />

            {/* Soft, continuous perimeter chromatic refraction rim */}
            <View style={styles.chromaticRefractionRim} />
          </View>
        </Animated.View>

        {/* Tab Items - Rendered ONCE with natural optical lens magnification & refraction */}
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const isHovered = hoveredIndex === index && !isFocused;
          const config = TAB_CONFIGS.find((t) => t.name === route.name) || {
            name: route.name,
            label: route.name,
            iconName: 'circle' as keyof typeof Feather.glyphMap,
          };

          const onPress = () => {
            // Smoothly glide the same bubble to the clicked tab
            animateToTab(index);

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <AnimatedTabItem
              key={route.key}
              route={route}
              index={index}
              config={config}
              translateX={translateX}
              indicatorWidth={indicatorWidth}
              isDraggingShared={isDraggingShared}
              tabWidth={tabWidth}
              horizontalPadding={horizontalPadding}
              isFocused={isFocused}
              isHovered={isHovered}
              onPress={onPress}
              onLongPress={onLongPress}
              onHoverIn={() => setHoveredIndex(index)}
              onHoverOut={() => setHoveredIndex(null)}
              onLayout={(e) => handleTabLayout(index, e)}
              accessibilityLabel={descriptors[route.key]?.options?.title || config.label}
              testID={descriptors[route.key]?.options?.tabBarButtonTestID}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 26 : 18,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tabBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    height: 64,
    backgroundColor: 'rgba(18, 18, 22, 0.82)',
    borderRadius: 36,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    // Apple-style floating shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 12,
    ...(Platform.OS === 'web'
      ? {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }
      : {}),
  },
  slidingIndicatorWrapper: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  // Apple Modern Liquid Glass Bubble: translucent, soft, continuous
  liquidGlassBubble: {
    width: '92%',
    height: '100%',
    // Translucent glass surface (clean & transparent center)
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 26,
    // Soft, continuous white glass edge (NO harsh lines, NO separate top/bottom borders)
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    // Floating ambient shadow underneath
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.26,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        cursor: 'grab',
        userSelect: 'none',
      } as any)
      : {}),
  },
  liquidGlassBubbleActive: {
    borderColor: 'rgba(255, 255, 255, 0.32)',
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
    ...(Platform.OS === 'web'
      ? ({
        cursor: 'grabbing',
      } as any)
      : {}),
  },
  // Subtle diffuse inner light reflection
  innerGlassGlow: {
    ...StyleSheet.absoluteFill,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  // Extremely subtle chromatic diffraction rim strictly around the outer glass edge
  chromaticRefractionRim: {
    ...StyleSheet.absoluteFill,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.16)',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    pointerEvents: 'none',
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    zIndex: 3,
  },
  tabButtonHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: '#FFFFFF',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
