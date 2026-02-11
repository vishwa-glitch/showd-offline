import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import type { ConnectionStatus } from '../../types/witness';

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { icon: keyof typeof Feather.glyphMap; color: string; bg: string; label: string }
> = {
  invited: {
    icon: 'send',
    color: Colors.snooze,
    bg: Colors.snoozeLight,
    label: 'Invited',
  },
  active: {
    icon: 'check-circle',
    color: Colors.success,
    bg: Colors.successLight,
    label: 'Active',
  },
  declined: {
    icon: 'x-circle',
    color: Colors.missed,
    bg: Colors.missedLight,
    label: 'Declined',
  },
  removed: {
    icon: 'slash',
    color: Colors.textTertiary,
    bg: Colors.surfaceSecondary,
    label: 'Removed',
  },
};

interface WitnessStatusBadgeProps {
  status: ConnectionStatus;
}

export function WitnessStatusBadge({ status }: WitnessStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Feather name={config.icon} size={12} color={config.color} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  label: {
    ...Typography.caption,
    fontSize: 11,
  },
});
