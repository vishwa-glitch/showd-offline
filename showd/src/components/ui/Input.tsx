import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { BorderRadius, Spacing } from '../../utils/spacing';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  containerStyle?: object;
}

export function Input({
  label,
  error,
  containerStyle,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? Colors.missed
    : isFocused
    ? Colors.primary
    : Colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...textInputProps}
        style={[
          styles.input,
          { borderColor },
          textInputProps.multiline && styles.multiline,
        ]}
        placeholderTextColor={Colors.textTertiary}
        onFocus={(e) => {
          setIsFocused(true);
          textInputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          textInputProps.onBlur?.(e);
        }}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  error: {
    ...Typography.caption,
    color: Colors.missed,
    marginTop: Spacing.xs,
  },
});
