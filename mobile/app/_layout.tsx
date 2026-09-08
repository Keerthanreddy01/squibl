import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import { SplashScreenView } from '../components/SplashScreenView';

export default function RootLayout() {
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  const router = useRouter();

  const handleSplashFinish = (hasSession: boolean) => {
    setIsSplashComplete(true);
    if (hasSession) {
      router.replace('/(tabs)/feed');
    } else {
      router.replace('/(auth)/login');
    }
  };

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
        <Stack.Screen name="(auth)" options={{ contentStyle: { backgroundColor: '#FFFFFF' } }} />
        <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: '#FFFFFF' } }} />
      </Stack>

      {!isSplashComplete && (
        <View style={styles.splashOverlay}>
          <SplashScreenView onFinish={handleSplashFinish} />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  splashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 999,
  },
});
