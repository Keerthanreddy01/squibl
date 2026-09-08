import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';

export default function RootLayout() {
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

