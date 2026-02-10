import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { BorderRadius, Spacing, MIN_TOUCH_TARGET } from '../../utils/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'success' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.surface : Colors.primary}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            styles[`${variant}Label` as keyof typeof styles] as TextStyle,
            isDisabled && styles.disabledLabel,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  text: {
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.sm,
  },
  success: {
    backgroundColor: Colors.success,
  },
  danger: {
    backgroundColor: Colors.missed,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...Typography.button,
  },
  primaryLabel: {
    color: Colors.surface,
  },
  secondaryLabel: {
    color: Colors.primary,
  },
  textLabel: {
    color: Colors.primary,
  },
  successLabel: {
    color: Colors.surface,
  },
  dangerLabel: {
    color: Colors.surface,
  },
  disabledLabel: {
    opacity: 0.7,
  },
});
