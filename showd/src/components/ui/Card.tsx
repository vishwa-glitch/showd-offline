import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../utils/colors';
import { BorderRadius, Shadows, Spacing } from '../../utils/spacing';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
}

export function Card({ children, onPress, style, padded = true }: CardProps) {
  const cardStyle = [
    styles.card,
    padded && styles.padded,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.md,
  },
  padded: {
    padding: Spacing.base,
  },
});
