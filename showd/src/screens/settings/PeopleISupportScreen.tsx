import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import type { PeopleISupportScreenProps } from '../../types/navigation';

// In demo mode, nobody has added the current user as a witness,
// so this screen will always show the empty state.
// The card UI is built and ready for when data exists.

interface SupportCardProps {
  name: string;
  taskName: string;
  completedToday: number;
  totalToday: number;
  streak: number;
}

function SupportCard({ name, taskName, completedToday, totalToday, streak }: SupportCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{name}</Text>
          <Text style={styles.cardMeta}>Watching: {taskName}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>
              Today: {'\u2705'} {completedToday}/{totalToday} done
            </Text>
            <Text style={styles.statText}>
              Streak: {'\uD83D\uDD25'} {streak} days
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function PeopleISupportScreen({ navigation }: PeopleISupportScreenProps) {
  // No data in demo mode — empty array
  const supporting: SupportCardProps[] = [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>People I Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {supporting.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="heart" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>{"You\u2019re not supporting anyone yet"}</Text>
            <Text style={styles.emptySubtext}>
              When someone adds you as their witness, you'll see them here.
            </Text>
          </View>
        ) : (
          supporting.map((person, index) => (
            <SupportCard key={index} {...person} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  title: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.heading3,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.primary,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  cardMeta: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.xs,
  },
  statText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
