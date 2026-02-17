import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';

interface PostMissNudgeProps {
  witnessName?: string;
  onGoPro: () => void;
  onDismiss: () => void;
}

/**
 * Soft, non-blocking in-app nudge shown once per day after a free user misses a task.
 * Shows loss-aversion messaging if user had a witness during trial.
 */
export function PostMissNudge({ witnessName, onGoPro, onDismiss }: PostMissNudgeProps) {
  const headline = witnessName
    ? 'Get someone in your corner'
    : "You're on a roll!";

  const subtitle = witnessName
    ? `With Pro, ${witnessName} would have checked in on you.`
    : 'Lock in your streak with witnesses and cloud backup.';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
        <Feather name="x" size={16} color={Colors.textTertiary} />
      </TouchableOpacity>
      <Feather name="users" size={24} color={Colors.proGold} />
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <TouchableOpacity style={styles.ctaBtn} onPress={onGoPro}>
        <Text style={styles.ctaText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.proGoldLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
    ...Shadows.sm,
  },
  dismissBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.xs,
  },
  headline: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  ctaBtn: {
    backgroundColor: Colors.proGold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  ctaText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.surface,
  },
});
