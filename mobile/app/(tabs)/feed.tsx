import { StyleSheet, Text, View } from 'react-native';
import type { PostItem } from '@squibl/types';

export default function FeedScreen() {
  // Test type linking
  const samplePost: Partial<PostItem> = {
    content: 'Welcome to the Squibl mobile feed!',
    post_type: 'update',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Squibl Feed</Text>
      <Text style={styles.subtitle}>{samplePost.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#a1a1aa',
  },
});
