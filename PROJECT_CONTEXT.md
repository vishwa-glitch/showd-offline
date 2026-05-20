# Showd Mobile App — Technical Project Context

> **Purpose**: Complete technical reference for the Showd React Native codebase. Give this to an AI to generate precise, code-change prompts or to make changes directly. All file paths are relative to `D:\showd-mobile-app\showd\` unless stated otherwise.

---

## 1. Project Overview

Showd is a **fully offline**, accountability-based task reminder app. No backend, no auth, no subscriptions — all data is local on device.

- **Platform**: Android + iOS (Expo managed workflow with dev-client)
- **Stack**: React Native 0.81.5, Expo SDK 54, React 19.1.0, TypeScript 5.9 strict
- **State**: Zustand 5.0.11 + AsyncStorage persistence
- **Navigation**: React Navigation 7 (native-stack + bottom-tabs)
- **Notifications**: @notifee/react-native 9.1.8
- **App root for all commands**: `D:\showd-mobile-app\showd\`
- **Path alias**: `@/*` → `src/*` (configured in tsconfig.json)
- **Bundle IDs**: `com.showd.app` (Android & iOS)
- **Entry point**: `showd/index.ts`
- **App.tsx**: Root component; loads fonts via `useFonts`, mounts global hooks (`useTimerTick`, `useMissedTaskChecker`, `useAbandonedTimerDetector`), initializes notifications, refreshes permissions on foreground.

---

## 2. Complete Directory Structure

```
showd/
├── index.ts
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json                         # strict, baseUrl ".", @/* → src/*
├── babel.config.js                       # babel-preset-expo + reanimated plugin
├── metro.config.js
├── plugins/
│   └── withNotifee.js                    # Custom Expo config plugin for Notifee native setup
├── assets/
│   ├── logo.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
└── src/
    ├── components/
    │   ├── howItWorks/
    │   │   └── Mockups.tsx
    │   ├── permissions/
    │   │   ├── FailedReminderSheet.tsx
    │   │   ├── FullScreenIntentGuide.tsx
    │   │   ├── OEMInstructions.tsx
    │   │   ├── PermissionBanner.tsx
    │   │   ├── PermissionItem.tsx
    │   │   └── ReminderHealthCheck.tsx
    │   ├── progress/
    │   │   ├── CalendarGrid.tsx
    │   │   └── DayDetail.tsx
    │   ├── reminder/
    │   │   ├── FullScreenReminder.tsx
    │   │   ├── ReminderOverlay.tsx
    │   │   ├── StrugglingSheet.tsx
    │   │   └── SuccessAnimation.tsx
    │   ├── task/
    │   │   ├── DurationPicker.tsx
    │   │   ├── QuickStatsRow.tsx
    │   │   ├── TaskCard.tsx
    │   │   ├── TaskEmptyState.tsx
    │   │   └── TaskForm.tsx
    │   ├── timer/
    │   │   ├── ActiveTimerBar.tsx
    │   │   ├── CircularProgress.tsx
    │   │   └── PostTimerCompletion.tsx
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       ├── Chip.tsx
    │       ├── Input.tsx
    │       └── RatingPromptSheet.tsx
    ├── constants/
    │   └── oemConfig.ts
    ├── hooks/
    │   ├── useAbandonedTimerDetector.ts
    │   ├── useMissedTaskChecker.ts
    │   └── useTimerTick.ts
    ├── navigation/
    │   ├── AppNavigator.tsx
    │   ├── AuthStack.tsx
    │   ├── MainTabs.tsx
    │   └── RootStack.tsx
    ├── screens/
    │   ├── auth/
    │   │   ├── WelcomeScreen.tsx
    │   │   ├── OnboardingScreen.tsx
    │   │   ├── NameSetupScreen.tsx
    │   │   └── PermissionSetupScreen.tsx
    │   ├── main/
    │   │   ├── TodayScreen.tsx
    │   │   ├── ProgressScreen.tsx
    │   │   ├── SettingsScreen.tsx
    │   │   ├── TaskDetailScreen.tsx
    │   │   └── FocusTimerScreen.tsx
    │   ├── modals/
    │   │   ├── CreateTaskScreen.tsx
    │   │   └── EditTaskScreen.tsx
    │   └── settings/
    │       ├── HowShowdWorksScreen.tsx
    │       ├── ReminderSoundScreen.tsx
    │       ├── SnoozeLimitScreen.tsx
    │       ├── SendFeedbackScreen.tsx
    │       ├── PrivacyPolicyScreen.tsx
    │       └── TermsOfServiceScreen.tsx
    ├── services/
    │   ├── notifications.ts
    │   ├── timerNotification.ts
    │   ├── permissions.ts
    │   ├── soundPlayer.ts
    │   ├── ratingPrompt.ts
    │   ├── missedTaskChecker.ts
    │   └── fullScreenIntentAccess.ts
    ├── store/
    │   ├── taskStore.ts
    │   ├── reminderStore.ts
    │   ├── timerStore.ts
    │   ├── permissionStore.ts
    │   ├── soundStore.ts
    │   ├── onboardingStore.ts
    │   └── ratingStore.ts
    ├── types/
    │   ├── task.ts
    │   └── navigation.ts
    └── utils/
        ├── colors.ts
        ├── typography.ts
        ├── spacing.ts
        ├── sounds.ts
        ├── reminderTime.ts
        ├── extensionTiers.ts
        └── dateUtils.ts
```

---

## 3. Navigation

### `src/navigation/AppNavigator.tsx`
Root navigator. Reads `hasCompletedOnboarding` from `onboardingStore`. Renders `AuthStack` or `RootStack` based on that flag. Always mounts `<ReminderOverlay />` globally above both stacks.

### `src/navigation/AuthStack.tsx`
```
AuthStackParamList:
  Welcome         → WelcomeScreen
  Onboarding      → OnboardingScreen
  NameSetup       → NameSetupScreen
  PermissionSetup → PermissionSetupScreen
```
Native-stack. No headers. `slide_from_right` animation.

### `src/navigation/MainTabs.tsx`
```
MainTabParamList:
  Today    → TodayScreen    (Feather icon: home)
  Progress → ProgressScreen (Feather icon: trending-up)
  Settings → SettingsScreen (Feather icon: settings)
```
Bottom-tab navigator. Custom tab bar styling with `useSafeAreaInsets()`.

### `src/navigation/RootStack.tsx`
```
RootStackParamList:
  MainTabs      → MainTabs (nested navigator)
  CreateTask    → CreateTaskScreen    (presentation: modal)
  EditTask      → EditTaskScreen      (presentation: modal, params: { taskId: string })
  FocusTimer    → FocusTimerScreen    (presentation: modal, dark bg rgba(15,10,20,0.95), gestures disabled)
  TaskDetail    → TaskDetailScreen    (params: { taskId: string })
  HowShowdWorks → HowShowdWorksScreen
  SnoozeLimit   → SnoozeLimitScreen
  ReminderSound → ReminderSoundScreen
  SendFeedback  → SendFeedbackScreen
  PrivacyPolicy → PrivacyPolicyScreen
  TermsOfService → TermsOfServiceScreen
```

---

## 4. TypeScript Types

### `src/types/task.ts`

```typescript
type TaskCategory = 'medication' | 'exercise' | 'work' | 'self_care' | 'habit' | 'other'
type TaskFrequency = 'once' | 'daily' | 'weekly' | 'custom'
type TaskEventStatus = 'pending' | 'in_progress' | 'done' | 'snoozed' | 'struggled' | 'missed'

interface Task {
  id: string                   // UUID
  userId: string               // always 'local'
  name: string
  description?: string
  category: TaskCategory
  reminderTime: string         // "08:00" (24h) or "8:00 AM" (12h) format
  witnessName?: string
  witnessPhotoUri?: string
  frequency: TaskFrequency
  frequencyDays?: number[]     // [0-6], only when frequency === 'weekly'
  customIntervalDays?: number  // days between repeats, only when frequency === 'custom'
  oneTimeDate?: string         // ISO date string, only when frequency === 'once'
  snoozeLimit: number
  durationMinutes?: number     // focus timer duration; undefined means no timer
  requirePhotoProof: boolean
  reminderSoundId?: string
  isActive: boolean
  isPaused: boolean
  currentStreak: number
  longestStreak: number
  createdAt: string            // ISO timestamp
  updatedAt: string            // ISO timestamp
}

interface TaskEvent {
  id: string
  taskId: string
  userId: string               // always 'local'
  scheduledFor: string         // ISO timestamp
  status: TaskEventStatus
  respondedAt?: string         // ISO timestamp
  snoozeCount: number
  strugglingReason?: string
  strugglingNote?: string
  // Timer fields (only present on timed tasks)
  startedAt?: string
  completedAt?: string
  pausedDurationSeconds?: number
  actualDurationSeconds?: number
  originalDurationMinutes?: number
  extensionsUsed?: number
  totalExtensionSeconds?: number
  timerCompleted?: boolean
  // Photo proof
  proofPhotoUrl?: string
  createdAt: string            // ISO timestamp
}

interface TaskFormData {
  name: string
  description: string
  category: TaskCategory | null
  reminderTime: string
  witnessName: string
  witnessPhotoUri: string
  frequency: TaskFrequency
  frequencyDays: number[]
  customIntervalDays: number
  oneTimeDate: string
  snoozeLimit: number
  durationMinutes: number | null
  requirePhotoProof: boolean
  reminderSoundId: string | null
}

// Also exported:
const TASK_CATEGORIES: { key: TaskCategory; label: string; icon: string }[]
const DEFAULT_FORM_DATA: TaskFormData
```

### `src/types/navigation.ts`
Contains `AuthStackParamList`, `MainTabParamList`, `RootStackParamList` matching the navigation section above. Also exports typed screen prop types for every screen (e.g., `TodayScreenProps = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Today'>, NativeStackScreenProps<RootStackParamList>>`).

---

## 5. Stores (Zustand 5)

All stores live in `src/store/`. Persisted stores use `zustand/middleware` `persist` with `@react-native-async-storage/async-storage`. Non-persisted stores are memory-only and reset on app kill.

Pattern for accessing stores in components:
```typescript
const tasks = useTaskStore(s => s.tasks, useShallow)
```
Pattern for accessing stores in services (non-React):
```typescript
useTaskStore.getState().someAction()
```

---

### `src/store/taskStore.ts` — persisted as `'showd-tasks'`

```typescript
interface TaskState {
  tasks: Task[]
  events: TaskEvent[]
  isLoading: boolean

  addTask(formData: TaskFormData): Task
  updateTask(taskId: string, updates: Partial<Task>): void
  deleteTask(taskId: string): void
  getTaskById(taskId: string): Task | undefined

  addEvent(eventData: Partial<TaskEvent>): void
  completeTask(taskId: string): number          // returns updated streak
  undoTaskCompletion(taskId: string): boolean
  snoozeTask(taskId: string): boolean           // returns false if snoozeLimit reached
  struggleTask(taskId: string, reason: string, note?: string): void
  markTaskMissed(taskId: string): void

  getTodayTasks(): Task[]
  getTaskEvents(taskId: string): TaskEvent[]
  getCompletedTodayCount(): number
  getActiveTaskCount(): number
}
```
- `stripLegacyMockData()` runs on rehydrate to remove old test data.
- All `id` fields are generated as UUIDs.
- `snoozeTask` checks `task.snoozeLimit` before allowing and returns `false` if limit is reached.
- `in_progress` events replace any existing `missed` events for the same task+day.

---

### `src/store/reminderStore.ts` — NOT persisted (memory only)

```typescript
interface ReminderState {
  pendingReminders: string[]          // queued taskIds waiting to show
  activeTaskId: string | null         // currently displayed reminder
  snoozeCounts: Record<string, number>
  showStrugglingSheet: boolean
  showSuccessAnimation: boolean
  completedStreak: number | null

  triggerReminder(taskId: string): void   // queues if one already active; deduplicates
  dismissReminder(): void                 // shows next in pendingReminders queue
  snoozeReminder(taskId: string): void
  openStrugglingSheet(): void
  closeStrugglingSheet(): void
  showSuccess(streak?: number): void
  hideSuccess(): void
  getSnoozeCount(taskId: string): number
  resetSnoozeCounts(): void
}
```

---

### `src/store/timerStore.ts` — NOT persisted (memory only)

```typescript
interface TimerState {
  // Active timer state
  activeTaskId: string | null
  activeTaskEventId: string | null
  startedAt: string | null             // ISO timestamp when timer started
  durationSeconds: number              // original total duration
  remainingSeconds: number
  isPaused: boolean
  pausedAt: string | null              // ISO timestamp when paused
  totalPausedSeconds: number
  extensionsUsed: number
  totalExtensionSeconds: number

  // Post-timer overlay state
  showPostTimerCompletion: boolean
  completedTaskId: string | null
  completedDurationSeconds: number

  startTimer(taskId: string, taskEventId: string, durationMinutes: number): void
  pauseTimer(): void
  resumeTimer(): void
  tickTimer(): void                    // called by useTimerTick every 1 second
  completeTimer(): void                // fires when remainingSeconds hits 0
  extendTimer(additionalMinutes: number): void
  abandonTimer(): void
  showPostTimer(): void
  dismissPostTimer(): void
  reconcileTimer(): void               // recalculates remaining after app was backgrounded

  isTimerActive(): boolean
  getProgress(): number                // 0–1 (elapsed / total)
  getPausedAt(): string | null
}
```

---

### `src/store/permissionStore.ts` — persisted as `'showd-permissions'`

```typescript
interface PermissionState {
  // Runtime permission flags (refreshed on foreground)
  notificationsGranted: boolean
  exactAlarmGranted: boolean
  batteryOptimizationDisabled: boolean
  overlayGranted: boolean
  fullScreenIntentGranted: boolean

  // Persisted user progress flags
  onboardingPermissionsCompleted: boolean
  oemSetupCompleted: boolean
  permissionBannerDismissedAt: number | null   // unix ms timestamp

  setPermissionStatus(key: string, value: boolean): void
  setOnboardingCompleted(): void
  setOEMSetupCompleted(): void
  dismissBanner(): void
  shouldShowBanner(): boolean      // true if missing permissions AND not dismissed within 7 days
  hasMissingPermissions(): boolean
  refreshAllPermissions(): Promise<void>   // calls checkAllPermissions() from permissions service
}
```

---

### `src/store/soundStore.ts` — persisted as `'showd-sound'`

```typescript
interface SoundState {
  selectedSoundId: string      // default: 'gentle_pulse'
  setSelectedSound(id: string): void
}
// Also exports: getSelectedSoundId() for use in non-React (service) contexts
```

---

### `src/store/onboardingStore.ts` — persisted as `'showd-onboarding'`

```typescript
interface OnboardingState {
  hasCompletedOnboarding: boolean
  userName: string
  defaultSnoozeLimit: number   // default: 3

  completeOnboarding(): void
  updateName(name: string): void
  updateDefaultSnoozeLimit(limit: number): void
}
```

---

### `src/store/ratingStore.ts` — persisted as `'showd-rating'`

```typescript
interface RatingState {
  totalCompletedTasks: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  hasStruggleThenCompletedToday: boolean
  appOpenCount: number
  struggledToday: boolean

  lastRatingPromptDate: string | null
  hasRatedApp: boolean
  ratingPromptCount: number        // max 3 lifetime
  hasSeenTaskMilestonePrompt: boolean

  recordAppOpen(): void
  recordTaskCompletion(): void     // also updates streak
  recordStruggle(): void           // sets struggledToday = true
  shouldShowRatingPrompt(): RatingTriggerResult
  markRatingPromptShown(): void
  markAppRated(): void
}

interface RatingTriggerResult {
  shouldShow: boolean
  trigger: 'streak_3' | 'streak_7' | 'streak_14' | 'task_milestone' | 'struggle_then_complete' | null
  streakCount?: number
  taskCount?: number
}
```
- Triggers checked in priority order: streak milestones (3, 7, 14) → task milestone (10+ tasks, shown once) → struggled then completed today.
- Rate limits: max 3 prompts lifetime, 5-day cooldown between prompts.
- `recordAppOpen()` handles daily reset of `struggledToday` and streak maintenance.

---

## 6. Screens

### Auth Screens (`src/screens/auth/`)

| Screen | Key Logic |
|--------|-----------|
| `WelcomeScreen` | Hero page, feature list, "Get Started" → navigate to Onboarding |
| `OnboardingScreen` | 3-page walkthrough → navigate to NameSetup |
| `NameSetupScreen` | Text input, calls `onboardingStore.updateName()`, navigate to PermissionSetup |
| `PermissionSetupScreen` | Requests Android permissions (notifications, exact alarm, overlay, full-screen intent). Calls `onboardingStore.completeOnboarding()` on finish. Triggers AppNavigator to switch to RootStack. |

### Main Screens (`src/screens/main/`)

**`TodayScreen`**
- Greeting string (Good morning / afternoon / evening) + `userName` from onboardingStore
- `<QuickStatsRow />` — shows max streak
- `<PermissionBanner />` — shown when `permissionStore.shouldShowBanner()` is true
- `<ActiveTimerBar />` — shown when `timerStore.isTimerActive()` is true; tapping navigates to FocusTimer
- Flat list of today's tasks via `<TaskCard />` (from `taskStore.getTodayTasks()`)
- `<TaskEmptyState />` when list is empty
- Inline task completion with undo snackbar (calls `taskStore.completeTask()` then `taskStore.undoTaskCompletion()`)
- Rating prompt integration via `ratingStore.shouldShowRatingPrompt()`
- FAB to open CreateTask modal
- Stores used: `taskStore`, `reminderStore`, `timerStore`, `permissionStore`, `ratingStore`, `onboardingStore`

**`ProgressScreen`**
- Month/year navigation header
- `<CalendarGrid />` for visual month overview with `DayStatus` coloring
- `<DayDetail />` for selected day's tasks and events
- Completion rate selector: `7_days | 30_days | 90_days | all_time`
- Per-task stats: completion rate, streak, struggle count
- Timer stats: average actual duration, total extensions
- Rating prompt integration
- Stores used: `taskStore`, `ratingStore`

**`SettingsScreen`**
- Edit user name (inline modal)
- `<ReminderHealthCheck />` for permission audit
- Navigate to: ReminderSound, SnoozeLimit, HowShowdWorks, SendFeedback, PrivacyPolicy, TermsOfService
- OEM-specific battery optimization section (uses `oemConfig.ts`)
- Rate the app button → calls `ratingPrompt.openPlayStoreRating()`
- Stores used: `onboardingStore`, `permissionStore`, `soundStore`

**`TaskDetailScreen`** — params: `{ taskId: string }`
- Single task detail view with full event history using `taskStore.getTaskEvents()`

**`FocusTimerScreen`** — params: `{ taskId: string; taskEventId: string }`
- `<CircularProgress />` with `timerStore.getProgress()`
- Countdown display via `formatCountdown(timerStore.remainingSeconds)`
- Pause/Resume button toggling `timerStore.pauseTimer()` / `timerStore.resumeTimer()`
- Extend timer buttons — options from `getExtensionTier(task.durationMinutes)`
- Complete button → `timerStore.completeTimer()`
- "Struggling" button → opens `StrugglingSheet`
- Android hardware back blocked during active timer; iOS swipe gesture disabled on this modal
- Stores used: `timerStore`, `taskStore`, `reminderStore`

### Modal Screens (`src/screens/modals/`)

**`CreateTaskScreen`** — Renders `<TaskForm initialData={DEFAULT_FORM_DATA} />`

**`EditTaskScreen`** — params: `{ taskId: string }`. Loads task with `taskStore.getTaskById(taskId)`, renders `<TaskForm initialData={task} />`

### Settings Sub-screens (`src/screens/settings/`)
`HowShowdWorksScreen`, `ReminderSoundScreen`, `SnoozeLimitScreen`, `SendFeedbackScreen`, `PrivacyPolicyScreen`, `TermsOfServiceScreen`

---

## 7. Components

### UI Primitives (`src/components/ui/`)

**`Button`**
```typescript
interface ButtonProps {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'text' | 'success' | 'danger'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}
```

**`Card`**
```typescript
interface CardProps {
  children: React.ReactNode
  onPress?: () => void
  style?: ViewStyle
  padded?: boolean
}
```

**`Input`** — Extends React Native `TextInputProps`
```typescript
interface InputProps extends TextInputProps {
  label?: string
  error?: string
  containerStyle?: ViewStyle
}
```

**`Chip`**
```typescript
interface ChipProps {
  label: string
  selected: boolean
  onPress: () => void
  icon?: string        // Feather icon name
  color?: string
}
```

**`RatingPromptSheet`** — Bottom sheet with star rating UI. Trigger-aware messaging (shows different text per `RatingTriggerResult.trigger`).

---

### Task Components (`src/components/task/`)

**`TaskCard`**
```typescript
interface TaskCardProps {
  task: Task
  isCompleted: boolean
  isInProgress?: boolean
  timerRemainingSeconds?: number
  onPress: () => void
  onComplete: () => void
}
```
- Category-colored dot with Feather icon
- Task name (strikethrough when completed)
- Meta row: reminder time or timer countdown (`formatCountdown`)
- Completion toggle button, chevron icon

**`TaskForm`** — Used by both CreateTask and EditTask screens. Full form fields:
- Task name (required), description
- Category picker (chips using `TASK_CATEGORIES`)
- Reminder time (12h AM/PM via `@react-native-community/datetimepicker`)
- Witness name + photo (via `expo-image-picker`)
- Frequency: `once | daily | weekly | custom`
  - `weekly`: day-of-week chip selector (`frequencyDays`)
  - `custom`: `customIntervalDays` number input
  - `once`: date picker (`oneTimeDate`)
- Snooze limit (number input)
- `<DurationPicker />` for `durationMinutes`
- Require photo proof toggle
- Sound selector (navigates to `ReminderSound` screen via nav)

**`DurationPicker`** — Preset buttons (None, 5m, 15m, 30m, 45m, 1h, 1.5h, 2h) plus custom hour/minute number inputs.

**`QuickStatsRow`** — Displays longest streak number.

**`TaskEmptyState`** — Illustration with CTA when task list is empty.

---

### Reminder Components (`src/components/reminder/`)

**`ReminderOverlay`** — Mounted globally in `AppNavigator.tsx`. Conditionally renders based on reminderStore and timerStore state:
- `<FullScreenReminder />` when `reminderStore.activeTaskId` is set
- `<StrugglingSheet />` when `reminderStore.showStrugglingSheet`
- `<SuccessAnimation />` when `reminderStore.showSuccessAnimation`
- `<PostTimerCompletion />` when `timerStore.showPostTimerCompletion`
- `<RatingPromptSheet />` when rating prompt should show (checked post-success)

**`FullScreenReminder`** — Full-screen overlay showing task name, witness info, looping sound. User actions: Complete, Snooze, I'm Struggling.

**`StrugglingSheet`** — Bottom sheet with preset struggle reason chips + optional note text input.

**`SuccessAnimation`** — Celebration Reanimated animation; shows streak count if > 1.

---

### Timer Components (`src/components/timer/`)

**`ActiveTimerBar`** — Persistent bar rendered on `TodayScreen`. Shows task name + formatted countdown. Tap navigates to FocusTimer screen.

**`CircularProgress`** — SVG/Reanimated animated circle. Takes `progress: number` (0–1).

**`PostTimerCompletion`** — Overlay shown after timer completes. Offers: Complete task, Extend timer, or Snooze.

---

### Permission Components (`src/components/permissions/`)

**`PermissionBanner`** — Shown on TodayScreen when permissions are missing. Dismissible for 7 days via `permissionStore.dismissBanner()`.

**`PermissionItem`** — Individual permission row with a status icon.

**`ReminderHealthCheck`** — Full permission audit list shown in SettingsScreen.

**`FullScreenIntentGuide`** — Step-by-step guide for granting full-screen intent permission.

**`OEMInstructions`** — Brand-specific battery optimization steps fetched from `oemConfig.getOEMInstructions()`.

---

### Progress Components (`src/components/progress/`)

**`CalendarGrid`** — Month grid. Each day cell colored by `DayStatus` from `dateUtils.getDayStatus()`.

**`DayDetail`** — Shows tasks and event outcomes for a selected day.

---

## 8. Services

### `src/services/notifications.ts`
Wraps Notifee for all task reminder scheduling.

```typescript
initializeNotifications(): Promise<void>
// Creates Notifee channels ('showd-reminder-v3', timer service channel)
// Requests iOS notification permissions

registerForegroundHandler(callback: (taskId: string) => void): void
// Called once in App.tsx; fires when notification tapped while app is open

registerBackgroundHandler(): void
// Must be called at module level (outside component); handles background taps

scheduleNextRegularReminder(task: Task): Promise<void>
// Schedules next occurrence based on task.frequency and task.reminderTime
// Uses AlarmType.SET_AND_ALLOW_WHILE_IDLE for exact timing

rescheduleAfterSnooze(task: Task): Promise<void>
// Reschedules 15 minutes from now; notification ID suffixed with ':snooze'

cancelActiveReminder(task: Task): Promise<void>

reconcileNotifications(tasks: Task[]): Promise<void>
// Called on app startup; ensures all active tasks have scheduled notifications
// Cancels stale notifications and reschedules missing ones

consumeInitialReminderTaskId(): Promise<string | null>
// Reads taskId from AsyncStorage — used for cold-start notification taps
```
- Vibration pattern: `[100, 400, 200, 400, 200, 400]`
- Full-screen intent triggered via `fullScreenIntentAccess.showSystemReminderOverlay()`

---

### `src/services/timerNotification.ts`
Manages the persistent ongoing timer notification on Android.

```typescript
initializeTimerChannel(): Promise<void>
showTimerNotification(taskName: string, remainingSeconds: number): Promise<void>
// Creates ongoing notification with Android chronometer counting down
// Uses: chronometerDirection: 'down', ongoing: true
// timestamp = Date.now() + remainingSeconds * 1000

showPausedTimerNotification(taskName: string, remainingSeconds: number): Promise<void>
// Static display showing paused state

removeTimerNotification(): Promise<void>
```

---

### `src/services/permissions.ts`

```typescript
checkAllPermissions(): Promise<{
  notifications: boolean
  exactAlarm: boolean
  batteryOptimizationDisabled: boolean
  overlayPermission: boolean
  fullScreenIntent: boolean
}>
requestNotificationPermission(): Promise<boolean>
openNotificationSettings(): void
canDrawOverlays(): Promise<boolean>
canUseFullScreenIntent(): Promise<boolean>
openOverlayPermissionSettings(): void
openFullScreenIntentSettings(): void
```

---

### `src/services/soundPlayer.ts`
Uses `expo-audio`.

```typescript
playSound(soundId: string, loop?: boolean): Promise<void>
// Sets playsInSilentMode: true; supports looping for reminders

stopSound(): Promise<void>

previewSound(soundId: string, durationMs?: number): Promise<void>
// Plays for durationMs (default: 3000ms) then stops automatically
```

---

### `src/services/missedTaskChecker.ts`

```typescript
getTasksToMarkMissed(tasks: Task[], events: TaskEvent[]): Task[]
// Returns tasks whose reminderTime has passed today with no response event
// Used by useMissedTaskChecker hook
```

---

### `src/services/fullScreenIntentAccess.ts`

```typescript
showSystemReminderOverlay(): void
hideSystemReminderOverlay(): void
consumePendingSystemOverlayAction(): Promise<string | null>
// Reads pending action from AsyncStorage written by the native Android module
```

---

### `src/services/ratingPrompt.ts`

```typescript
openPlayStoreRating(): void
// Opens Play Store app detail; falls back to web URL if Play Store unavailable
```

---

## 9. Hooks

### `src/hooks/useTimerTick.ts`
- Runs a 1-second `setInterval` calling `timerStore.tickTimer()` when timer is active and not paused.
- On `AppState` change to `active` (foreground), calls `timerStore.reconcileTimer()` to recalculate elapsed time while app was backgrounded.
- Updates timer notification via `timerNotification.showTimerNotification()` or `showPausedTimerNotification()`.
- **Mounted once in `App.tsx`** — not per-screen.

### `src/hooks/useMissedTaskChecker.ts`
- Polls every 60 seconds + on app foreground.
- Calls `missedTaskChecker.getTasksToMarkMissed(tasks, events)`.
- Calls `taskStore.markTaskMissed(taskId)` for each result.
- Skips tasks that are: the current `reminderStore.activeTaskId`, in `reminderStore.pendingReminders`, or have an active timer (`timerStore.activeTaskId`).
- **Mounted once in `App.tsx`**.

### `src/hooks/useAbandonedTimerDetector.ts`
- Polls every 60 seconds.
- If `timerStore.isPaused` and `pausedAt` is > 30 minutes ago:
  - Calls `timerStore.abandonTimer()`
  - Calls `taskStore.markTaskMissed(activeTaskId)`
- Thresholds: `NUDGE_THRESHOLD = 10 * 60`, `ABANDON_THRESHOLD = 30 * 60` (seconds)
- **Mounted once in `App.tsx`**.

---

## 10. Utilities

### `src/utils/colors.ts`
```typescript
const Colors = {
  // Brand
  primary: '#FF4D6A',
  primaryDark: string,
  primaryLight: string,
  // Neutrals
  background: string,
  surface: string,
  textPrimary: string,
  textSecondary: string,
  textTertiary: string,
  border: string,
  // Status colors (each has a paired Light variant)
  success: string,      successLight: string,
  snooze: string,       snoozeLight: string,
  struggling: string,   strugglingLight: string,
  missed: string,       missedLight: string,
  inProgress: string,   inProgressLight: string,
  // Per-category colors
  categoryMedication: string,
  categoryExercise: string,
  categoryWork: string,
  categorySelfCare: string,
  categoryHabit: string,
  categoryOther: string,
  // Overlay colors
  overlayDark: string,
  overlayMedium: string,
}
```

### `src/utils/typography.ts`
```typescript
const FontFamily = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semiBold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
}

const Typography = {
  heading1: TextStyle,
  heading2: TextStyle,
  heading3: TextStyle,
  body: TextStyle,
  bodySmall: TextStyle,
  caption: TextStyle,
  button: TextStyle,
  reminderTask: TextStyle,    // 28px bold — used in FullScreenReminder
  reminderWitness: TextStyle, // 18px medium
  timerDisplay: TextStyle,    // 56px bold — used in FocusTimerScreen
  timerLabel: TextStyle,      // 14px medium
}
```

### `src/utils/spacing.ts`
```typescript
const Spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24,
  '2xl': 32, '3xl': 40, '4xl': 48,
}
const BorderRadius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 }
const Shadows = { sm: ShadowStyle, md: ShadowStyle, lg: ShadowStyle }
const MIN_TOUCH_TARGET = 48
```

### `src/utils/sounds.ts`
```typescript
interface SoundOption {
  id: string
  name: string
  description: string
  loopDuration: number   // seconds
}

const BUILT_IN_SOUNDS: SoundOption[] = [
  { id: 'gentle_pulse',  loopDuration: 3   },  // default
  { id: 'morning_call',  loopDuration: 2   },
  { id: 'steady_knock',  loopDuration: 2.5 },
  { id: 'urgent_bell',   loopDuration: 1.5 },
  { id: 'calm_wave',     loopDuration: 4   },
]

const DEFAULT_SOUND_ID = 'gentle_pulse'
const REMINDER_CHANNEL_ID = 'showd-reminder-v3'

// Static require map for expo-audio
const SOUND_ASSETS: Record<string, ReturnType<typeof require>>

getSoundName(soundId: string): string
isBuiltInSound(soundId: string): boolean
getChannelIdForSound(soundId: string): string
```

### `src/utils/reminderTime.ts`
```typescript
parseReminderTime(value: string): { hours: number; minutes: number } | null
// Accepts "HH:MM" (24h) or "H:MM AM/PM"; clamps to valid ranges

formatReminderTime(value: string): string
// Converts any accepted format → "H:MM AM/PM"

formatTime12hFromDate(date: Date): string
// Date object → "H:MM AM/PM"
```

### `src/utils/extensionTiers.ts`
```typescript
interface ExtensionTier {
  options: number[]      // minutes user can extend by
  maxExtensions: number
}

getExtensionTier(durationMinutes: number): ExtensionTier
// durationMinutes < 30   → { options: [5, 10],  maxExtensions: 2 }
// durationMinutes 30–120 → { options: [10, 15], maxExtensions: 3 }
// durationMinutes > 120  → { options: [15, 30], maxExtensions: 2 }

formatDuration(seconds: number): string
// e.g. "30 minutes" | "1h 30m"

formatCountdown(seconds: number): string
// e.g. "04:30" | "1:04:30"
```

### `src/utils/dateUtils.ts`
```typescript
type DayStatus = 'all_done' | 'partial' | 'all_missed' | 'struggled' | 'timer_done' | 'none'
type CompletionRateWindow = '7_days' | '30_days' | '90_days' | 'all_time'

getDaysInMonth(year: number, month: number): number
getMonthStartDay(year: number, month: number): number   // 0=Sun
formatMonthYear(year: number, month: number): string    // "February 2026"
formatDayHeader(year: number, month: number, day: number): string  // "Tuesday, Feb 10"
toDateString(year: number, month: number, day: number): string     // "2026-02-10"
isOnDate(isoString: string, dateStr: string): boolean

getDayStatus(events: TaskEvent[], tasks: Task[], dateStr: string): DayStatus
// Priority order: struggled > timer_done > all_done > partial > all_missed > none

getCompletionRate(events: TaskEvent[], taskId: string): number  // 0–100

getTaskCompletionStats(tasks: Task[], events: TaskEvent[], window: CompletionRateWindow): object
getTaskCompletionTrend(tasks: Task[], events: TaskEvent[]): object
getTimedTaskStats(tasks: Task[], events: TaskEvent[]): object
```

---

## 11. Constants — `src/constants/oemConfig.ts`

```typescript
type OEMBrand = 'xiaomi' | 'samsung' | 'huawei' | 'oneplus' | 'oppo' | 'vivo' | 'realme' | 'other'

interface OEMStep { title: string; description: string }

getOEMBrand(): OEMBrand                            // detects from expo-device Brand/Manufacturer
isProblematicOEM(): boolean                         // true for all except 'other'
getOEMDisplayName(): string
getOEMInstructions(brand: OEMBrand): OEMStep[]      // 2–5 battery optimization steps per brand
getOEMBatterySettingsIntent(brand: OEMBrand): string | null  // deep-link Intent URIs
getFullScreenIntentInstructions(brand: OEMBrand): OEMStep[]  // full-screen permission setup steps
```

---

## 12. Key User Flows

### Reminder Flow
1. `notifications.scheduleNextRegularReminder(task)` schedules a Notifee trigger.
2. Trigger fires → `registerForegroundHandler` callback receives `taskId`.
3. `reminderStore.triggerReminder(taskId)` is called (queues if one is already showing).
4. `ReminderOverlay` detects `activeTaskId` set → renders `<FullScreenReminder />`.
5. Sound loops via `soundPlayer.playSound(soundId, true)`.
6. User actions:
   - **Complete** → `taskStore.completeTask(taskId)` → `reminderStore.dismissReminder()` → `reminderStore.showSuccess(streak)` → `notifications.scheduleNextRegularReminder(task)`
   - **Snooze** → `taskStore.snoozeTask(taskId)` → `notifications.rescheduleAfterSnooze(task)` → `reminderStore.dismissReminder()`
   - **Struggling** → `reminderStore.openStrugglingSheet()` → user picks reason → `taskStore.struggleTask(taskId, reason, note)` → `reminderStore.closeStrugglingSheet()` → `reminderStore.dismissReminder()`

### Timer Flow
1. User taps a task with `durationMinutes` set → navigates to `FocusTimer` with `{ taskId, taskEventId }`.
2. `timerStore.startTimer(taskId, taskEventId, durationMinutes)` initializes all timer state.
3. `useTimerTick` (in App.tsx) decrements `remainingSeconds` every second.
4. `timerNotification.showTimerNotification()` shows persistent Android notification.
5. `<ActiveTimerBar />` appears on TodayScreen.
6. When `remainingSeconds === 0`: `timerStore.completeTimer()` → `showPostTimerCompletion = true`.
7. `<PostTimerCompletion />` overlay appears; user chooses Complete, Extend, or Snooze.

### Missed Task Detection
1. `useMissedTaskChecker` polls every 60s and on each app foreground.
2. `missedTaskChecker.getTasksToMarkMissed(tasks, events)` computes overdue tasks.
3. Excluded: current `activeTaskId`, any task in `pendingReminders`, task with active timer.
4. `taskStore.markTaskMissed(taskId)` called for each.

### Onboarding Flow
```
WelcomeScreen → OnboardingScreen → NameSetupScreen → PermissionSetupScreen
```
- `PermissionSetupScreen` calls `onboardingStore.completeOnboarding()` on finish.
- `AppNavigator` re-renders and switches to `RootStack`.

### Rating Prompt Flow
1. `ratingStore.recordAppOpen()` called in App.tsx on mount.
2. `ratingStore.recordTaskCompletion()` called inside `taskStore.completeTask()`.
3. `ratingStore.recordStruggle()` called inside `taskStore.struggleTask()`.
4. After `SuccessAnimation` finishes → `ratingStore.shouldShowRatingPrompt()` checked.
5. If `shouldShow === true` → `<RatingPromptSheet />` rendered in `ReminderOverlay`.
6. User rates → `ratingStore.markAppRated()` → `ratingPrompt.openPlayStoreRating()`.
7. User dismisses → `ratingStore.markRatingPromptShown()`.

---

## 13. Android Permissions & Native Config

**Android permissions in `app.json`**:
- `android.permissions.VIBRATE`
- `android.permissions.POST_NOTIFICATIONS`
- `android.permissions.SCHEDULE_EXACT_ALARM`
- `android.permissions.SYSTEM_ALERT_WINDOW`
- `android.permissions.RECEIVE_BOOT_COMPLETED`
- `android.permissions.USE_FULL_SCREEN_INTENT`

**Android SDK versions**:
- `compileSdkVersion: 35`, `targetSdkVersion: 35`, `minSdkVersion: 24`
- `edgeToEdgeEnabled: true`
- `predictiveBackGestureEnabled: false`
- `newArchEnabled: true`

**Expo plugins**:
- `expo-font`
- `@react-native-community/datetimepicker`
- `expo-build-properties` (SDK versions)
- `expo-audio`
- `./plugins/withNotifee.js` — custom plugin that injects Android permissions, notification sounds, and a native Java module for full-screen/overlay reminder behavior
- `expo-asset`

---

## 14. Design System Rules

These rules are non-negotiable for all UI changes:

1. **Icons**: Only `Feather` from `@expo/vector-icons`. No other icon library.
2. **Colors**: Always import from `src/utils/colors.ts`. No hardcoded hex values anywhere.
3. **Typography**: Always use `Typography` + `FontFamily` from `src/utils/typography.ts`.
4. **Spacing**: Always use `Spacing`, `BorderRadius`, `Shadows` from `src/utils/spacing.ts`. No magic numbers.
5. **Buttons**: Use `<Button>` from `src/components/ui/Button.tsx`.
6. **Cards**: Use `<Card>` from `src/components/ui/Card.tsx`.
7. **Text inputs**: Use `<Input>` from `src/components/ui/Input.tsx`.
8. **Min touch target**: `MIN_TOUCH_TARGET = 48` px.
9. **Safe area**: Use `useSafeAreaInsets()` from `react-native-safe-area-context` — edge-to-edge is enabled on Android.
10. **Fonts**: App will not render until `fontsLoaded` is true (handled in `App.tsx`).

---

## 15. AsyncStorage Key Reference

| Key | Store | Persists |
|-----|-------|----------|
| `showd-tasks` | taskStore | tasks[], events[] |
| `showd-permissions` | permissionStore | onboardingPermissionsCompleted, oemSetupCompleted, permissionBannerDismissedAt |
| `showd-sound` | soundStore | selectedSoundId |
| `showd-onboarding` | onboardingStore | hasCompletedOnboarding, userName, defaultSnoozeLimit |
| `showd-rating` | ratingStore | All rating state |
| `showd-reminder-v3` | — | Notifee channel ID (not a store key) |

`reminderStore` and `timerStore` are **not persisted** — they reset on app kill.
