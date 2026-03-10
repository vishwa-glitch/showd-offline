import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { Spacing } from '../../utils/spacing';
import { TaskForm } from '../../components/task/TaskForm';
import { useAddTask } from '../../store/taskStore';
import { scheduleTaskReminder } from '../../services/notifications';
import type { CreateTaskScreenProps } from '../../types/navigation';
import type { TaskFormData } from '../../types/task';

export function CreateTaskScreen({ navigation }: CreateTaskScreenProps) {
  const addTask = useAddTask();

  const handleSubmit = (formData: TaskFormData) => {
    const newTask = addTask(formData);
    scheduleTaskReminder(newTask).catch(() => { });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Task</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Drag handle indicator */}
      <View style={styles.handleRow}>
        <View style={styles.handle} />
      </View>

      <TaskForm
        onSubmit={handleSubmit}
        submitLabel="Create Task"
        showWitnessPhotoOptionalHint
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
  handleRow: {
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
});
