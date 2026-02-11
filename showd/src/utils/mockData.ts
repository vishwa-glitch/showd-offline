/**
 * Demo mode mock data seeding.
 * Generates a demo user "Alex", 6 tasks across categories,
 * 14 days of realistic event history, and 2 witness connections.
 */
import type { User } from '../types/user';
import type { Task, TaskEvent, TaskEventStatus } from '../types/task';
import type { WitnessConnection } from '../types/witness';

const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// --- Demo user ---
export const DEMO_USER: User = {
  id: 'demo-user-001',
  phone: '+15551234567',
  name: 'Alex',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  quietHoursEnabled: false,
  defaultSnoozeLimit: 3,
  isGuest: false,
  createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
};

// --- 6 Demo tasks ---
function makeTasks(userId: string): Task[] {
  const now = new Date();
  const created = new Date(now.getTime() - 14 * 86400000).toISOString();

  return [
    {
      id: 'task-morning-meds',
      userId,
      name: 'Take morning meds',
      category: 'medication',
      reminderTime: '08:00',
      frequency: 'daily',
      snoozeLimit: 2,
      accountabilityType: 'real',
      witnessPhone: '+15559876543',
      witnessName: 'Mom',
      witnessRelationship: 'Parent',
      witnessConnectionId: 'conn-mom',
      isActive: true,
      currentStreak: 5,
      longestStreak: 12,
      createdAt: created,
      updatedAt: now.toISOString(),
    },
    {
      id: 'task-gym',
      userId,
      name: '30-min workout',
      description: 'At least 30 minutes of cardio or weights',
      category: 'exercise',
      reminderTime: '07:00',
      frequency: 'weekly',
      frequencyDays: [1, 3, 5], // Mon, Wed, Fri
      snoozeLimit: 3,
      durationMinutes: 30,
      accountabilityType: 'real',
      witnessPhone: '+15551112222',
      witnessName: 'Jordan',
      witnessRelationship: 'Friend',
      witnessConnectionId: 'conn-jordan',
      isActive: true,
      currentStreak: 3,
      longestStreak: 8,
      createdAt: created,
      updatedAt: now.toISOString(),
    },
    {
      id: 'task-journal',
      userId,
      name: 'Evening journal',
      description: 'Write 3 things I am grateful for',
      category: 'self_care',
      reminderTime: '21:00',
      frequency: 'daily',
      snoozeLimit: 3,
      accountabilityType: 'personal',
      personalWitnessName: 'Future Me',
      isActive: true,
      currentStreak: 2,
      longestStreak: 7,
      createdAt: created,
      updatedAt: now.toISOString(),
    },
    {
      id: 'task-read',
      userId,
      name: 'Read for 20 minutes',
      category: 'habit',
      reminderTime: '20:00',
      frequency: 'daily',
      snoozeLimit: 2,
      durationMinutes: 20,
      accountabilityType: 'none',
      isActive: true,
      currentStreak: 0,
      longestStreak: 5,
      createdAt: created,
      updatedAt: now.toISOString(),
    },
    {
      id: 'task-standup',
      userId,
      name: 'Team standup prep',
      description: 'Review yesterday + plan today',
      category: 'work',
      reminderTime: '09:30',
      frequency: 'weekly',
      frequencyDays: [1, 2, 3, 4, 5], // Weekdays
      snoozeLimit: 1,
      accountabilityType: 'none',
      isActive: true,
      currentStreak: 4,
      longestStreak: 10,
      createdAt: created,
      updatedAt: now.toISOString(),
    },
    {
      id: 'task-water',
      userId,
      name: 'Drink 8 glasses of water',
      category: 'self_care',
      reminderTime: '12:00',
      frequency: 'daily',
      snoozeLimit: 3,
      accountabilityType: 'none',
      isActive: true,
      currentStreak: 1,
      longestStreak: 14,
      createdAt: created,
      updatedAt: now.toISOString(),
    },
  ];
}

// --- 14 days of event history ---
function makeEvents(tasks: Task[]): TaskEvent[] {
  const events: TaskEvent[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const day = new Date(today.getTime() - daysAgo * 86400000);
    const dayOfWeek = day.getDay(); // 0=Sun, 1=Mon, ...

    for (const task of tasks) {
      // Check if task is scheduled for this day
      if (task.frequency === 'weekly' && task.frequencyDays) {
        if (!task.frequencyDays.includes(dayOfWeek)) continue;
      }

      // Skip today — leave tasks as pending (no events)
      if (daysAgo === 0) continue;

      const status = pickStatus(task.id, daysAgo);
      const scheduledTime = task.reminderTime.split(':');
      const scheduledFor = new Date(day);
      scheduledFor.setHours(parseInt(scheduledTime[0], 10), parseInt(scheduledTime[1], 10));

      const event: TaskEvent = {
        id: generateUUID(),
        taskId: task.id,
        scheduledFor: scheduledFor.toISOString(),
        status,
        snoozeCount: status === 'snoozed' ? 1 : 0,
        createdAt: scheduledFor.toISOString(),
      };

      if (status === 'done' || status === 'struggled') {
        const respondDelay = 5 + Math.floor(Math.random() * 30); // 5-35 min later
        event.respondedAt = new Date(scheduledFor.getTime() + respondDelay * 60000).toISOString();
      }

      if (status === 'struggled') {
        const reasons = ['Feeling unwell', 'Too busy', 'Forgot', 'Low energy'];
        event.strugglingReason = reasons[Math.floor(Math.random() * reasons.length)];
      }

      events.push(event);
    }
  }

  return events;
}

/**
 * Deterministic-ish status picker to create a realistic distribution.
 * ~70% done, ~10% missed, ~10% struggled, ~10% snoozed
 */
function pickStatus(taskId: string, daysAgo: number): TaskEventStatus {
  const hash = simpleHash(`${taskId}-${daysAgo}`);
  const bucket = hash % 100;

  if (bucket < 70) return 'done';
  if (bucket < 80) return 'missed';
  if (bucket < 90) return 'struggled';
  return 'done'; // snoozed events don't show in history well, use done
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return Math.abs(hash);
}

// --- 2 Witness connections ---
function makeConnections(userId: string, userName: string): WitnessConnection[] {
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();

  return [
    {
      id: 'conn-mom',
      taskId: 'task-morning-meds',
      taskDoerId: userId,
      taskDoerName: userName,
      witnessPhone: '+15559876543',
      witnessName: 'Mom',
      inviteToken: 'ABC123',
      status: 'active',
      notificationPreference: 'daily',
      invitedAt: twoWeeksAgo,
      acceptedAt: new Date(Date.now() - 13 * 86400000).toISOString(),
    },
    {
      id: 'conn-jordan',
      taskId: 'task-gym',
      taskDoerId: userId,
      taskDoerName: userName,
      witnessPhone: '+15551112222',
      witnessName: 'Jordan',
      inviteToken: 'XYZ789',
      status: 'invited',
      notificationPreference: 'alerts_only',
      invitedAt: twoDaysAgo,
    },
  ];
}

// --- Public API ---

export interface MockDataSet {
  user: User;
  tasks: Task[];
  events: TaskEvent[];
  connections: WitnessConnection[];
}

export function generateMockData(): MockDataSet {
  const user = DEMO_USER;
  const tasks = makeTasks(user.id);
  const events = makeEvents(tasks);
  const connections = makeConnections(user.id, user.name);
  return { user, tasks, events, connections };
}
