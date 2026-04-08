import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import { useDefaultSnoozeLimit, useUpdateDefaultSnoozeLimit } from '../../store/onboardingStore';
import type { SnoozeLimitScreenProps } from '../../types/navigation';

const OPTIONS = [
  {
    value: 1,
    title: '1 snooze',
    description: 'One chance to delay. Then it\u2019s now or never.',
    badge: 'Strictest',
  },
  {
    value: 2,
    title: '2 snoozes',
    description: 'A little flexibility. Two delays, then decide.',
    badge: undefined,
  },
  {
    value: 3,
    title: '3 snoozes',
    description: 'Maximum breathing room. Three 15-minute delays.',
    badge: 'Most flexible',
  },
] as const;

export function SnoozeLimitScreen({ navigation }: SnoozeLimitScreenProps) {
  const insets = useSafeAreaInsets();
  const currentLimit = useDefaultSnoozeLimit();
  const updateDefaultSnoozeLimit = useUpdateDefaultSnoozeLimit();

  const handleSelect = (value: number) => {
    if (value === currentLimit) return;
    updateDefaultSnoozeLimit(value);
    Alert.alert('Updated', `Default snooze limit updated to ${value}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Snooze Limit</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing['4xl'] + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.explanation}>
          This sets the default number of snoozes for new tasks. You can override this per task.
        </Text>

        {OPTIONS.map((option) => {
          const selected = option.value === currentLimit;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.card, selected && styles.cardSelected]}
              activeOpacity={0.7}
              onPress={() => handleSelect(option.value)}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardTextArea}>
                  <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>
                    {option.title}
                  </Text>
                  <Text style={styles.cardDescription}>{option.description}</Text>
                  {option.badge && (
                    <Text style={[styles.badge, selected && styles.badgeSelected]}>
                      {option.badge}
                    </Text>
                  )}
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
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
  explanation: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  cardSelected: {
    borderColor: Colors.primary,
    borderLeftWidth: 3,
    backgroundColor: Colors.primaryLight,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTextArea: {
    flex: 1,
    gap: Spacing.xs,
  },
  cardTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  cardTitleSelected: {
    color: Colors.primary,
  },
  cardDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  badge: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  badgeSelected: {
    color: Colors.primary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
});
