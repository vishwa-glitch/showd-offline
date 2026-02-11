import AsyncStorage from '@react-native-async-storage/async-storage';
import * as db from './database';
import { dbToUser, dbToTask, dbToTaskEvent, dbToConnection } from '../utils/mappers';
import type { User } from '../types/user';
import type { Task, TaskEvent } from '../types/task';
import type { WitnessConnection } from '../types/witness';
import type { DbUser, DbTask, DbTaskEvent, DbWitnessConnection } from '../types/database';

const QUEUE_KEY = 'showd_offline_queue';

// ── Offline Queue ──

interface QueuedAction {
  id: string;
  type: 'upsert_user' | 'upsert_task' | 'delete_task' | 'upsert_event' | 'update_event' | 'upsert_connection' | 'delete_connection';
  payload: any;
  createdAt: string;
}

async function getQueue(): Promise<QueuedAction[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveQueue(queue: QueuedAction[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(action: Omit<QueuedAction, 'id' | 'createdAt'>) {
  const queue = await getQueue();
  queue.push({
    ...action,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  });
  await saveQueue(queue);
}

// ── Flush Queue (push pending mutations to cloud) ──

export async function flushQueue(): Promise<{ flushed: number; failed: number }> {
  const queue = await getQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0 };

  const remaining: QueuedAction[] = [];
  let flushed = 0;

  for (const action of queue) {
    try {
      await executeAction(action);
      flushed++;
    } catch {
      remaining.push(action);
    }
  }

  await saveQueue(remaining);
  return { flushed, failed: remaining.length };
}

async function executeAction(action: QueuedAction) {
  switch (action.type) {
    case 'upsert_user':
      await db.upsertUser(action.payload as User);
      break;
    case 'upsert_task':
      await db.upsertTask(action.payload as Task);
      break;
    case 'delete_task':
      await db.deleteDbTask(action.payload as string);
      break;
    case 'upsert_event':
      await db.insertEvent(action.payload as TaskEvent);
      break;
    case 'update_event': {
      const { id, updates } = action.payload as { id: string; updates: Partial<TaskEvent> };
      await db.updateEvent(id, updates);
      break;
    }
    case 'upsert_connection':
      await db.upsertConnection(action.payload as WitnessConnection);
      break;
    case 'delete_connection':
      await db.deleteConnection(action.payload as string);
      break;
  }
}

// ── Pull from Cloud ──

export interface CloudData {
  user: User | null;
  tasks: Task[];
  events: TaskEvent[];
  connections: WitnessConnection[];
}

export async function pullFromCloud(userId: string): Promise<CloudData> {
  const [userRes, tasksRes, connectionsRes] = await Promise.all([
    db.getUser(userId),
    db.getUserTasks(userId),
    db.getUserConnections(userId),
  ]);

  const tasks = ((tasksRes.data || []) as DbTask[]).map(dbToTask);
  const taskIds = tasks.map((t) => t.id);

  let events: TaskEvent[] = [];
  if (taskIds.length > 0) {
    const eventsRes = await db.getEventsByTaskIds(taskIds);
    events = ((eventsRes.data || []) as DbTaskEvent[]).map(dbToTaskEvent);
  }

  return {
    user: userRes.data ? dbToUser(userRes.data as DbUser) : null,
    tasks,
    events,
    connections: ((connectionsRes.data || []) as DbWitnessConnection[]).map(dbToConnection),
  };
}

// ── Push single items (fire-and-forget from stores) ──

export async function pushUser(user: User) {
  try {
    await db.upsertUser(user);
  } catch {
    await enqueue({ type: 'upsert_user', payload: user });
  }
}

export async function pushTask(task: Task) {
  try {
    await db.upsertTask(task);
  } catch {
    await enqueue({ type: 'upsert_task', payload: task });
  }
}

export async function pushDeleteTask(taskId: string) {
  try {
    await db.deleteDbTask(taskId);
  } catch {
    await enqueue({ type: 'delete_task', payload: taskId });
  }
}

export async function pushEvent(event: TaskEvent) {
  try {
    await db.insertEvent(event);
  } catch {
    await enqueue({ type: 'upsert_event', payload: event });
  }
}

export async function pushEventUpdate(id: string, updates: Partial<TaskEvent>) {
  try {
    await db.updateEvent(id, updates);
  } catch {
    await enqueue({ type: 'update_event', payload: { id, updates } });
  }
}

export async function pushConnection(conn: WitnessConnection) {
  try {
    await db.upsertConnection(conn);
  } catch {
    await enqueue({ type: 'upsert_connection', payload: conn });
  }
}

export async function pushDeleteConnection(id: string) {
  try {
    await db.deleteConnection(id);
  } catch {
    await enqueue({ type: 'delete_connection', payload: id });
  }
}
