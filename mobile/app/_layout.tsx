import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
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
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
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
