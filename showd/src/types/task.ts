export type TaskCategory =
  | 'medication'
  | 'exercise'
  | 'work'
  | 'self_care'
  | 'habit'
  | 'other';

export type TaskFrequency = 'once' | 'daily' | 'weekly' | 'custom';

export type TaskEventStatus = 'pending' | 'in_progress' | 'done' | 'snoozed' | 'struggled' | 'missed';

export type TriggerType = 'fixed_time' | 'first_unlock';

export type DismissAction = 'swipe' | 'math' | 'shake';

export type NagInterval = 'off' | '3m' | '5m' | '10m';

export interface FirstUnlockWindow {
  startTime: string;  // "HH:MM" in 24h format, e.g. "08:00"
  endTime: string;    // "HH:MM" in 24h format, e.g. "10:00"
}

export interface Task {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: TaskCategory;
  reminderTime: string;
  frequency: TaskFrequency;
  frequencyDays?: number[];
  customIntervalDays?: number;
  oneTimeDate?: string;
  snoozeLimit: number;
  durationMinutes?: number;
  requirePhotoProof: boolean;
  reminderSoundId?: string;
  triggerType: TriggerType;
  firstUnlockWindow?: FirstUnlockWindow;
  dismissAction: DismissAction;
  nagInterval: NagInterval;
  locationNote?: string;
  weeklyGoal: number;
  isActive: boolean;
  isPaused: boolean;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskEvent {
  id: string;
  taskId: string;
  userId: string;
  scheduledFor: string;
  status: TaskEventStatus;
  respondedAt?: string;
  snoozeCount: number;
  strugglingReason?: string;
  strugglingNote?: string;
  // Timer fields (timed tasks only)
  startedAt?: string;
  completedAt?: string;
  pausedDurationSeconds?: number;
  actualDurationSeconds?: number;
  originalDurationMinutes?: number;
  extensionsUsed?: number;
  totalExtensionSeconds?: number;
  timerCompleted?: boolean;
  // Photo proof
  proofPhotoUrl?: string;
  createdAt: string;
}

export interface TaskFormData {
  name: string;
  description: string;
  category: TaskCategory | null;
  reminderTime: string;
  frequency: TaskFrequency;
  frequencyDays: number[];
  customIntervalDays: number;
  oneTimeDate: string;
  snoozeLimit: number;
  durationMinutes: number | null;
  requirePhotoProof: boolean;
  reminderSoundId: string | null;
  triggerType: TriggerType;
  firstUnlockWindow: FirstUnlockWindow | null;
  dismissAction: DismissAction;
  nagInterval: NagInterval;
  locationNote: string;
  weeklyGoal: number;
}

export const TASK_CATEGORIES: { key: TaskCategory; label: string; icon: string }[] = [
  { key: 'medication', label: 'Medication', icon: 'heart' },
  { key: 'exercise', label: 'Exercise', icon: 'activity' },
  { key: 'work', label: 'Work', icon: 'briefcase' },
  { key: 'self_care', label: 'Self-care', icon: 'sun' },
  { key: 'habit', label: 'Habit', icon: 'star' },
  { key: 'other', label: 'Other', icon: 'grid' },
];

export const DEFAULT_FORM_DATA: TaskFormData = {
  name: '',
  description: '',
  category: null,
  reminderTime: '08:00',
  frequency: 'daily',
  frequencyDays: [],
  customIntervalDays: 1,
  oneTimeDate: '',
  snoozeLimit: 3,
  durationMinutes: null,
  requirePhotoProof: false,
  reminderSoundId: null,
  triggerType: 'fixed_time',
  firstUnlockWindow: null,
  dismissAction: 'swipe',
  nagInterval: 'off',
  locationNote: '',
  weeklyGoal: 5,
};

// Lazy import to avoid circular deps. Call only at form-init time, not at module load.
export function getDefaultFormData(): TaskFormData {
  // Inline require to break the import cycle. onboardingStore imports types from this file.
  const { useOnboardingStore } = require('../store/onboardingStore') as typeof import('../store/onboardingStore');
  const onboarding = useOnboardingStore.getState();

  return {
    ...DEFAULT_FORM_DATA,
    snoozeLimit: onboarding.defaultSnoozeLimit,
    dismissAction: onboarding.defaultDismissAction,
    nagInterval: onboarding.defaultNagInterval,
    weeklyGoal: onboarding.defaultWeeklyGoal,
  };
}
