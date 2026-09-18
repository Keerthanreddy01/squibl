import React from 'react';
import { useRouter } from 'expo-router';
import { SplashScreenView } from '../components/SplashScreenView';
import { isEmailVerified, supabase } from '../lib/supabase';

export default function Index() {
  const router = useRouter();

  const handleFinish = async (hasSession: boolean) => {
    if (!hasSession) {
      router.replace('/(auth)/login');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || !isEmailVerified(session.user)) {
        router.replace('/(auth)/login');
        return;
      }

      const { data: profile } = await (supabase.from('builder_profiles') as any)
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        router.replace('/(tabs)/feed');
      } else {
        router.replace('/onboarding');
      }
    } catch {
      router.replace('/onboarding');
    }
  };

  return <SplashScreenView onFinish={handleFinish} />;
}
