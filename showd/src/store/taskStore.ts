import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Task, TaskEvent, TaskFormData } from '../types/task';

interface TaskState {
  tasks: Task[];
  events: TaskEvent[];
  isLoading: boolean;

  addTask: (formData: TaskFormData, userId: string) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  getTaskById: (taskId: string) => Task | undefined;

  addEvent: (event: Omit<TaskEvent, 'id' | 'createdAt'>) => void;
  completeTask: (taskId: string) => number;
  snoozeTask: (taskId: string) => boolean;
  struggleTask: (taskId: string, reason: string, note?: string) => void;
  markTaskMissed: (taskId: string) => void;

  getTodayTasks: () => Task[];
  getTaskEvents: (taskId: string) => TaskEvent[];
  getCompletedTodayCount: () => number;
}

const generateId = () =>
  `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const useTaskStoreBase = create<TaskState>((set, get) => ({
  tasks: [],
  events: [],
  isLoading: false,

  addTask: (formData, userId) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: generateId(),
      userId,
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category!,
      reminderTime: formData.reminderTime,
      frequency: formData.frequency,
      frequencyDays: formData.frequencyDays.length > 0 ? formData.frequencyDays : undefined,
      customIntervalDays: formData.frequency === 'custom' ? formData.customIntervalDays : undefined,
      oneTimeDate: formData.frequency === 'once' ? formData.oneTimeDate : undefined,
      snoozeLimit: formData.snoozeLimit,
      durationMinutes: formData.durationMinutes ?? undefined,
      accountabilityType: formData.accountabilityType,
      witnessPhone: formData.witnessPhone || undefined,
      witnessName: formData.witnessName || undefined,
      witnessRelationship: formData.witnessRelationship || undefined,
      personalWitnessName: formData.personalWitnessName || undefined,
      isActive: true,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    return newTask;
  },

  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, ...updates, updatedAt: new Date().toISOString() }
          : t
      ),
    })),

  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      events: state.events.filter((e) => e.taskId !== taskId),
    })),

  getTaskById: (taskId) => get().tasks.find((t) => t.id === taskId),

  addEvent: (eventData) => {
    const event: TaskEvent = {
      ...eventData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ events: [...state.events, event] }));
  },

  completeTask: (taskId) => {
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    // Check if already completed today
    const alreadyDone = get().events.some(
      (e) => e.taskId === taskId && e.scheduledFor.startsWith(today) && e.status === 'done'
    );
    if (alreadyDone) return 0;

    const task = get().tasks.find((t) => t.id === taskId);
    const newStreak = (task?.currentStreak || 0) + 1;

    const event: TaskEvent = {
      id: generateId(),
      taskId,
      scheduledFor: now,
      status: 'done',
      respondedAt: now,
      snoozeCount: 0,
      createdAt: now,
    };

    set((state) => ({
      events: [...state.events, event],
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
            ...t,
            currentStreak: newStreak,
            longestStreak: Math.max(t.longestStreak, newStreak),
            updatedAt: now,
          }
          : t
      ),
    }));

    return newStreak;
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
      id: generateId(),
      taskId,
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
    const event: TaskEvent = {
      id: generateId(),
      taskId,
      scheduledFor: now,
      status: 'struggled',
      respondedAt: now,
      snoozeCount: 0,
      strugglingReason: reason,
      strugglingNote: note,
      createdAt: now,
    };
    set((state) => ({
      events: [...state.events, event],
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, currentStreak: 0, updatedAt: now } : t
      ),
    }));
  },

  markTaskMissed: (taskId) => {
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    // Don't double-mark
    const alreadyHandled = get().events.some(
      (e) =>
        e.taskId === taskId &&
        e.scheduledFor.startsWith(today) &&
        (e.status === 'done' || e.status === 'struggled' || e.status === 'missed')
    );
    if (alreadyHandled) return;

    const event: TaskEvent = {
      id: generateId(),
      taskId,
      scheduledFor: now,
      status: 'missed',
      snoozeCount: 0,
      createdAt: now,
    };
    set((state) => ({
      events: [...state.events, event],
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, currentStreak: 0, updatedAt: now } : t
      ),
    }));
  },

  getTodayTasks: () => get().tasks.filter((t) => t.isActive),

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
}));

// Export a wrapped hook for general use
// NOTE: For selecting primitives or single functions, use the stable hooks below instead
export function useTaskStore<T>(selector: (state: TaskState) => T): T {
  return useTaskStoreBase(selector);
}

// Export stable selector hooks for common use cases
// For arrays, we use useShallow to ensure referential stability
export const useTasks = () => useTaskStoreBase(useShallow((s) => s.tasks));
export const useEvents = () => useTaskStoreBase(useShallow((s) => s.events));
export const useAddTask = () => useTaskStoreBase((s) => s.addTask);
export const useUpdateTask = () => useTaskStoreBase((s) => s.updateTask);
export const useDeleteTask = () => useTaskStoreBase((s) => s.deleteTask);
export const useGetTaskById = () => useTaskStoreBase((s) => s.getTaskById);
export const useGetTaskEvents = () => useTaskStoreBase((s) => s.getTaskEvents);
export const useCompleteTask = () => useTaskStoreBase((s) => s.completeTask);
export const useSnoozeTask = () => useTaskStoreBase((s) => s.snoozeTask);
export const useStruggleTask = () => useTaskStoreBase((s) => s.struggleTask);
export const useMarkTaskMissed = () => useTaskStoreBase((s) => s.markTaskMissed);
export const useAddEvent = () => useTaskStoreBase((s) => s.addEvent);

// Derived data hooks — these subscribe to the underlying data so they re-render
// Using useShallow for array-returning selectors to ensure referential stability
export const useTodayTasks = () => useTaskStoreBase(useShallow((s) => s.tasks.filter((t) => t.isActive)));

// For primitive values, we compute in a stable way that doesn't create new refs
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
