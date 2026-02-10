import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';

type PermissionItemStatus = 'pending' | 'granted' | 'denied' | 'unknown';

interface PermissionItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  status: PermissionItemStatus;
}

export function PermissionItem({ icon, title, description, status }: PermissionItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.statusContainer}>
        {status === 'granted' && (
          <View style={styles.statusGranted}>
            <Feather name="check" size={16} color="#FFFFFF" />
          </View>
        )}
        {status === 'denied' && (
          <View style={styles.statusDenied}>
            <Feather name="x" size={16} color="#FFFFFF" />
          </View>
        )}
        {status === 'pending' && <View style={styles.statusPending} />}
        {status === 'unknown' && (
          <View style={styles.statusUnknown}>
            <Feather name="help-circle" size={16} color={Colors.textTertiary} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  statusContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusGranted: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDenied: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.missed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPending: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  statusUnknown: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
