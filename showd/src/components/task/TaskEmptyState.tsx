import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing } from '../../utils/spacing';
import { Button } from '../ui/Button';

interface TaskEmptyStateProps {
  onCreateTask: () => void;
}

export function TaskEmptyState({ onCreateTask }: TaskEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <Feather name="clipboard" size={48} color={Colors.textTertiary} />
      </View>
      <Text style={styles.title}>No tasks yet</Text>
      <Text style={styles.description}>
        Create your first task and let Showd help you stay on track.
      </Text>
      <Button
        label="+ Create Task"
        onPress={onCreateTask}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  illustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  button: {
    paddingHorizontal: Spacing['2xl'],
  },
});
