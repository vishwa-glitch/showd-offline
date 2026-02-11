import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing } from '../../utils/spacing';
import { TaskForm } from '../../components/task/TaskForm';
import { useUser } from '../../store/authStore';
import { useGetTaskById, useUpdateTask, useDeleteTask } from '../../store/taskStore';
import {
  useCreateConnection,
  useRemoveConnectionsByTaskId,
  useGetConnectionByTaskId,
} from '../../store/witnessStore';
import { cancelTaskReminder, scheduleTaskReminder } from '../../services/notifications';
import { sendWitnessInviteSMS } from '../../services/witness';
import type { EditTaskScreenProps } from '../../types/navigation';
import type { TaskFormData } from '../../types/task';

export function EditTaskScreen({ navigation, route }: EditTaskScreenProps) {
  const { taskId } = route.params;
  const getTaskById = useGetTaskById();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const user = useUser();
  const createConnection = useCreateConnection();
  const removeConnectionsByTaskId = useRemoveConnectionsByTaskId();
  const getConnectionByTaskId = useGetConnectionByTaskId();
  const task = getTaskById(taskId);

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Task not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initialData: Partial<TaskFormData> = {
    name: task.name,
    description: task.description || '',
    category: task.category,
    reminderTime: task.reminderTime,
    frequency: task.frequency,
    frequencyDays: task.frequencyDays || [],
    customIntervalDays: task.customIntervalDays || 1,
    snoozeLimit: task.snoozeLimit,
    durationMinutes: task.durationMinutes ?? null,
    accountabilityType: task.accountabilityType,
    witnessPhone: task.witnessPhone || '',
    witnessName: task.witnessName || '',
    witnessRelationship: task.witnessRelationship || '',
    personalWitnessName: task.personalWitnessName || '',
  };

  const handleSubmit = (formData: TaskFormData) => {
    updateTask(taskId, {
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category!,
      reminderTime: formData.reminderTime,
      frequency: formData.frequency,
      frequencyDays: formData.frequencyDays.length > 0 ? formData.frequencyDays : undefined,
      customIntervalDays: formData.frequency === 'custom' ? formData.customIntervalDays : undefined,
      snoozeLimit: formData.snoozeLimit,
      durationMinutes: formData.durationMinutes ?? undefined,
      accountabilityType: formData.accountabilityType,
      witnessPhone: formData.witnessPhone || undefined,
      witnessName: formData.witnessName || undefined,
      witnessRelationship: formData.witnessRelationship || undefined,
      personalWitnessName: formData.personalWitnessName || undefined,
    });
    // Handle witness connection changes
    const wasReal = task.accountabilityType === 'real';
    const isNowReal = formData.accountabilityType === 'real';

    if (wasReal && !isNowReal) {
      // Switching away from real accountability — remove connections
      removeConnectionsByTaskId(taskId);
      updateTask(taskId, { witnessConnectionId: undefined });
    } else if (isNowReal && formData.witnessPhone && formData.witnessName) {
      const existingConnection = getConnectionByTaskId(taskId);
      const phoneChanged = existingConnection?.witnessPhone !== formData.witnessPhone;
      const nameChanged = existingConnection?.witnessName !== formData.witnessName;

      if (!existingConnection || phoneChanged || nameChanged) {
        if (existingConnection) removeConnectionsByTaskId(taskId);
        const connection = createConnection({
          taskId,
          taskDoerId: user?.id || 'guest',
          taskDoerName: user?.name || 'Guest',
          witnessPhone: formData.witnessPhone,
          witnessName: formData.witnessName,
          witnessRelationship: formData.witnessRelationship || undefined,
        });
        updateTask(taskId, { witnessConnectionId: connection.id });
        sendWitnessInviteSMS({
          connectionId: connection.id,
          witnessPhone: formData.witnessPhone,
          witnessName: formData.witnessName,
          taskDoerName: user?.name || 'Guest',
          taskName: formData.name,
          inviteToken: connection.inviteToken,
        });
      }
    }

    // Reschedule notification with updated task data
    const updatedTask = getTaskById(taskId);
    if (updatedTask) {
      cancelTaskReminder(taskId).then(() => scheduleTaskReminder(updatedTask)).catch(() => {});
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Delete "${task.name}"? This will remove all history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            cancelTaskReminder(taskId).catch(() => {});
            removeConnectionsByTaskId(taskId);
            deleteTask(taskId);
            navigation.popToTop();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Task</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Feather name="trash-2" size={20} color={Colors.missed} />
        </TouchableOpacity>
      </View>

      <TaskForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        userPhone={user?.phone}
        userName={user?.name}
      />
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
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
