import React, { useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

export interface PressableScaleProps extends TouchableOpacityProps {
  children: React.ReactNode;
  activeScale?: number;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export const PressableScale = React.forwardRef<any, PressableScaleProps>(
  (
    {
      children,
      activeScale = 0.97,
      style,
      containerStyle,
      disabled,
      onPressIn,
      onPressOut,
      activeOpacity = 0.88,
      ...props
    },
    ref
  ) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = (e: any) => {
      if (!disabled) {
        Animated.spring(scale, {
          toValue: activeScale,
          useNativeDriver: true,
          speed: 60,
          bounciness: 0,
        }).start();
      }
      onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
      if (!disabled) {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 40,
          bounciness: 4,
        }).start();
      }
      onPressOut?.(e);
    };

    return (
      <Animated.View
        style={[
          containerStyle,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <TouchableOpacity
          ref={ref}
          {...props}
          disabled={disabled}
          activeOpacity={activeOpacity}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={style}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

PressableScale.displayName = 'PressableScale';
