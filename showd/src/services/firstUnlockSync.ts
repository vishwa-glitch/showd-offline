import { NativeModules } from 'react-native'
import type { Task, TaskEvent } from '../types/task'

const { FirstUnlockModule } = NativeModules

interface FirstUnlockTaskPayload {
  taskId: string
  name: string
  startTime: string
  endTime: string
  lastFiredDate: string
}

function getTodayLocalKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getEventDateLocal(isoString: string): string {
  const date = new Date(isoString)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Mirror active first-unlock tasks into Android SharedPreferences so the
 * native UserPresentReceiver can read them without touching JS state.
 * Computes lastFiredDate from event history to prevent double-firing.
 */
export async function syncFirstUnlockTasks(
  tasks: Task[],
  events: TaskEvent[],
): Promise<void> {
  if (!FirstUnlockModule) return

  const today = getTodayLocalKey()

  const respondedToday = new Set<string>()
  for (const e of events) {
    if (e.status === 'pending') continue
    if (getEventDateLocal(e.respondedAt ?? e.scheduledFor) === today) {
      respondedToday.add(e.taskId)
    }
  }

  const payload: FirstUnlockTaskPayload[] = tasks
    .filter(
      (t) =>
        t.triggerType === 'first_unlock' &&
        t.isActive &&
        !t.isPaused &&
        t.firstUnlockWindow != null,
    )
    .map((t) => ({
      taskId: t.id,
      name: t.name,
      startTime: t.firstUnlockWindow!.startTime,
      endTime: t.firstUnlockWindow!.endTime,
      lastFiredDate: respondedToday.has(t.id) ? today : '',
    }))

  console.log('[FirstUnlock] syncTasks payload:', JSON.stringify(payload, null, 2))
  try {
    await FirstUnlockModule.syncTasks(payload)
    console.log('[FirstUnlock] syncTasks succeeded — wrote', payload.length, 'task(s)')
  } catch (e) {
    console.error('[FirstUnlock] syncTasks failed', e)
  }
}

/**
 * Cold-start handler: reads any taskId the native receiver stored when it
 * fired a notification while the app was killed. Prefers the live launch
 * intent extra; falls back to SharedPreferences.
 * Consumes the value so a second call returns null.
 */
export async function consumePendingFirstUnlockTaskId(): Promise<string | null> {
  if (!FirstUnlockModule) return null
  try {
    const launchId: string | null = await FirstUnlockModule.getLaunchTaskId()
    if (launchId) {
      console.log('[FirstUnlock] consumePending — found launchId:', launchId)
      return launchId
    }
    const pendingId: string | null = await FirstUnlockModule.consumePendingTaskId()
    console.log('[FirstUnlock] consumePending — SharedPrefs taskId:', pendingId ?? 'null')
    return pendingId
  } catch (e) {
    console.error('[FirstUnlock] consumePending failed', e)
    return null
  }
}

/**
 * Navigate the user to the OEM-specific autostart/battery-optimization
 * settings screen. Returns true if an OEM-specific screen was opened,
 * false if the generic app-details screen was used as a fallback.
 */
export async function openAutoStartSettings(): Promise<boolean> {
  if (!FirstUnlockModule) return false
  try {
    return await FirstUnlockModule.openAutoStartSettings()
  } catch {
    return false
  }
}
