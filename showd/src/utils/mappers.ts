import type { User } from '../types/user';
import type { Task, TaskEvent, TaskCategory, TaskFrequency, AccountabilityType, TaskEventStatus } from '../types/task';
import type { WitnessConnection, ConnectionStatus, NotificationPreference } from '../types/witness';
import type { DbUser, DbTask, DbTaskEvent, DbWitnessConnection } from '../types/database';

// ── User ──

export function userToDb(user: User): Partial<DbUser> {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    profile_photo_url: user.profilePhotoUrl ?? null,
    timezone: user.timezone,
    quiet_hours_enabled: user.quietHoursEnabled,
    quiet_hours_start: user.quietHoursStart ?? null,
    quiet_hours_end: user.quietHoursEnd ?? null,
    default_snooze_limit: user.defaultSnoozeLimit,
    is_guest: user.isGuest,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export function dbToUser(row: DbUser): User {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    profilePhotoUrl: row.profile_photo_url ?? undefined,
    timezone: row.timezone,
    quietHoursEnabled: row.quiet_hours_enabled,
    quietHoursStart: row.quiet_hours_start ?? undefined,
    quietHoursEnd: row.quiet_hours_end ?? undefined,
    defaultSnoozeLimit: row.default_snooze_limit,
    isGuest: row.is_guest,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Task ──

export function taskToDb(task: Task): Partial<DbTask> {
  return {
    id: task.id,
    user_id: task.userId,
    name: task.name,
    description: task.description ?? null,
    category: task.category,
    reminder_time: task.reminderTime,
    frequency: task.frequency,
    frequency_days: task.frequencyDays ?? null,
    custom_interval_days: task.customIntervalDays ?? null,
    one_time_date: task.oneTimeDate ?? null,
    snooze_limit: task.snoozeLimit,
    duration_minutes: task.durationMinutes ?? null,
    accountability_type: task.accountabilityType,
    witness_phone: task.witnessPhone ?? null,
    witness_name: task.witnessName ?? null,
    witness_relationship: task.witnessRelationship ?? null,
    witness_connection_id: task.witnessConnectionId ?? null,
    personal_witness_name: task.personalWitnessName ?? null,
    personal_witness_photo_url: task.personalWitnessPhotoUrl ?? null,
    is_active: task.isActive,
    current_streak: task.currentStreak,
    longest_streak: task.longestStreak,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  };
}

export function dbToTask(row: DbTask): Task {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    category: row.category as TaskCategory,
    reminderTime: row.reminder_time,
    frequency: row.frequency as TaskFrequency,
    frequencyDays: row.frequency_days ?? undefined,
    customIntervalDays: row.custom_interval_days ?? undefined,
    oneTimeDate: row.one_time_date ?? undefined,
    snoozeLimit: row.snooze_limit,
    durationMinutes: row.duration_minutes ?? undefined,
    accountabilityType: row.accountability_type as AccountabilityType,
    witnessPhone: row.witness_phone ?? undefined,
    witnessName: row.witness_name ?? undefined,
    witnessRelationship: row.witness_relationship ?? undefined,
    witnessConnectionId: row.witness_connection_id ?? undefined,
    personalWitnessName: row.personal_witness_name ?? undefined,
    personalWitnessPhotoUrl: row.personal_witness_photo_url ?? undefined,
    isActive: row.is_active,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── TaskEvent ──

export function taskEventToDb(event: TaskEvent): Partial<DbTaskEvent> {
  return {
    id: event.id,
    task_id: event.taskId,
    scheduled_for: event.scheduledFor,
    status: event.status,
    responded_at: event.respondedAt ?? null,
    snooze_count: event.snoozeCount,
    struggling_reason: event.strugglingReason ?? null,
    struggling_note: event.strugglingNote ?? null,
    started_at: event.startedAt ?? null,
    completed_at: event.completedAt ?? null,
    paused_duration_seconds: event.pausedDurationSeconds ?? null,
    actual_duration_seconds: event.actualDurationSeconds ?? null,
    original_duration_minutes: event.originalDurationMinutes ?? null,
    extensions_used: event.extensionsUsed ?? null,
    total_extension_seconds: event.totalExtensionSeconds ?? null,
    timer_completed: event.timerCompleted ?? null,
    created_at: event.createdAt,
  };
}

export function dbToTaskEvent(row: DbTaskEvent): TaskEvent {
  return {
    id: row.id,
    taskId: row.task_id,
    scheduledFor: row.scheduled_for,
    status: row.status as TaskEventStatus,
    respondedAt: row.responded_at ?? undefined,
    snoozeCount: row.snooze_count,
    strugglingReason: row.struggling_reason ?? undefined,
    strugglingNote: row.struggling_note ?? undefined,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    pausedDurationSeconds: row.paused_duration_seconds ?? undefined,
    actualDurationSeconds: row.actual_duration_seconds ?? undefined,
    originalDurationMinutes: row.original_duration_minutes ?? undefined,
    extensionsUsed: row.extensions_used ?? undefined,
    totalExtensionSeconds: row.total_extension_seconds ?? undefined,
    timerCompleted: row.timer_completed ?? undefined,
    createdAt: row.created_at,
  };
}

// ── WitnessConnection ──

export function connectionToDb(conn: WitnessConnection): Partial<DbWitnessConnection> {
  return {
    id: conn.id,
    task_id: conn.taskId,
    task_doer_id: conn.taskDoerId,
    task_doer_name: conn.taskDoerName,
    witness_phone: conn.witnessPhone,
    witness_name: conn.witnessName,
    witness_user_id: conn.witnessUserId ?? null,
    invite_token: conn.inviteToken,
    status: conn.status,
    notification_preference: conn.notificationPreference,
    invited_at: conn.invitedAt,
    follow_up_sent_at: conn.followUpSentAt ?? null,
    accepted_at: conn.acceptedAt ?? null,
    declined_at: conn.declinedAt ?? null,
  };
}

export function dbToConnection(row: DbWitnessConnection): WitnessConnection {
  return {
    id: row.id,
    taskId: row.task_id,
    taskDoerId: row.task_doer_id,
    taskDoerName: row.task_doer_name,
    witnessPhone: row.witness_phone,
    witnessName: row.witness_name,
    witnessUserId: row.witness_user_id ?? undefined,
    inviteToken: row.invite_token,
    status: row.status as ConnectionStatus,
    notificationPreference: row.notification_preference as NotificationPreference,
    invitedAt: row.invited_at,
    followUpSentAt: row.follow_up_sent_at ?? undefined,
    acceptedAt: row.accepted_at ?? undefined,
    declinedAt: row.declined_at ?? undefined,
  };
}
