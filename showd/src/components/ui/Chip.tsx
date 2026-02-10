import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { BorderRadius, Spacing, MIN_TOUCH_TARGET } from '../../utils/spacing';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  color?: string;
}

export function Chip({ label, selected, onPress, icon, color }: ChipProps) {
  const bgColor = selected
    ? color || Colors.primary
    : Colors.surfaceSecondary;
  const textColor = selected ? Colors.surface : Colors.textSecondary;
  const iconColor = selected ? Colors.surface : (color || Colors.textTertiary);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, { backgroundColor: bgColor }]}
    >
      {icon && (
        <Feather
          name={icon}
          size={14}
          color={iconColor}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    minHeight: 36,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  label: {
    ...Typography.caption,
  },
});
