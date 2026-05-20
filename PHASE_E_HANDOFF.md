# Phase E Handoff — Showd Mobile App

Generated: 2026-05-16  
App root: `D:\showd-mobile-app\showd\` (all `npm`, `npx`, `tsc` commands run from here)

---

## 1. Files Created or Modified in Phases A–D

### Phase A — Data Model & Defaults Foundation

| File | What it does |
|------|-------------|
| `src/types/task.ts` | Added `TriggerType`, `DismissAction`, `NagInterval`, `FirstUnlockWindow` types; removed `witnessName`/`witnessPhotoUri` from `Task` and `TaskFormData`; added `triggerType`, `firstUnlockWindow`, `dismissAction`, `nagInterval`, `locationNote`, `weeklyGoal` to both; added `getDefaultFormData()` function (Phase C added this) |
| `src/store/onboardingStore.ts` | Added `defaultDismissAction`, `defaultNagInterval`, `defaultWeeklyGoal` fields with v0→v1 migration; exposed `useOnboardingStore` (the store base) for `getState()` access from taskStore |
| `src/store/taskStore.ts` | Added `migrateTaskSchema()` to strip witness fields and backfill new fields on upgrade; updated `addTask` to pull defaults from `onboardingStore.getState()`; bumped persist version to 1 |
| `src/components/task/TaskForm.tsx` | Removed witness photo section entirely |
| `src/components/reminder/FullScreenReminder.tsx` | Removed witness name/photo from motivation circle; replaced with plain bell icon |
| `src/screens/modals/CreateTaskScreen.tsx` | Removed `showWitnessPhotoOptionalHint` prop |
| `src/screens/modals/EditTaskScreen.tsx` | Removed witness fields from `initialData` mapping and `handleSubmit` |
| `src/services/notifications.ts` | Hardcoded body to `'Time to show up for yourself'`; removed witness fields from notification `data` payload |

### Phase B — Streak Engine Rewrite

| File | What it does |
|------|-------------|
| `src/utils/dateUtils.ts` | Added `startOfWeek`, `endOfWeek`, `getWeekKey`, `getCurrentWeekKey`, `getWeeklyCompletionCount`, `getCurrentWeekProgress`, `isWeekSuccessful`, `computeWeeklyStreak`, `computeLongestWeeklyStreak` — all weekly-goal-based; non-daily tasks fall back to stored `currentStreak`/`longestStreak` |
| `src/store/taskStore.ts` | Rewrote `completeTask` with two-set pattern (add event → `get()` → write streak); same for `undoTaskCompletion`; removed streak resets from `markTaskMissed` and `struggleTask` |
| `src/components/task/QuickStatsRow.tsx` | Sources tasks and events internally via hooks; computes `bestStreak` across all tasks using `computeLongestWeeklyStreak`; label changed to "Best streak (wk)" |
| `src/screens/main/TodayScreen.tsx` | Removed `maxStreak` local computation; `QuickStatsRow` no longer receives a streak prop |
| `src/screens/main/ProgressScreen.tsx` | Added `computeWeeklyStreak`/`computeLongestWeeklyStreak` imports; streak banner uses week-based values wrapped in `useMemo`; label "Best streak (wk)" |
| `src/screens/main/TaskDetailScreen.tsx` | Streak card shows current + longest with "(wk)" suffix; daily tasks also show "This week: N of M days" progress line |

### Phase C — Calendar Timezone Fix + Form Redesign

| File | What it does |
|------|-------------|
| `src/utils/dateUtils.ts` | Fixed `isOnDate` timezone bug — now converts ISO string to local date via `isoToLocalDateString` before comparing, so events near midnight don't appear on the wrong calendar day |
| `src/types/task.ts` | Added `getDefaultFormData()` — lazy-`require`s `onboardingStore` to pull user's default snooze/dismiss/nag/weeklyGoal values without creating a circular import |
| `src/screens/modals/CreateTaskScreen.tsx` | Passes `initialData={getDefaultFormData()}` to `TaskForm` so new tasks start with the user's persisted preference defaults |
| `src/components/task/TaskForm.tsx` | Full redesign: trigger type toggle (Fixed Time / First Unlock), conditional reminder-time picker vs. first-unlock window pickers, "More options" expandable section containing locationNote input, dismissAction chips, nagInterval chips, weeklyGoal stepper (daily only), snooze stepper, reminder sound row |
| `src/screens/modals/EditTaskScreen.tsx` | Added `triggerType`, `firstUnlockWindow`, `dismissAction`, `nagInterval`, `locationNote`, `weeklyGoal` to both `initialData` and `handleSubmit → updateTask` call |

### Phase D — Full-Screen Reminder Rewrite

| File | What it does |
|------|-------------|
| `src/components/reminder/FullScreenReminder.tsx` | Full rewrite: shows last-done timestamp, location note pill, math/shake challenge gates on primary action, single-tap "Not today", auto-nag `setInterval` per `task.nagInterval`; suppresses nag during math/shake and when focus timer is active for the same task |
| `src/components/reminder/ReminderOverlay.tsx` | Removed `StrugglingSheet` import and render block; now only orchestrates `FullScreenReminder`, `SuccessAnimation`, `PostTimerCompletion`, `RatingPromptSheet` |
| `src/components/reminder/StrugglingSheet.tsx` | **Deleted** — no longer referenced anywhere |
| `src/store/reminderStore.ts` | Removed `showStrugglingSheet`, `openStrugglingSheet`, `closeStrugglingSheet`; store now only manages pending queue, active task, snooze counts, and success animation |
| `src/utils/dateUtils.ts` | Added `getLastDoneEvent`, `formatLastDone`, `getLastDoneTime` — used by reminder to display "Last done: Today at 8:14 AM" |
| `src/screens/main/FocusTimerScreen.tsx` | Replaced "Struggling" button with single-tap "Not today" link — calls `struggleTask(taskId, 'not_today', undefined)` → `abandonTimer()` → `navigation.goBack()`, no modal |
| `package.json` | Added `expo-sensors ~15.0.8` for accelerometer shake detection |

---

## 2. Current State of Specific Files

### `android/app/src/main/java/com/showd/app/MainApplication.kt`

**This file does not exist in the repository.** The project uses Expo managed workflow — the Android native directory is generated at build time (`npx expo run:android` or EAS Build). The `plugins/withNotifee.js` config plugin patches `MainApplication.kt` (or `.java`) during build to register `ShowdFullScreenIntentPackage`. The relevant patch function inside that plugin is `patchMainApplicationKotlin`, which injects:

```kotlin
import com.showd.app.ShowdFullScreenIntentPackage
// ... inside getPackages():
packages.add(ShowdFullScreenIntentPackage())
```

The exact Android package name is `com.showd.app` (matches `app.json → android.package`).

### `app.json` — plugins array

```json
"plugins": [
  "expo-font",
  "@react-native-community/datetimepicker",
  [
    "expo-build-properties",
    {
      "android": {
        "compileSdkVersion": 35,
        "targetSdkVersion": 35,
        "minSdkVersion": 24
      }
    }
  ],
  "expo-audio",
  "./plugins/withNotifee.js",
  "expo-asset"
]
```

`./plugins/withNotifee.js` is a custom Expo config plugin that:
- Copies reminder sound MP3 files into `android/app/src/main/res/raw/`
- Writes `ShowdFullScreenIntent.java` (native module) into the Android source tree
- Patches `MainApplication.kt`/`.java` to register `ShowdFullScreenIntentPackage`
- Patches `AndroidManifest.xml` for permissions

### `src/types/task.ts` — `triggerType` and `firstUnlockWindow` fields

In the `Task` interface:
```typescript
triggerType: TriggerType;           // 'fixed_time' | 'first_unlock'
firstUnlockWindow?: FirstUnlockWindow;  // only set when triggerType === 'first_unlock'
```

In the `TaskFormData` interface:
```typescript
triggerType: TriggerType;
firstUnlockWindow: FirstUnlockWindow | null;  // null = not set (form state)
```

Supporting types:
```typescript
export type TriggerType = 'fixed_time' | 'first_unlock';

export interface FirstUnlockWindow {
  startTime: string;  // "HH:MM" in 24h format, e.g. "08:00"
  endTime: string;    // "HH:MM" in 24h format, e.g. "10:00"
}
```

Default in `DEFAULT_FORM_DATA`: `triggerType: 'fixed_time'`, `firstUnlockWindow: null`.

Existing tasks migrated in `migrateTaskSchema` (taskStore v0→v1) get `triggerType: 'fixed_time'` and no `firstUnlockWindow`, so they behave identically to before.

### `src/services/notifications.ts` — function signatures

```typescript
// Initialization
export async function initializeNotifications(): Promise<void>
export function registerForegroundHandler(onReminderTriggered: (taskId: string) => void): () => void
export function registerBackgroundHandler(onReminderTriggered?: (taskId: string) => void): void

// Scheduling
export async function scheduleTaskReminder(task: Task): Promise<void>
export async function scheduleNextRegularReminder(task: Task): Promise<void>
export async function rescheduleAfterSnooze(task: Task): Promise<void>

// Cancellation
export async function cancelTaskReminder(taskId: string): Promise<void>
export async function cancelActiveReminder(taskId: string): Promise<void>
export async function cancelAllReminders(): Promise<void>

// Display / Recovery
export async function displayImmediateReminder(task: Task): Promise<void>
export async function consumeInitialReminderTaskId(): Promise<string | null>

// Reconciliation
export async function reconcileNotifications(tasks: Task[]): Promise<void>
```

Internal (not exported):
```typescript
function getNextTriggerTime(task: Task, useGraceWindow: boolean): number | null
function buildNotification(task: Task, notificationId?: string): Notification
function buildTimestampTrigger(timestamp: number): TimestampTrigger
async function dismissDisplayedRemindersForTask(taskId: string): Promise<void>
async function persistPendingReminder(taskId: string): Promise<void>
async function consumePendingReminder(): Promise<string | null>
```

**Critical note:** `getNextTriggerTime` only handles `fixed_time` trigger logic. For `first_unlock` tasks, `task.reminderTime` stores the window start time (set automatically in `TaskForm` when the user picks the window). The `first_unlock` semantics — firing on first phone unlock within the window — are **not yet implemented in the scheduler**. Currently `first_unlock` tasks fire at their `startTime` like a regular fixed-time task. Phase E must implement the true first-unlock scheduling.

---

## 3. What Is Already Working (Confirmed After Phases A–D)

- **Full offline operation** — no backend, no auth, all data in AsyncStorage via Zustand persist
- **Task CRUD** — create, read, update, delete with all Phase A fields (`triggerType`, `dismissAction`, `nagInterval`, `locationNote`, `weeklyGoal`, `firstUnlockWindow`)
- **Schema migration** — existing users' tasks are migrated on first launch after upgrade: witness fields stripped, new fields backfilled with safe defaults
- **Weekly streak engine** — `computeWeeklyStreak` and `computeLongestWeeklyStreak` are week-goal-based for daily tasks; non-daily tasks fall back to stored values; two-set Zustand pattern ensures correct post-completion recomputation
- **Streak UI** — TaskDetail shows "(wk)" labels + "This week: N of M days" progress; Progress screen banner uses week values; QuickStatsRow shows best streak across all tasks
- **Task form — full field set** — trigger type toggle, first-unlock window pickers, More Options section (locationNote, dismissAction chips, nagInterval chips, weeklyGoal stepper, snooze, sound)
- **Form defaults from user prefs** — `getDefaultFormData()` reads `onboardingStore.getState()` at mount time to populate snooze, dismiss action, nag interval, weekly goal from user's saved preferences
- **Edit task — all Phase A fields round-trip** — EditTaskScreen maps all new fields into `initialData` and passes them back through `handleSubmit`
- **`isOnDate` timezone fix** — events no longer appear on the wrong calendar day for users east of UTC
- **Full-screen reminder** — last-done timestamp, location note pill, math challenge gate (generates arithmetic, loops on wrong answer), shake challenge gate (5 shakes at threshold 2.4, debounced 300 ms), single-tap "Not today", auto-nag interval
- **Auto-nag suppressed** during math/shake phase and when focus timer is active for same task
- **StrugglingSheet deleted** — single-tap "Not today" calls `struggleTask(taskId, 'not_today', undefined)` directly
- **FocusTimer "Not today"** — single-tap, no modal, abandons timer, navigates back
- **`tsc --noEmit` passes with zero errors**

---

## 4. What Phase E Must NOT Touch

These files are complete and correct. Do not modify them unless Phase E explicitly requires it.

| File | Reason |
|------|--------|
| `src/store/taskStore.ts` | Streak engine, two-set pattern, migration, all actions correct |
| `src/store/onboardingStore.ts` | All defaults and migration complete |
| `src/store/reminderStore.ts` | Queue, snooze counts, success animation — clean |
| `src/store/timerStore.ts` | Focus timer logic untouched across all phases |
| `src/store/ratingStore.ts` | Rating prompt triggers untouched |
| `src/store/soundStore.ts` | Sound selection untouched |
| `src/components/reminder/FullScreenReminder.tsx` | Full Phase D implementation complete |
| `src/components/reminder/ReminderOverlay.tsx` | Clean — no StrugglingSheet |
| `src/components/reminder/SuccessAnimation.tsx` | Untouched |
| `src/components/timer/PostTimerCompletion.tsx` | Untouched |
| `src/components/task/TaskForm.tsx` | Phase C redesign complete |
| `src/screens/modals/CreateTaskScreen.tsx` | Uses `getDefaultFormData()` correctly |
| `src/screens/modals/EditTaskScreen.tsx` | All new fields round-trip correctly |
| `src/screens/main/FocusTimerScreen.tsx` | "Not today" complete |
| `src/screens/main/TodayScreen.tsx` | Clean |
| `src/screens/main/TaskDetailScreen.tsx` | Streak display complete |
| `src/screens/main/ProgressScreen.tsx` | Streak display complete |
| `src/utils/dateUtils.ts` | All helpers complete; `isOnDate` timezone fix applied |
| `src/types/task.ts` | All types and `getDefaultFormData` complete |
| `plugins/withNotifee.js` | Custom config plugin — do not touch |
| `app.json` | Correct permissions and plugin config |
| `package.json` | `expo-sensors` already added |

---

## 5. Gotchas and Decisions from Phases A–D

### Package and channel IDs
- Android package: `com.showd.app`
- iOS bundle ID: `com.showd.app`
- Primary notification channel ID: `REMINDER_CHANNEL_ID` (imported from `src/utils/sounds.ts`) — per-sound channels are created dynamically; do not create a duplicate "default" channel
- Service channel ID (internal, low importance): `'showd-service'`
- AsyncStorage key for pending reminder: `'showd.pendingReminderTaskId'`
- AsyncStorage key for Zustand task store: `'showd-tasks'`
- AsyncStorage key for onboarding store: `'showd-onboarding'`

### Native module: `ShowdFullScreenIntent`
- Registered as `NativeModules.ShowdFullScreenIntent` in JS
- Provides: `canUseFullScreenIntent`, `openFullScreenIntentSettings`, `canDrawOverlays`, `openOverlayPermissionSettings`, `openAppForReminderIfUnlocked`, `showReminderOverlay`, `hideReminderOverlay`, `consumePendingOverlayAction`
- Written in Java (not Kotlin) by `withNotifee.js` at build time
- `showReminderOverlay` still has a `witnessPhotoUri` parameter in its signature (legacy from before Phase A). The JS bridge passes an empty string — this is safe and intentional. Phase E should not change the native signature without a dev-client rebuild.

### `first_unlock` is UI-only — scheduling is NOT implemented
- `task.triggerType === 'first_unlock'` is stored and displayed correctly
- When a user sets up a first-unlock task, `TaskForm` stores the window's `startTime` into `task.reminderTime` as a fallback
- `getNextTriggerTime()` in `notifications.ts` treats `first_unlock` tasks identically to `fixed_time` — it schedules at `startTime`
- **Phase E must implement actual first-unlock behavior**: detecting the first phone unlock within `[startTime, endTime]` and firing the reminder at that moment, not at a fixed time

### `struggleTask` reason is `string`, not an enum
- `struggleTask(taskId: string, reason: string, note?: string)` — `reason` is a plain string
- `'not_today'` is the value used by Phase D's "Not today" button
- Old events (from before Phase D) may have different reason strings from the former StrugglingSheet
- Phase G will rename the Progress screen label; do not touch that copy in Phase E

### Zustand two-set pattern
- `completeTask` and `undoTaskCompletion` use two sequential `set()` calls: first adds the event, then `get()` reads updated state, then second `set()` writes the recomputed streak. This is safe because Zustand's in-memory storage is synchronous.
- Do not collapse these into a single `set()` — the streak computation must see the just-added event.

### `migrate` + `merge` coexistence in Zustand persist
- Both `taskStore` (v1) and `onboardingStore` (v1) use `migrate` + `partialize`. The `taskStore` also has a custom `merge` for `stripLegacyMockData`.
- Execution order: `migrate` runs first (transforms old persisted shape), then `merge` combines the result with current state. This is correct and must not be changed.

### Circular import workaround
- `src/types/task.ts` imports from `src/store/onboardingStore.ts` inside `getDefaultFormData()` using `require()` (lazy, not a top-level ES import). This breaks the potential circular dependency (`task.ts ← onboardingStore.ts ← task.ts`).
- Do not convert this to a top-level ES import.

### Expo managed workflow — no committed Android folder
- There is no `android/` directory committed to the repo
- Native files are generated by `npx expo run:android` and patched by config plugins at that time
- After any `package.json` change that adds a native module, a full dev-client rebuild is required — JS bundle reload alone will not pick up new native modules

### `expo-sensors` requires dev-client rebuild
- `expo-sensors ~15.0.8` was added in Phase D
- If shake detection doesn't work, the most likely cause is that the dev client hasn't been rebuilt since the package was added

### `reminderTime` stores "HH:MM" vs 12h format inconsistency
- `task.reminderTime` can be either a 24h "HH:MM" string (stored by TaskForm's window picker via `dateToHM`) or a 12h format string (stored by the time picker via `formatTime12hFromDate`)
- `parseReminderTime` in `src/utils/reminderTime.ts` handles both formats
- For `first_unlock` tasks, `reminderTime` is set to `firstUnlockWindow.startTime` (always "HH:MM" 24h) as a scheduling fallback

### `BackHandler` on Android
- `FullScreenReminder` registers a `BackHandler` that returns `true` (blocks back navigation) while the reminder is visible
- `FocusTimerScreen` registers a `BackHandler` that allows back navigation (timer continues in background)

---

## 6. Exact Next Step for Phase E

**Phase E goal:** Implement true first-unlock scheduling — fire the reminder when the user first unlocks their phone within the configured `[startTime, endTime]` window on days the task is due.

**First thing to do:**

1. Open `src/services/notifications.ts` and read `getNextTriggerTime()` in full.

2. The function currently ignores `task.triggerType`. The first change is to add a branch:
   ```typescript
   if (task.triggerType === 'first_unlock') {
     // Do not schedule a fixed-time notification.
     // Instead, register a "window open" alarm at startTime and a "window close" alarm at endTime.
     // The actual reminder fires when the native module detects first unlock within the window.
     return null; // placeholder — replace with window-open timestamp
   }
   ```

3. The unlock detection mechanism needs to be decided before coding. Options (from simplest to most robust):
   - **Option A (JS-side polling):** Schedule a `fixed_time` notification at `startTime`, then when the app comes to foreground (via `AppState` listener), check if current time is within the window and fire the reminder. Simplest but misses cases where app never foregrounds.
   - **Option B (Native broadcast receiver):** Use the existing `ShowdFullScreenIntent` native module. Add a `ACTION_USER_PRESENT` broadcast receiver in the Java module that fires when the device is unlocked, checks if current time falls in any active first-unlock window, and calls `triggerReminder` on the store. More reliable but requires a dev-client rebuild.
   - **Option C (Notifee background task):** Register a Notifee background task that runs on unlock. Depends on Notifee version support.

4. Before writing any code, confirm which option the user wants. Option B is the architecturally correct choice given the existing native module infrastructure — but it requires modifying `ShowdFullScreenIntent.java` (generated by `withNotifee.js`) and rebuilding the dev client.

**The single question to ask the user before starting:**
> "For first-unlock detection, should I go with the native broadcast receiver approach (reliable, requires dev-client rebuild) or a JS foreground-state polling approach (simpler, misses cases where app is never foregrounded)?"
