import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useShallow } from 'zustand/react/shallow';
import type { Task, TaskEvent, TaskFormData, TriggerType, DismissAction, NagInterval } from '../types/task';
import { useRatingStoreBase } from './ratingStore';
import { useOnboardingStore } from './onboardingStore';
import { computeWeeklyStreak, computeLongestWeeklyStreak } from '../utils/dateUtils';

interface TaskState {
  tasks: Task[];
  events: TaskEvent[];
  isLoading: boolean;

  addTask: (formData: TaskFormData) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  getTaskById: (taskId: string) => Task | undefined;

  addEvent: (event: Omit<TaskEvent, 'id' | 'createdAt'>) => void;
  completeTask: (taskId: string) => number;
  undoTaskCompletion: (taskId: string) => boolean;
  snoozeTask: (taskId: string) => boolean;
  struggleTask: (taskId: string, reason: string, note?: string) => void;
  markTaskMissed: (taskId: string) => void;

  getTodayTasks: () => Task[];
  getTaskEvents: (taskId: string) => TaskEvent[];
  getCompletedTodayCount: () => number;
  getActiveTaskCount: () => number;
}

const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const LOCAL_USER_ID = 'local';
const LEGACY_MOCK_PREFIX = 'mock-feb-2026';

/**
 * Check if a premature "missed" event exists for a task today.
 */
function hasPrematureMissedEvent(events: TaskEvent[], taskId: string, today: string): boolean {
  return events.some(
    (e) => e.taskId === taskId && e.scheduledFor.startsWith(today) && e.status === 'missed',
  );
}

/** Filter out missed events for a specific task+day. */
function filterOutMissedEvent(events: TaskEvent[], taskId: string, today: string): TaskEvent[] {
  return events.filter(
    (e) => !(e.taskId === taskId && e.scheduledFor.startsWith(today) && e.status === 'missed'),
  );
}

function migrateTaskSchema(
  persistedState: unknown,
  version: number,
): { tasks: Task[]; events: TaskEvent[] } {
  const state = (persistedState ?? {}) as { tasks?: any[]; events?: TaskEvent[] };

  if (version < 1) {
    const migratedTasks: Task[] = (state.tasks ?? []).map((task: any) => {
      const { witnessName: _wn, witnessPhotoUri: _wp, ...rest } = task;
      return {
        ...rest,
        triggerType: (rest.triggerType ?? 'fixed_time') as TriggerType,
        firstUnlockWindow: rest.firstUnlockWindow ?? undefined,
        dismissAction: (rest.dismissAction ?? 'swipe') as DismissAction,
        nagInterval: (rest.nagInterval ?? 'off') as NagInterval,
        locationNote: rest.locationNote ?? undefined,
        weeklyGoal: rest.weeklyGoal ?? 7,
      } as Task;
    });
    return { tasks: migratedTasks, events: state.events ?? [] };
  }

  return { tasks: (state.tasks ?? []) as Task[], events: state.events ?? [] };
}

function stripLegacyMockData(tasks: Task[], events: TaskEvent[]): { tasks: Task[]; events: TaskEvent[] } {
  const filteredTasks = tasks.filter((t) => !t.id.startsWith(LEGACY_MOCK_PREFIX));
  const filteredEvents = events.filter(
    (e) => !e.id.startsWith(LEGACY_MOCK_PREFIX) && !e.taskId.startsWith(LEGACY_MOCK_PREFIX),
  );
  return { tasks: filteredTasks, events: filteredEvents };
}

const useTaskStoreBase = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      events: [],
      isLoading: false,

      addTask: (formData) => {
        const now = new Date().toISOString();
        const onboarding = useOnboardingStore.getState();
        const newTask: Task = {
          id: generateUUID(),
          userId: LOCAL_USER_ID,
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category!,
          reminderTime: formData.reminderTime,
          frequency: formData.frequency,
          frequencyDays: formData.frequencyDays.length > 0 ? formData.frequencyDays : undefined,
          customIntervalDays: formData.frequency === 'custom' ? formData.customIntervalDays : undefined,
          oneTimeDate: formData.frequency === 'once' ? formData.oneTimeDate : undefined,
          snoozeLimit: formData.snoozeLimit ?? onboarding.defaultSnoozeLimit,
          durationMinutes: formData.durationMinutes ?? undefined,
          requirePhotoProof: formData.requirePhotoProof,
          reminderSoundId: formData.reminderSoundId ?? undefined,
          triggerType: formData.triggerType,
          firstUnlockWindow: formData.firstUnlockWindow ?? undefined,
          dismissAction: formData.dismissAction,
          nagInterval: formData.nagInterval,
          locationNote: formData.locationNote.trim() || undefined,
          weeklyGoal: formData.weeklyGoal,
          isActive: true,
          isPaused: false,
          currentStreak: 0,
          longestStreak: 0,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
        return newTask;
      },

      updateTask: (taskId, updates) =>
        set((state) => {
          const tasks = state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t
          );
          return { tasks };
        }),

      deleteTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
          events: state.events.filter((e) => e.taskId !== taskId),
        }));
      },

      getTaskById: (taskId) => get().tasks.find((t) => t.id === taskId),

      addEvent: (eventData) => {
        const event: TaskEvent = {
          ...eventData,
          id: generateUUID(),
          createdAt: new Date().toISOString(),
        };
        if (eventData.status === 'in_progress') {
          const today = new Date().toISOString().split('T')[0];
          set((state) => ({
            events: [...filterOutMissedEvent(state.events, eventData.taskId, today), event],
          }));
        } else {
          set((state) => ({ events: [...state.events, event] }));
        }
      },

      completeTask: (taskId) => {
        const now = new Date().toISOString();
        const today = now.split('T')[0];

        const alreadyDone = get().events.some(
          (e) => e.taskId === taskId && e.scheduledFor.startsWith(today) && e.status === 'done'
        );
        if (alreadyDone) return 0;

        const event: TaskEvent = {
          id: generateUUID(),
          taskId,
          userId: LOCAL_USER_ID,
          scheduledFor: now,
          status: 'done',
          respondedAt: now,
          snoozeCount: 0,
          createdAt: now,
        };

        set((state) => ({
          events: [...filterOutMissedEvent(state.events, taskId, today), event],
        }));

        const updatedState = get();
        const task = updatedState.tasks.find((t) => t.id === taskId);
        if (!task) return 0;

        const newCurrentStreak = computeWeeklyStreak(updatedState.events, task);
        const computedLongest = computeLongestWeeklyStreak(updatedState.events, task);
        const newLongestStreak = Math.max(computedLongest, task.longestStreak, newCurrentStreak);

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, currentStreak: newCurrentStreak, longestStreak: newLongestStreak, updatedAt: now }
              : t
          ),
        }));

        useRatingStoreBase.getState().recordTaskCompletion();

        return newCurrentStreak;
      },

      undoTaskCompletion: (taskId) => {
        const now = new Date().toISOString();
        const today = now.split('T')[0];

        const hasDoneToday = get().events.some(
          (e) => e.taskId === taskId && e.scheduledFor.startsWith(today) && e.status === 'done',
        );
        if (!hasDoneToday) return false;

        set((state) => ({
          events: state.events.filter(
            (e) => !(e.taskId === taskId && e.scheduledFor.startsWith(today) && e.status === 'done'),
          ),
        }));

        const updatedState = get();
        const task = updatedState.tasks.find((t) => t.id === taskId);
        if (!task) return false;

        const newCurrentStreak = computeWeeklyStreak(updatedState.events, task);
        const newLongestStreak = Math.max(
          computeLongestWeeklyStreak(updatedState.events, task),
          task.longestStreak,
        );

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, currentStreak: newCurrentStreak, longestStreak: newLongestStreak, updatedAt: now }
              : t,
          ),
        }));

        return true;
      },

      snoozeTask: (taskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return false;

        const today = new Date().toISOString().split('T')[0];
        const todaySnoozes = get().events.filter(
          (e) => e.taskId === taskId && e.scheduledFor.startsWith(today) && e.status === 'snoozed'
        ).length;

        if (todaySnoozes >= task.snoozeLimit) return false;

        const now = new Date().toISOString();
        const event: TaskEvent = {
          id: generateUUID(),
          taskId,
          userId: LOCAL_USER_ID,
          scheduledFor: now,
          status: 'snoozed',
          respondedAt: now,
          snoozeCount: todaySnoozes + 1,
          createdAt: now,
        };

        set((state) => ({ events: [...state.events, event] }));
        return true;
      },

      struggleTask: (taskId, reason, note) => {
        const now = new Date().toISOString();
        const today = now.split('T')[0];
        const event: TaskEvent = {
          id: generateUUID(),
          taskId,
          userId: LOCAL_USER_ID,
          scheduledFor: now,
          status: 'struggled',
          respondedAt: now,
          snoozeCount: 0,
          strugglingReason: reason,
          strugglingNote: note,
          createdAt: now,
        };
        set((state) => ({
          events: [...filterOutMissedEvent(state.events, taskId, today), event],
        }));

        useRatingStoreBase.getState().recordStruggle();
      },

      markTaskMissed: (taskId) => {
        const now = new Date().toISOString();
        const today = now.split('T')[0];

        const alreadyHandled = get().events.some(
          (e) =>
            e.taskId === taskId &&
            e.scheduledFor.startsWith(today) &&
            (e.status === 'done' || e.status === 'struggled' || e.status === 'missed')
        );
        if (alreadyHandled) return;

        const event: TaskEvent = {
          id: generateUUID(),
          taskId,
          userId: LOCAL_USER_ID,
          scheduledFor: now,
          status: 'missed',
          snoozeCount: 0,
          createdAt: now,
        };
        set((state) => ({
          events: [...state.events, event],
        }));
      },

      getTodayTasks: () => get().tasks.filter((t) => t.isActive && !t.isPaused),

      getTaskEvents: (taskId) =>
        get().events.filter((e) => e.taskId === taskId),

      getCompletedTodayCount: () => {
        const today = new Date().toISOString().split('T')[0];
        const completedIds = new Set(
          get()
            .events.filter((e) => e.scheduledFor.startsWith(today) && e.status === 'done')
            .map((e) => e.taskId)
        );
        return completedIds.size;
      },

      getActiveTaskCount: () =>
        get().tasks.filter((t) => t.isActive && !t.isPaused).length,
    }),
    {
      name: 'showd-tasks',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState, version) => migrateTaskSchema(persistedState, version),
      partialize: (state) => ({
        tasks: state.tasks,
        events: state.events,
      }),
      merge: (persistedState, currentState) => {
        const typed = persistedState as Partial<TaskState> | undefined;
        const merged = {
          ...currentState,
          ...typed,
        };
        const cleaned = stripLegacyMockData(merged.tasks ?? [], merged.events ?? []);
        return {
          ...merged,
          tasks: cleaned.tasks,
          events: cleaned.events,
        };
      },
    },
  ),
);

// Export a wrapped hook for general use
export function useTaskStore<T>(selector: (state: TaskState) => T): T {
  return useTaskStoreBase(selector);
}

// Export stable selector hooks
export const useTasks = () => useTaskStoreBase(useShallow((s) => s.tasks));
export const useEvents = () => useTaskStoreBase(useShallow((s) => s.events));
export const useAddTask = () => useTaskStoreBase((s) => s.addTask);
export const useUpdateTask = () => useTaskStoreBase((s) => s.updateTask);
export const useDeleteTask = () => useTaskStoreBase((s) => s.deleteTask);
export const useGetTaskById = () => useTaskStoreBase((s) => s.getTaskById);
export const useGetTaskEvents = () => useTaskStoreBase((s) => s.getTaskEvents);
export const useCompleteTask = () => useTaskStoreBase((s) => s.completeTask);
export const useUndoTaskCompletion = () => useTaskStoreBase((s) => s.undoTaskCompletion);
export const useSnoozeTask = () => useTaskStoreBase((s) => s.snoozeTask);
export const useStruggleTask = () => useTaskStoreBase((s) => s.struggleTask);
export const useMarkTaskMissed = () => useTaskStoreBase((s) => s.markTaskMissed);
export const useAddEvent = () => useTaskStoreBase((s) => s.addEvent);
export const useGetActiveTaskCount = () => useTaskStoreBase((s) => s.getActiveTaskCount);

// Derived data hooks
export const useTodayTasks = () => useTaskStoreBase(useShallow((s) => s.tasks.filter((t) => t.isActive && !t.isPaused)));

export const useCompletedTodayCount = () => {
  const events = useTaskStoreBase(useShallow((s) => s.events));
  const today = new Date().toISOString().split('T')[0];
  const completedIds = new Set(
    events
      .filter((e) => e.scheduledFor.startsWith(today) && e.status === 'done')
      .map((e) => e.taskId)
  );
  return completedIds.size;
};
