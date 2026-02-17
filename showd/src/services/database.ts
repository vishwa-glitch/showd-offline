import { supabase } from './supabase';
import { userToDb, taskToDb, taskEventToDb, connectionToDb } from '../utils/mappers';
import type { User } from '../types/user';
import type { Task, TaskEvent } from '../types/task';
import type { WitnessConnection } from '../types/witness';
import type { DbUser } from '../types/database';

// ── Users ──

export async function getUser(id: string) {
  return supabase.from('users').select('*').eq('id', id).single();
}

export async function upsertUser(user: User) {
  const row = userToDb(user);
  return supabase.from('users').upsert(row as any).select().single();
}

export async function updateUserFields(userId: string, updates: Partial<DbUser>) {
  return supabase.from('users').update(updates).eq('id', userId);
}

// ── Tasks ──

export async function getUserTasks(userId: string) {
  return supabase.from('tasks').select('*').eq('user_id', userId);
}

export async function upsertTask(task: Task) {
  const row = taskToDb(task);
  return supabase.from('tasks').upsert(row as any).select().single();
}

export async function deleteDbTask(taskId: string) {
  return supabase.from('tasks').delete().eq('id', taskId);
}

// ── Task Events ──

export async function getUserEvents(userId: string) {
  return supabase
    .from('task_events')
    .select('*')
    .eq('user_id', userId);
}

export async function getEventsByTaskIds(taskIds: readonly string[]) {
  return supabase
    .from('task_events')
    .select('*')
    .in('task_id', taskIds as string[]);
}

export async function insertEvent(event: TaskEvent) {
  const row = taskEventToDb(event);
  return supabase.from('task_events').insert(row as any).select().single();
}

export async function updateEvent(id: string, updates: Partial<TaskEvent>) {
  const partial: Record<string, unknown> = {};
  if (updates.status !== undefined) partial.status = updates.status;
  if (updates.respondedAt !== undefined) partial.responded_at = updates.respondedAt;
  if (updates.snoozeCount !== undefined) partial.snooze_count = updates.snoozeCount;
  if (updates.strugglingReason !== undefined) partial.struggling_reason = updates.strugglingReason;
  if (updates.strugglingNote !== undefined) partial.struggling_note = updates.strugglingNote;
  if (updates.startedAt !== undefined) partial.started_at = updates.startedAt;
  if (updates.completedAt !== undefined) partial.completed_at = updates.completedAt;
  if (updates.pausedDurationSeconds !== undefined) partial.paused_duration_seconds = updates.pausedDurationSeconds;
  if (updates.actualDurationSeconds !== undefined) partial.actual_duration_seconds = updates.actualDurationSeconds;
  if (updates.extensionsUsed !== undefined) partial.extensions_used = updates.extensionsUsed;
  if (updates.totalExtensionSeconds !== undefined) partial.total_extension_seconds = updates.totalExtensionSeconds;
  if (updates.timerCompleted !== undefined) partial.timer_completed = updates.timerCompleted;
  if (updates.proofPhotoUrl !== undefined) partial.proof_photo_url = updates.proofPhotoUrl;

  return supabase.from('task_events').update(partial as any).eq('id', id).select().single();
}

// ── Witness Connections ──

export async function getUserConnections(userId: string) {
  return supabase.from('witness_connections').select('*').eq('task_doer_id', userId);
}

export async function upsertConnection(conn: WitnessConnection) {
  const row = connectionToDb(conn);
  return supabase.from('witness_connections').upsert(row as any).select().single();
}

export async function deleteConnection(id: string) {
  return supabase.from('witness_connections').delete().eq('id', id);
}

// ── SMS Log ──

export async function insertSmsLog(log: {
  witness_connection_id?: string;
  type: string;
  to_phone: string;
  message_body: string;
  twilio_message_sid?: string;
  segment_count?: number;
  cost_usd?: number;
}) {
  return supabase.from('sms_log').insert(log as any).select().single();
}
