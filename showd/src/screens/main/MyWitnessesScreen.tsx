import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing } from '../../utils/spacing';
import { WitnessConnectionCard } from '../../components/witness/WitnessConnectionCard';
import {
  useConnections,
  useRemoveConnectionsByTaskId,
  useMarkFollowUpSent,
} from '../../store/witnessStore';
import { useGetTaskById, useUpdateTask } from '../../store/taskStore';
import { sendResendInviteSMS, canResendInvite } from '../../services/witness';
import type { MyWitnessesScreenProps } from '../../types/navigation';
import type { WitnessConnection } from '../../types/witness';

export function MyWitnessesScreen({ navigation }: MyWitnessesScreenProps) {
  const connections = useConnections();
  const getTaskById = useGetTaskById();
  const updateTask = useUpdateTask();
  const removeConnectionsByTaskId = useRemoveConnectionsByTaskId();
  const markFollowUpSent = useMarkFollowUpSent();

  const active = connections.filter((c) => c.status === 'active');
  const invited = connections.filter((c) => c.status === 'invited');
  const other = connections.filter((c) => c.status === 'declined' || c.status === 'removed');

  const handleResend = (connection: WitnessConnection) => {
    if (!canResendInvite(connection)) {
      Alert.alert('Too Soon', 'You can resend the invite after 48 hours.');
      return;
    }
    const task = getTaskById(connection.taskId);
    sendResendInviteSMS({
      connectionId: connection.id,
      witnessPhone: connection.witnessPhone,
      witnessName: connection.witnessName,
      taskDoerName: connection.taskDoerName,
      taskName: task?.name || '',
      inviteToken: connection.inviteToken,
    });
    markFollowUpSent(connection.id);
    Alert.alert('Sent', 'Follow-up invite sent.');
  };

  const handleRemove = (connection: WitnessConnection) => {
    Alert.alert(
      'Remove Witness',
      `Remove ${connection.witnessName}? They will no longer be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeConnectionsByTaskId(connection.taskId);
            updateTask(connection.taskId, {
              witnessConnectionId: undefined,
              witnessPhone: undefined,
              witnessName: undefined,
            });
          },
        },
      ],
    );
  };

  const handleSwitchToPersonal = (connection: WitnessConnection) => {
    Alert.alert(
      'Switch to Personal',
      'Switch to personal accountability? The witness will no longer be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: () => {
            removeConnectionsByTaskId(connection.taskId);
            updateTask(connection.taskId, {
              accountabilityType: 'personal',
              personalWitnessName: connection.witnessName,
              witnessConnectionId: undefined,
              witnessPhone: undefined,
              witnessName: undefined,
            });
          },
        },
      ],
    );
  };

  const renderGroup = (
    title: string,
    items: readonly WitnessConnection[],
  ) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.group}>
        <Text style={styles.groupTitle}>{title}</Text>
        {items.map((connection) => {
          const task = getTaskById(connection.taskId);
          return (
            <View key={connection.id} style={styles.cardWrapper}>
              <WitnessConnectionCard
                connection={connection}
                taskName={task?.name}
                showTaskName
                onResendInvite={
                  connection.status === 'invited'
                    ? () => handleResend(connection)
                    : undefined
                }
                onRemove={() => handleRemove(connection)}
                onSwitchToPersonal={() => handleSwitchToPersonal(connection)}
              />
            </View>
          );
        })}
      </View>
    );
  };

  const isEmpty = connections.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Witnesses</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.empty}>
            <Feather name="users" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No witnesses yet</Text>
            <Text style={styles.emptySubtext}>
              When you add a real accountability witness to a task, they'll show up here.
            </Text>
          </View>
        ) : (
          <>
            {renderGroup('Active', active)}
            {renderGroup('Invited', invited)}
            {renderGroup('Past', other)}
          </>
        )}

        {/* Placeholder */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>People I Support</Text>
          <View style={styles.placeholder}>
            <Feather name="heart" size={24} color={Colors.textTertiary} />
            <Text style={styles.placeholderText}>
              Coming soon — see tasks where you're someone's witness.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  title: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  group: {
    marginBottom: Spacing.xl,
  },
  groupTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  cardWrapper: {
    marginBottom: Spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.heading3,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  placeholder: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  placeholderText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
