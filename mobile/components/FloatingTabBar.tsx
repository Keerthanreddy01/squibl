import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import type { Tabs } from 'expo-router';

const RED = '#E50914';

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

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: FloatingTabBarProps) {
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const activeIndex = state.index;
  const numTabs = state.routes.length;

  const translateX = useSharedValue(0);

  // Tab pill padding inside the dark bar
  const horizontalPadding = 6;
  const availableWidth = Math.max(0, tabBarWidth - horizontalPadding * 2);
  const tabWidth = numTabs > 0 ? availableWidth / numTabs : 0;

  useEffect(() => {
    if (tabWidth > 0) {
      const targetX = horizontalPadding + activeIndex * tabWidth;
      translateX.value = withSpring(targetX, {
        damping: 18,
        stiffness: 180,
        mass: 0.8,
      });
    }
  }, [activeIndex, tabWidth, horizontalPadding, translateX]);

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: tabWidth,
    };
  });

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0 && width !== tabBarWidth) {
      setTabBarWidth(width);
      translateX.value = horizontalPadding + activeIndex * (width - horizontalPadding * 2) / numTabs;
    }
  };

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <View style={styles.tabBarPill} onLayout={handleLayout}>
        {/* Animated Sliding Red Indicator */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.slidingIndicatorWrapper,
              indicatorAnimatedStyle,
            ]}
          >
            <View style={styles.slidingIndicator} />
          </Animated.View>
        )}

        {/* Tab Buttons */}
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIGS.find((t) => t.name === route.name) || {
            name: route.name,
            label: route.name,
            iconName: 'circle' as keyof typeof Feather.glyphMap,
          };

          const onPress = () => {
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

          const iconColor = isFocused ? '#FFFFFF' : '#A1A1AA';
          const textColor = isFocused ? '#FFFFFF' : '#71717A';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key]?.options?.title || config.label}
              testID={descriptors[route.key]?.options?.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
              activeOpacity={0.75}
            >
              <View style={styles.iconWrapper}>
                <Feather
                  name={config.iconName}
                  size={20}
                  color={iconColor}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: textColor },
                  isFocused && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
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
    backgroundColor: '#121214',
    borderRadius: 36,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    // Floating drop shadow for elevation
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 12,
  },
  slidingIndicatorWrapper: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slidingIndicator: {
    width: '90%',
    height: '100%',
    backgroundColor: RED,
    borderRadius: 28,
    // Radiant red glow
    shadowColor: RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.48,
    shadowRadius: 10,
    elevation: 6,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
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
  },
  tabLabelActive: {
    fontWeight: '800',
  },
});
