import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressableScale } from '../../components/PressableScale';

const TOPICS = [
  { id: '1', title: 'React Native & Mobile', count: '142 builders', icon: '📱' },
  { id: '2', title: 'AI Agents & LLM RAG', count: '98 builders', icon: '🤖' },
  { id: '3', title: 'Full Stack Next.js', count: '210 builders', icon: '⚡' },
  { id: '4', title: 'Rust & Distributed Systems', count: '64 builders', icon: '🦀' },
];

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Discover projects, tech stacks, and builders</Text>
        </View>

        <View style={styles.list}>
          {TOPICS.map((topic) => (
            <PressableScale key={topic.id} style={styles.card} activeScale={0.97}>
              <Text style={styles.icon}>{topic.icon}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{topic.title}</Text>
                <Text style={styles.cardCount}>{topic.count}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </PressableScale>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#71717A',
    fontWeight: '500',
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  icon: {
    fontSize: 24,
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  cardCount: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 22,
    fontWeight: '700',
    color: '#A1A1AA',
  },
});
