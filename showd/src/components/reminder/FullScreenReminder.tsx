import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../ui/Button';
import type { RootStackParamList } from '../../types/navigation';
import type { NagInterval, Task } from '../../types/task';
import { useActiveTaskId, useDismissReminder, useGetSnoozeCount, useShowSuccess, useSnoozeReminder } from '../../store/reminderStore';
import { useAddEvent, useCompleteTask, useEvents, useSnoozeTask, useStruggleTask, useTaskStore } from '../../store/taskStore';
import { useActiveTimerTaskId, useStartTimer } from '../../store/timerStore';
import { getSelectedSoundId } from '../../store/soundStore';
import { playSound, stopSound } from '../../services/soundPlayer';
import { cancelActiveReminder, rescheduleAfterSnooze, scheduleNextRegularReminder } from '../../services/notifications';
import { getLastDoneTime } from '../../utils/dateUtils';
import { Colors } from '../../utils/colors';
import { Typography } from '../../utils/typography';
import { BorderRadius, Spacing } from '../../utils/spacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SHAKE_THRESHOLD = 2.4;
const SHAKE_DEBOUNCE_MS = 300;
const SHAKES_REQUIRED = 5;

type Phase = 'primary' | 'math' | 'shake';

function nagIntervalToMs(interval: NagInterval): number | null {
  switch (interval) {
    case '3m':
      return 3 * 60 * 1000;
    case '5m':
      return 5 * 60 * 1000;
    case '10m':
      return 10 * 60 * 1000;
    case 'off':
    default:
      return null;
  }
}

function generateMathProblem(): { question: string; answer: number } {
  const ops = ['+', '-', 'x'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];

  if (op === '+') {
    const a = 5 + Math.floor(Math.random() * 15);
    const b = 5 + Math.floor(Math.random() * 15);
    return { question: `${a} + ${b}`, answer: a + b };
  }

  if (op === '-') {
    const a = 15 + Math.floor(Math.random() * 25);
    const b = 1 + Math.floor(Math.random() * (a - 1));
    return { question: `${a} - ${b}`, answer: a - b };
  }

  const a = 2 + Math.floor(Math.random() * 8);
  const b = 2 + Math.floor(Math.random() * 8);
  return { question: `${a} x ${b}`, answer: a * b };
}

export function FullScreenReminder() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const activeTaskId = useActiveTaskId();
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === activeTaskId));
  const events = useEvents();
  const activeTimerTaskId = useActiveTimerTaskId();
  const completeTask = useCompleteTask();
  const snoozeTask = useSnoozeTask();
  const struggleTask = useStruggleTask();
  const addEvent = useAddEvent();
  const startTimer = useStartTimer();
  const dismissReminder = useDismissReminder();
  const snoozeReminder = useSnoozeReminder();
  const showSuccess = useShowSuccess();
  const getSnoozeCount = useGetSnoozeCount();

  const [phase, setPhase] = useState<Phase>('primary');
  const [isHandlingAction, setIsHandlingAction] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);

  useEffect(() => {
    setPhase('primary');
  }, [task?.id]);

  useEffect(() => {
    if (!task) return;

    playSound(task.reminderSoundId ?? getSelectedSoundId(), true).catch(() => {});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

    return () => {
      stopSound().catch(() => {});
    };
  }, [task?.id, task?.reminderSoundId]);

  useEffect(() => {
    if (!task) return;
    if (phase !== 'primary') return;

    const intervalMs = nagIntervalToMs(task.nagInterval);
    if (intervalMs === null) return;
    if (activeTimerTaskId === task.id) return;

    const id = setInterval(() => {
      playSound(task.reminderSoundId ?? getSelectedSoundId(), false).catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }, intervalMs);

    return () => clearInterval(id);
  }, [activeTimerTaskId, phase, task]);

  if (!task) return null;

  const lastDone = getLastDoneTime(events, task.id);
  const locationNote = task.locationNote?.trim();

  const completeOrStart = () => {
    if (isHandlingAction) return;
    setIsHandlingAction(true);

    if (task.durationMinutes) {
      const now = new Date().toISOString();
      const eventId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      addEvent({
        taskId: task.id,
        userId: task.userId,
        scheduledFor: now,
        status: 'in_progress',
        respondedAt: now,
        snoozeCount: 0,
        startedAt: now,
        originalDurationMinutes: task.durationMinutes,
      });
      startTimer(task.id, eventId, task.durationMinutes);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      cancelActiveReminder(task.id).catch(() => {});
      scheduleNextRegularReminder(task).catch(() => {});
      stopSound().catch(() => {});
      dismissReminder();
      navigation.navigate('FocusTimer', { taskId: task.id, taskEventId: eventId });
      setIsHandlingAction(false);
      return;
    }

    const streak = completeTask(task.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    cancelActiveReminder(task.id).catch(() => {});
    scheduleNextRegularReminder(task).catch(() => {});
    stopSound().catch(() => {});
    dismissReminder();
    showSuccess(streak);
    setIsHandlingAction(false);
  };

  const handlePrimary = () => {
    if (task.dismissAction === 'math') {
      setPhase('math');
      return;
    }

    if (task.dismissAction === 'shake') {
      setPhase('shake');
      return;
    }

    completeOrStart();
  };

  const handleSnooze = () => {
    if (isHandlingAction) return;
    setIsHandlingAction(true);

    const ok = snoozeTask(task.id);
    if (!ok) {
      setIsHandlingAction(false);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    snoozeReminder(task.id);
    rescheduleAfterSnooze(task).catch(() => {});
    stopSound().catch(() => {});
    setIsHandlingAction(false);
  };

  const handleNotToday = () => {
    if (isHandlingAction) return;
    setIsHandlingAction(true);

    struggleTask(task.id, 'not_today', undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    cancelActiveReminder(task.id).catch(() => {});
    scheduleNextRegularReminder(task).catch(() => {});
    stopSound().catch(() => {});
    dismissReminder();
    setIsHandlingAction(false);
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.taskInfo}>
        <View style={styles.iconCircle}>
          <Feather name="bell" size={34} color="rgba(255,255,255,0.84)" />
        </View>

        <Text style={styles.taskName} numberOfLines={3}>
          {task.name}
        </Text>

        {lastDone && (
          <Text style={styles.lastDone}>Last done: {lastDone}</Text>
        )}

        {locationNote && (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.locationText}>{locationNote}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {phase === 'primary' && (
          <PrimaryActions
            task={task}
            snoozeCount={getSnoozeCount(task.id)}
            onPrimary={handlePrimary}
            onSnooze={handleSnooze}
            onNotToday={handleNotToday}
          />
        )}
        {phase === 'math' && (
          <MathChallenge
            onSolve={() => {
              setPhase('primary');
              completeOrStart();
            }}
            onCancel={() => setPhase('primary')}
          />
        )}
        {phase === 'shake' && (
          <ShakeChallenge
            onComplete={() => {
              setPhase('primary');
              completeOrStart();
            }}
            onCancel={() => setPhase('primary')}
          />
        )}
      </View>
    </View>
  );
}

function PrimaryActions({
  task,
  snoozeCount,
  onPrimary,
  onSnooze,
  onNotToday,
}: {
  task: Task;
  snoozeCount: number;
  onPrimary: () => void;
  onSnooze: () => void;
  onNotToday: () => void;
}) {
  const primaryLabel = task.durationMinutes
    ? `Start (${task.durationMinutes}m)`
    : 'Done';
  const snoozesRemaining = task.snoozeLimit - snoozeCount;

  return (
    <>
      <Button label={primaryLabel} onPress={onPrimary} variant="success" fullWidth />
      {snoozesRemaining > 0 && (
        <Button
          label={`Snooze 15 min${snoozeCount > 0 ? ` (${snoozesRemaining} left)` : ''}`}
          onPress={onSnooze}
          variant="secondary"
          fullWidth
          textStyle={styles.secondaryButtonText}
        />
      )}
      <TouchableOpacity onPress={onNotToday} style={styles.notTodayLink}>
        <Text style={styles.notTodayText}>Not today</Text>
      </TouchableOpacity>
    </>
  );
}

function MathChallenge({
  onSolve,
  onCancel,
}: {
  onSolve: () => void;
  onCancel: () => void;
}) {
  const [problem, setProblem] = useState(() => generateMathProblem());
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    const n = parseInt(answer, 10);
    if (Number.isNaN(n)) {
      setError(true);
      return;
    }

    if (n === problem.answer) {
      onSolve();
      return;
    }

    setError(true);
    setTimeout(() => {
      setError(false);
      setProblem(generateMathProblem());
      setAnswer('');
    }, 800);
  };

  return (
    <>
      <Text style={styles.mathPrompt}>Solve to dismiss</Text>
      <Text style={styles.mathQuestion}>{problem.question} = ?</Text>
      <TextInput
        style={[styles.mathInput, error && styles.mathInputError]}
        value={answer}
        onChangeText={setAnswer}
        keyboardType="numeric"
        autoFocus
        onSubmitEditing={submit}
        placeholderTextColor="rgba(255,255,255,0.35)"
      />
      {error && <Text style={styles.mathError}>Try again</Text>}
      <Button label="Submit" onPress={submit} variant="success" fullWidth />
      <TouchableOpacity onPress={onCancel} style={styles.notTodayLink}>
        <Text style={styles.notTodayText}>Cancel</Text>
      </TouchableOpacity>
    </>
  );
}

function ShakeChallenge({
  onComplete,
  onCancel,
}: {
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [count, setCount] = useState(0);
  const lastShakeAt = useRef(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude < SHAKE_THRESHOLD) return;

      const now = Date.now();
      if (now - lastShakeAt.current < SHAKE_DEBOUNCE_MS) return;

      lastShakeAt.current = now;
      setCount((c) => c + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (count >= SHAKES_REQUIRED) {
      onComplete();
    }
  }, [count, onComplete]);

  const progress = Math.min(count / SHAKES_REQUIRED, 1);

  return (
    <>
      <Text style={styles.shakePrompt}>Shake to dismiss</Text>
      <Text style={styles.shakeCount}>{count} / {SHAKES_REQUIRED}</Text>
      <View style={styles.shakeBarTrack}>
        <View style={[styles.shakeBarFill, { width: `${progress * 100}%` }]} />
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.notTodayLink}>
        <Text style={styles.notTodayText}>Cancel</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'rgba(15, 10, 20, 0.95)',
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    zIndex: 999,
  },
  taskInfo: {
    alignItems: 'center',
    marginTop: Spacing['4xl'],
    gap: Spacing.base,
  },
  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(255, 77, 106, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 106, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  taskName: {
    ...Typography.reminderTask,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  lastDone: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    maxWidth: '100%',
  },
  locationText: {
    ...Typography.body,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  actions: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
  },
  notTodayLink: {
    alignSelf: 'center',
    padding: Spacing.md,
  },
  notTodayText: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.65)',
  },
  mathPrompt: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  mathQuestion: {
    ...Typography.heading1,
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: Spacing.base,
  },
  mathInput: {
    ...Typography.heading2,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  mathInputError: {
    backgroundColor: 'rgba(255,0,0,0.2)',
  },
  mathError: {
    ...Typography.caption,
    color: '#ff8a8a',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  shakePrompt: {
    ...Typography.heading3,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  shakeCount: {
    ...Typography.heading1,
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: Spacing.base,
  },
  shakeBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.base,
  },
  shakeBarFill: {
    height: '100%',
    backgroundColor: Colors.success,
  },
});
