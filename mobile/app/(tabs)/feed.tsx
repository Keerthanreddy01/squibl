import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { PostItem } from '@squibl/types';
import { supabase } from '../../lib/supabase';

export default function FeedScreen() {
  const router = useRouter();

  // Test type linking
  const samplePost: Partial<PostItem> = {
    content: 'Welcome to the Squibl mobile feed!',
    post_type: 'update',
  };

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Squibl Feed</Text>
        <TouchableOpacity
          style={styles.devLogoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.devLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>Welcome to Feed</Text>
        <Text style={styles.subtitle}>{samplePost.content}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },
  devLogoutBtn: {
    marginRight: 52,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FAFAFA',
    borderStyle: 'dashed',
  },
  devLogoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E50914',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#71717A',
  },
});
