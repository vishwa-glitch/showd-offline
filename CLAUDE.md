# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

All commands run from the `showd/` directory:

```bash
npm start              # Start Metro bundler
npm run android        # Start on Android device/emulator
npm run ios            # Start on iOS simulator
npx tsc --noEmit       # TypeScript check (run after every code change)
npx expo prebuild      # Regenerate native projects after config changes
eas build --profile development   # Dev build with expo-dev-client
eas build --profile preview       # Preview APK
```

No test framework is configured yet. Verify changes with `npx tsc --noEmit`.

## Architecture

### Offline-First Design
The app is fully offline with no backend dependencies. All data is persisted locally via AsyncStorage through Zustand's `persist` middleware. There is no authentication, no subscription/paywall, and no server sync. All features are free.

### Entry Flow
`index.ts` → `App.tsx` (font loading, splash screen, global hooks, notification handlers) → `AppNavigator.tsx` (onboarding gate + navigation tree + ReminderOverlay)

### Navigation (React Navigation, NOT Expo Router)
- **New user**: `AuthStack` — Welcome → Onboarding → NameSetup → PermissionSetup
- **Onboarded**: `RootStack` containing `MainTabs` (Today / Progress / Settings) + modal screens (TaskDetail, CreateTask, EditTask, FocusTimer, ReminderSound, SnoozeLimit)
- **Global overlay**: `ReminderOverlay` renders inside `NavigationContainer` (required for `useNavigation` access) and manages FullScreenReminder, StrugglingSheet, SuccessAnimation, PostTimerCompletion, RatingPromptSheet

### State Management — Zustand 5 with named selector hooks

6 stores in `src/store/`:
- `onboardingStore` — onboarding completion flag, user name, default snooze limit (persisted)
- `taskStore` — tasks and events CRUD (persisted)
- `reminderStore` — active reminder queue, struggling sheet, success animation state
- `timerStore` — focus timer countdown, pause/resume, extensions
- `permissionStore` — Android permission states, onboarding permission flag
- `ratingStore` — app rating prompt triggers, streaks, cooldown tracking (persisted)
- `soundStore` — selected reminder sound (persisted)

Pattern used consistently:
```typescript
const useStoreBase = create<State>((set, get) => ({ ... }));
// Primitives/functions: direct selector
export const useValue = () => useStoreBase((s) => s.value);
// Arrays/objects: useShallow to prevent unnecessary rerenders
export const useItems = () => useStoreBase(useShallow((s) => s.items));
```

### Services Layer (`src/services/`)
Pure functions and async wrappers — no direct store access. Called from hooks/components.
- `notifications.ts` — Notifee channel setup, scheduling, snooze, cancel
- `permissions.ts` — Android permission checks/requests (notifications, exact alarm, battery, overlay)
- `missedTaskChecker.ts` — Detects tasks past their window
- `timerNotification.ts` — Persistent countdown notification
- `soundPlayer.ts` — Plays reminder sounds
- `ratingPrompt.ts` — Opens Play Store rating page

### Global Hooks (registered in App.tsx)
- `useMissedTaskChecker` — checks every 60s + on app foreground
- `useTimerTick` — 1-second countdown driving timerStore
- `useAbandonedTimerDetector` — auto-abandons paused timers after 30 min

### Notification Architecture
Uses `@notifee/react-native` (not Expo Notifications for scheduling). Background handler registered at module level in App.tsx. Full-screen intents on Android for unskippable reminders. Custom Expo plugin (`plugins/withNotifee.js`) adds Android manifest permissions. Per-sound notification channels.

### Rating Prompt System
Triggered after success animation via ReminderOverlay. Triggers: streak milestones (3/7/14 days), 10th task completion, struggle-then-complete. 5-day cooldown between prompts. State tracked in ratingStore. Task completions and struggles are recorded from taskStore.

## Key Conventions

- **Icons**: Only Feather from `@expo/vector-icons` (lucide has React 19 peer dep conflict)
- **Font**: Outfit (400 Regular, 500 Medium, 600 SemiBold, 700 Bold) via `@expo-google-fonts/outfit`
- **Design tokens**: Import from `src/utils/colors.ts`, `typography.ts`, `spacing.ts` — never hardcode colors/fonts/spacing
- **TypeScript**: Strict mode, `readonly` array params for functions accepting store data (useShallow returns readonly)
- **Path alias**: `@/*` maps to `src/*` (configured in tsconfig.json)
- **Component styles**: `StyleSheet.create` at bottom of file using design tokens
- **Navigation types**: Screen props derived from typed param lists in `src/types/navigation.ts`

## Tech Stack

- React Native 0.81 + Expo SDK 54 (managed workflow, new architecture enabled)
- React 19, TypeScript 5.9 (strict)
- Zustand 5 with `useShallow`
- React Navigation 7 (native-stack + bottom-tabs)
- @notifee/react-native for notifications
- react-native-reanimated 4 for animations
- expo-device for OEM detection
- AsyncStorage for all local persistence
