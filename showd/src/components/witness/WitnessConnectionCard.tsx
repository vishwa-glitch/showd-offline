import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { WitnessStatusBadge } from './WitnessStatusBadge';
import { maskPhone } from '../../services/witness';
import type { WitnessConnection } from '../../types/witness';

interface WitnessConnectionCardProps {
  connection: WitnessConnection;
  taskName?: string;
  showTaskName?: boolean;
  onResendInvite?: () => void;
  onRemove?: () => void;
  onSwitchToPersonal?: () => void;
}

export function WitnessConnectionCard({
  connection,
  taskName,
  showTaskName = false,
  onResendInvite,
  onRemove,
  onSwitchToPersonal,
}: WitnessConnectionCardProps) {
  const initials = connection.witnessName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{connection.witnessName}</Text>
          <Text style={styles.phone}>{maskPhone(connection.witnessPhone)}</Text>
          {showTaskName && taskName && (
            <View style={styles.taskRow}>
              <Feather name="check-square" size={12} color={Colors.textTertiary} />
              <Text style={styles.taskName}>{taskName}</Text>
            </View>
          )}
        </View>
        <WitnessStatusBadge status={connection.status} />
      </View>

      {(onResendInvite || onRemove || onSwitchToPersonal) && (
        <View style={styles.actions}>
          {onResendInvite && connection.status === 'invited' && (
            <Button
              label="Resend Invite"
              variant="secondary"
              onPress={onResendInvite}
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
            />
          )}
          {onSwitchToPersonal && (
            <Button
              label="Switch to Personal"
              variant="text"
              onPress={onSwitchToPersonal}
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
            />
          )}
          {onRemove && (
            <Button
              label="Remove"
              variant="text"
              onPress={onRemove}
              style={styles.actionButton}
              textStyle={{ ...styles.actionButtonText, color: Colors.missed }}
            />
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.caption,
    color: Colors.primary,
    fontSize: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  phone: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  taskName: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  actionButton: {
    minHeight: 36,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  actionButtonText: {
    fontSize: 13,
  },
});
