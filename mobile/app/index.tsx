import React from 'react';
import { useRouter } from 'expo-router';
import { SplashScreenView } from '../components/SplashScreenView';

export default function Index() {
  const router = useRouter();

  const handleFinish = (hasSession: boolean) => {
    if (hasSession) {
      router.replace('/(tabs)/feed');
    } else {
      router.replace('/(auth)/login');
    }
  };

  return <SplashScreenView onFinish={handleFinish} />;
}
