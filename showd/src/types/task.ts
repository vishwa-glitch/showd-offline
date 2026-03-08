export type TaskCategory =
  | 'medication'
  | 'exercise'
  | 'work'
  | 'self_care'
  | 'habit'
  | 'other';

export type TaskFrequency = 'once' | 'daily' | 'weekly' | 'custom';

export type TaskEventStatus = 'pending' | 'in_progress' | 'done' | 'snoozed' | 'struggled' | 'missed';

export interface Task {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: TaskCategory;
  reminderTime: string;
  witnessName?: string;
  witnessPhotoUri?: string;
  frequency: TaskFrequency;
  frequencyDays?: number[];
  customIntervalDays?: number;
  oneTimeDate?: string;
  snoozeLimit: number;
  durationMinutes?: number;
  requirePhotoProof: boolean;
  reminderSoundId?: string;
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
  witnessName: string;
  witnessPhotoUri: string;
  frequency: TaskFrequency;
  frequencyDays: number[];
  customIntervalDays: number;
  oneTimeDate: string;
  snoozeLimit: number;
  durationMinutes: number | null;
  requirePhotoProof: boolean;
  reminderSoundId: string | null;
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
  witnessName: '',
  witnessPhotoUri: '',
  frequency: 'daily',
  frequencyDays: [],
  customIntervalDays: 1,
  oneTimeDate: '',
  snoozeLimit: 3,
  durationMinutes: null,
  requirePhotoProof: false,
  reminderSoundId: null,
};
