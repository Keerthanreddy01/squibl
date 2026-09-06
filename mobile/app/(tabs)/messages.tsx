import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressableScale } from '../../components/PressableScale';

const CONVERSATIONS = [
  {
    id: '1',
    name: 'Marcus Vance',
    role: 'iOS & Flutter',
    lastMessage: 'Sounds great! Let’s sync on the API spec tomorrow.',
    time: '5m',
    unread: true,
  },
  {
    id: '2',
    name: 'Elena Rostova',
    role: 'Product Designer',
    lastMessage: 'Uploaded the Figma design tokens for the mobile app.',
    time: '42m',
    unread: false,
  },
  {
    id: '3',
    name: 'Devon Lee',
    role: 'Backend Architect',
    lastMessage: 'Database replication latency is now under 15ms.',
    time: '2h',
    unread: false,
  },
];

export default function MessagesScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Direct conversations with collaborators</Text>
        </View>

        <View style={styles.list}>
          {CONVERSATIONS.map((conv) => (
            <PressableScale key={conv.id} style={styles.card} activeScale={0.98}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{conv.name[0]}</Text>
              </View>
              <View style={styles.info}>
                <View style={styles.row}>
                  <Text style={styles.name}>{conv.name}</Text>
                  <Text style={styles.time}>{conv.time}</Text>
                </View>
                <Text style={styles.role}>{conv.role}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {conv.lastMessage}
                </Text>
              </View>
              {conv.unread && <View style={styles.unreadDot} />}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F4F4F5',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#18181B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  info: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  time: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  role: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '600',
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 13,
    color: '#52525B',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E50914',
    marginLeft: 8,
  },
});
