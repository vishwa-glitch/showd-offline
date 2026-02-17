import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { useTrialDayNumber, useIsTrialActive, useIsPro, useTrialDaysRemaining } from '../../store/subscriptionStore';

interface TrialBannerProps {
  onGoProPress: () => void;
  /** Name of the user's witness, if any, for loss-aversion messaging */
  witnessName?: string;
  /** Number of tasks that will be paused on expiry */
  tasksOverLimit?: number;
}

export function TrialBanner({ onGoProPress, witnessName, tasksOverLimit }: TrialBannerProps) {
  const dayNumber = useTrialDayNumber();
  const daysRemaining = useTrialDaysRemaining();
  const isTrialActive = useIsTrialActive();
  const isPro = useIsPro();

  // Don't show banner for Pro users
  if (isPro) return null;

  // Days 1-4: no banner
  if (isTrialActive && dayNumber <= 4) return null;

  // Day 5: subtle banner
  if (isTrialActive && dayNumber === 5) {
    return (
      <View style={styles.subtle}>
        <Feather name="clock" size={14} color={Colors.proGold} />
        <Text style={styles.subtleText}>
          {daysRemaining} days left of your full Showd experience
        </Text>
      </View>
    );
  }

  // Day 6: prominent banner
  if (isTrialActive && dayNumber === 6) {
    const message = witnessName
      ? `1 day left \u2014 ${witnessName} will stop receiving updates tomorrow`
      : tasksOverLimit && tasksOverLimit > 0
        ? `1 day left \u2014 your extra tasks and full history expire tomorrow`
        : '1 day left of your full Showd experience';

    return (
      <View style={styles.prominent}>
        <Feather name="clock" size={14} color={Colors.proGold} />
        <Text style={styles.prominentText}>{message}</Text>
      </View>
    );
  }

  // Day 7: urgent banner with CTA
  if (isTrialActive && dayNumber === 7) {
    const message = witnessName
      ? `Your trial ends today. After today, ${witnessName} won't get updates.`
      : 'Your trial ends today.';

    return (
      <View style={styles.urgent}>
        <View style={styles.urgentRow}>
          <Feather name="alert-circle" size={14} color={Colors.surface} />
          <Text style={styles.urgentText}>{message}</Text>
        </View>
        <TouchableOpacity style={styles.urgentCta} onPress={onGoProPress}>
          <Text style={styles.urgentCtaText}>Go Pro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Day 8+: post-expiry loss-aversion
  if (!isTrialActive && dayNumber > 7) {
    const message = witnessName
      ? `${witnessName} is no longer getting your updates. Reconnect with Pro.`
      : tasksOverLimit && tasksOverLimit > 0
        ? `${tasksOverLimit} task${tasksOverLimit > 1 ? 's' : ''} paused. Go Pro to reactivate.`
        : 'Unlock unlimited tasks, witnesses, and more with Pro.';

    return (
      <TouchableOpacity style={styles.postExpiry} onPress={onGoProPress}>
        <Feather name="zap" size={14} color={Colors.proGold} />
        <Text style={styles.postExpiryText}>{message}</Text>
        <Feather name="chevron-right" size={14} color={Colors.proGold} />
      </TouchableOpacity>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  subtle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.proGoldLight,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  subtleText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  prominent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.proGoldLight,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  prominentText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  urgent: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  urgentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  urgentText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.surface,
    flex: 1,
  },
  urgentCta: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  urgentCtaText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.primary,
  },
  postExpiry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.proGoldLight,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  postExpiryText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
});
