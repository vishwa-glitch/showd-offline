# 🔧 SHOWD — Offline-First Refactoring Plan

> **Goal**: Transform Showd from a backend-dependent app (Supabase + auth + witness system + paywall) into a **fully offline, local-storage-only, personal accountability app** with no login, no backend, no paywall, and a smart Play Store rating prompt.

---

## 📋 Table of Contents

1. [High-Level Summary](#1-high-level-summary)
2. [What Gets REMOVED](#2-what-gets-removed)
3. [What Gets KEPT](#3-what-gets-kept)
4. [What Gets ADDED (Rating Prompt)](#4-what-gets-added-rating-prompt)
5. [Phase 1 — Uninstall Packages](#phase-1--uninstall-packages)
6. [Phase 2 — Remove Backend Layer](#phase-2--remove-backend-layer)
7. [Phase 3 — Remove Auth System](#phase-3--remove-auth-system)
8. [Phase 4 — Remove Witness System](#phase-4--remove-witness-system)
9. [Phase 5 — Remove Paywall / Subscription System](#phase-5--remove-paywall--subscription-system)
10. [Phase 6 — Simplify Stores for Offline-Only](#phase-6--simplify-stores-for-offline-only)
11. [Phase 7 — Simplify Navigation (No Auth Gate)](#phase-7--simplify-navigation-no-auth-gate)
12. [Phase 8 — Simplify Settings Screen](#phase-8--simplify-settings-screen)
13. [Phase 9 — Clean Up Types](#phase-9--clean-up-types)
14. [Phase 10 — Implement Rating Prompt System](#phase-10--implement-rating-prompt-system)
15. [Phase 11 — Cleanup .env, Supabase folder, witness-web](#phase-11--cleanup-env-supabase-folder-witness-web)
16. [Phase 12 — Update CLAUDE.md and App Metadata](#phase-12--update-claudemd-and-app-metadata)
17. [Phase 13 — Test & Verify](#phase-13--test--verify)
18. [File-by-File Impact Map](#file-by-file-impact-map)

---

## 1. High-Level Summary

### Current Architecture
```
User → Auth (OTP via Supabase) → Main App
                                   ├── Tasks stored in Zustand + synced to Supabase
                                   ├── Witness system (SMS via Twilio Edge Functions)
                                   ├── Subscription/Paywall (RevenueCat + trial logic)
                                   ├── Cloud sync on foreground
                                   └── Web dashboard for witnesses
```

### Target Architecture
```
User → Onboarding (name only, no phone/OTP) → Main App
                                                 ├── Tasks stored in Zustand + AsyncStorage (fully offline)
                                                 ├── No witness system
                                                 ├── No paywall — all features FREE
                                                 ├── No cloud sync
                                                 ├── Smart rating prompt (after streak milestones)
                                                 └── No web dashboard needed
```

---

## 2. What Gets REMOVED

### Packages to Uninstall
| Package | Reason |
|---------|--------|
| `@supabase/supabase-js` | No backend |
| `react-native-purchases` | No paywall / RevenueCat |
| `expo-image-picker` | Photo proof was behind paywall; remove if not needed for personal use. 



### Files to DELETE (inside `showd/src/`)
| File | Reason |
|------|--------|
| `services/supabase.ts` | Supabase client — no backend |
| `services/database.ts` | All Supabase CRUD operations |
| `services/syncEngine.ts` | Cloud sync + offline queue |
| `services/auth.ts` | OTP auth via Supabase |
| `services/api.ts` | Edge Function calls (witness invite, respond, etc.) |
| `services/purchases.ts` | RevenueCat stubs |
| `services/witness.ts` | Witness SMS functions |
| `hooks/useSyncOnForeground.ts` | Syncs data from Supabase on foreground |
| `hooks/useWitnessNotifier.ts` | Watches for missed/struggled events to SMS witnesses |
| `store/subscriptionStore.ts` | Subscription/trial state |
| `store/witnessStore.ts` | Witness connections state |
| `store/authStore.ts` | Auth state (will be replaced with simpler onboarding store) |
| `utils/proGates.ts` | Feature gating logic (everything is free now) |
| `utils/trialUtils.ts` | Trial period calculations |
| `utils/mappers.ts` | DB ↔ App type mappers (no DB) |
| `utils/mockData.ts` | Mock data (review — might have useful sample tasks) |
| `types/database.ts` | Supabase row types |
| `types/subscription.ts` | Paywall types |
| `types/witness.ts` | Witness connection types |
| `types/user.ts` | User type (will be replaced with simpler profile type) |
| `components/subscription/LockOverlay.tsx` | Pro lock overlay |
| `components/subscription/PostMissNudge.tsx` | Post-miss nudge component |
| `components/subscription/ProBadge.tsx` | "Pro" badge component |
| `components/subscription/TrialBanner.tsx` | Trial banner component |
| `components/subscription/TrialExpiryModal.tsx` | Trial expiry modal |
| `components/witness/WitnessConnectionCard.tsx` | Witness card component |
| `components/witness/WitnessStatusBadge.tsx` | Witness status badge |
| `screens/auth/PhoneInputScreen.tsx` | Phone number input |
| `screens/auth/OTPVerifyScreen.tsx` | OTP verification |
| `screens/auth/ProfileSetupScreen.tsx` | Profile setup (has Supabase calls) — will be replaced |
| `screens/modals/PaywallScreen.tsx` | Paywall modal |
| `screens/main/MyWitnessesScreen.tsx` | Witness management screen |
| `screens/settings/EditProfileScreen.tsx` | Edit profile (has Supabase calls) — will be replaced |
| `screens/settings/PeopleISupportScreen.tsx` | "People I Support" screen (witness feature) |
| `screens/settings/QuietHoursScreen.tsx` | Can be kept or removed — your call |

### Root-Level Files to DELETE
| File | Reason |
|------|--------|
| `SUPABASE_SETUP.md` | No Supabase |
| `WITNESS_WEB_DEPLOY.md` | No witness web |
| `witness_web_prompt.md` | No witness web |
| `showd/.env` (clean up) | Remove Supabase + Twilio + RevenueCat keys |

---

## 3. What Gets KEPT

### Core Features (ALL FREE, no limits)
- ✅ **Task creation** — unlimited tasks
- ✅ **Task reminders** — Notifee full-screen reminders
- ✅ **Focus timer** — timed tasks with extensions
- ✅ **Snooze** — no limit restrictions (was 1 for free, 3 for Pro — now unlimited or 3 for all)
- ✅ **Struggling flow** — mark "struggling" with reason + note
- ✅ **Progress tracking** — full streaks, completion history
- ✅ **Onboarding** — Welcome + Onboarding screens (simplified, no phone/OTP)
- ✅ **Permission setup** — notification + battery optimization permissions
- ✅ **Settings** — snooze limit, reminder sound, feedback, privacy, terms

### Packages to KEEP
| Package | Use |
|---------|-----|
| `@react-native-async-storage/async-storage` | Local storage for all data |
| `@notifee/react-native` | Full-screen reminders |
| `@react-navigation/native` + stacks + tabs | Navigation |
| `zustand` | State management |
| `react-native-reanimated` | Animations |
| `react-native-gesture-handler` | Gestures |
| `react-native-safe-area-context` | Safe area |
| `react-native-screens` | Native screens |
| `react-native-svg` | SVG icons/graphics |
| `react-native-pager-view` | Onboarding pager |
| `expo-av` | Sound playback |
| `expo-haptics` | Haptic feedback |
| `expo-font` + `@expo-google-fonts/outfit` | Typography |
| `expo-splash-screen` | Splash screen |
| `expo-status-bar` | Status bar |
| `expo-device` | OEM detection |
| `expo-notifications` | Basic notification permissions |
| `expo-dev-client` | Development |
| `expo-build-properties` | Build config |
| `@expo/vector-icons` | Icons |
| `@react-native-community/datetimepicker` | Time picker |

### Stores to KEEP (modified)
| Store | Changes |
|-------|---------|
| `taskStore.ts` | Remove `userId` dependency, remove `hydrateFromCloud`, remove any sync calls |
| `reminderStore.ts` | Keep as-is |
| `timerStore.ts` | Keep as-is |
| `permissionStore.ts` | Keep as-is |
| `soundStore.ts` | Keep as-is |

### Hooks to KEEP
| Hook | Changes |
|------|---------|
| `useMissedTaskChecker.ts` | Keep as-is |
| `useTimerTick.ts` | Keep as-is |
| `useAbandonedTimerDetector.ts` | Keep as-is |

---

## 4. What Gets ADDED (Rating Prompt)

### New Files to Create

#### `src/store/ratingStore.ts`
A Zustand store (persisted to AsyncStorage) that tracks:
```typescript
interface RatingState {
  // Tracking
  totalCompletedTasks: number;           // Lifetime completed task count
  currentStreak: number;                  // Current daily streak (days user opened + completed at least 1 task)
  lastActiveDate: string | null;         // Last date user completed a task (YYYY-MM-DD)
  hasStruggleThenCompleted: boolean;     // Flag: user struggled on a task today, then completed it anyway
  
  // Rating prompt state
  lastRatingPromptDate: string | null;   // ISO date when last shown
  hasRatedApp: boolean;                  // User tapped "Rate" at least once
  ratingPromptCount: number;             // How many times we've shown the prompt
  
  // Actions
  recordTaskCompletion: () => void;      // Called when user marks task "Done"
  recordStruggle: () => void;            // Called when user taps "Struggling"
  shouldShowRatingPrompt: () => RatingTriggerResult;
  markRatingPromptShown: () => void;
  markAppRated: () => void;
}

interface RatingTriggerResult {
  shouldShow: boolean;
  trigger: 'streak_3' | 'streak_7' | 'streak_14' | 'task_10' | 'struggle_then_complete' | null;
  streakCount?: number;
  taskCount?: number;
}
```

**Rating Prompt Logic (in `shouldShowRatingPrompt`):**
1. **Never show** if `hasRatedApp === true`
2. **Never show** on first or second app open
3. **Never show** if shown within the last **5 days** (user's request: "ask every 5 days once")
4. **Trigger conditions** (in priority order):
   - User hits streak milestone (Day 3, Day 7, Day 14) → show AFTER celebration animation
   - User completes 10th lifetime task → show
   - User was struggling today → then completed the task anyway → show
5. **Cooldown**: 5 days between prompts (regardless of trigger)

#### `src/components/ui/RatingPromptSheet.tsx`
A bottom sheet component (not a popup/modal) for the rating prompt:

```
┌─────────────────────────────────────┐
│  ▬  (drag handle)                   │
│                                     │
│  🔥 {streakCount} Day Streak!       │   ← Dynamic based on trigger
│                                     │
│  You've shown up {X} days in a row. │
│  That's genuinely impressive.       │
│                                     │
│  If Showd is helping you,           │
│  a quick rating means the world     │
│  to an indie developer. 🙏          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    ⭐ Rate on Play Store    │    │   ← Opens Play Store
│  └─────────────────────────────┘    │
│                                     │
│       Not right now                 │   ← Dismisses, sets cooldown
│                                     │
│  (Won't bug you for 5 days)         │
│                                     │
└─────────────────────────────────────┘
```

**Variants based on trigger:**

1. **Streak Milestone (Day 3, 7, 14)**:
   - Title: `🔥 {X} Day Streak!`
   - Body: `You've shown up {X} days in a row. That's genuinely impressive.`
   - CTA context: `If Showd is helping you, a quick rating means the world to an indie developer. 🙏`

2. **10th Completed Task**:
   - Title: `Enjoying Showd? 🙏`
   - Body: `You've completed {X} tasks. Takes 30 seconds. Means a lot.`

3. **Struggle → Then Complete**:
   - Title: `You showed up anyway 💪`
   - Body: `You struggled, but you showed up anyway. That's what Showd is for.`
   - CTA context: `If this helped, a rating helps us help more people.`

**Design Requirements:**
- Bottom sheet style (swipe down to dismiss)
- Native feel on Android
- Uses existing design tokens (`Colors`, `Typography`, `Spacing`)
- Smooth slide-up animation using `react-native-reanimated`
- Semi-transparent backdrop
- Handle bar at top

#### `src/services/ratingPrompt.ts`
Utility to open the Play Store rating page:
```typescript
import { Linking, Platform } from 'react-native';

const PLAY_STORE_URL = 'market://details?id=YOUR_PACKAGE_NAME';
const PLAY_STORE_WEB_URL = 'https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME';

export async function openPlayStoreRating(): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(PLAY_STORE_URL);
    if (supported) {
      await Linking.openURL(PLAY_STORE_URL);
    } else {
      await Linking.openURL(PLAY_STORE_WEB_URL);
    }
  } catch {
    await Linking.openURL(PLAY_STORE_WEB_URL);
  }
}
```

#### `src/store/onboardingStore.ts`
Replace the auth store with a simple onboarding store:
```typescript
interface OnboardingState {
  hasCompletedOnboarding: boolean;
  userName: string;
  
  completeOnboarding: (name: string) => void;
  updateName: (name: string) => void;
}
```
- Persisted to AsyncStorage
- No phone, no userId, no auth tokens
- The `userName` is optional — purely for personalization ("Good morning, {name}")

---

## Phase 1 — Uninstall Packages

### Step 1.1: Uninstall backend/paywall packages
```bash
cd showd
npm uninstall @supabase/supabase-js react-native-purchases
```

### Step 1.2: Optionally uninstall `expo-image-picker`
```bash
# Only if you don't want local photo proof anymore
npm uninstall expo-image-picker
```

### Step 1.3: Verify `package.json`
Confirm only the KEEP list packages remain in `dependencies`.

---

## Phase 2 — Remove Backend Layer

### Step 2.1: Delete backend service files
```
DELETE: src/services/supabase.ts
DELETE: src/services/database.ts
DELETE: src/services/syncEngine.ts
DELETE: src/services/api.ts
DELETE: src/services/auth.ts
DELETE: src/services/purchases.ts
DELETE: src/services/witness.ts
```

### Step 2.2: Delete sync hook
```
DELETE: src/hooks/useSyncOnForeground.ts
DELETE: src/hooks/useWitnessNotifier.ts
```

### Step 2.3: Delete database/mapper types
```
DELETE: src/types/database.ts
DELETE: src/utils/mappers.ts
DELETE: src/utils/mockData.ts (review first — keep if sample data is useful)
```

---

## Phase 3 — Remove Auth System

### Step 3.1: Delete auth screens
```
DELETE: src/screens/auth/PhoneInputScreen.tsx
DELETE: src/screens/auth/OTPVerifyScreen.tsx
DELETE: src/screens/auth/ProfileSetupScreen.tsx
```

### Step 3.2: Delete auth store
```
DELETE: src/store/authStore.ts
```

### Step 3.3: Create new `onboardingStore.ts`
Create `src/store/onboardingStore.ts` with:
- `hasCompletedOnboarding: boolean` (persisted)
- `userName: string` (persisted)
- `completeOnboarding(name)` — sets both
- `updateName(name)` — updates name

### Step 3.4: Update `User` type → `Profile` type
Replace `src/types/user.ts` with a simple profile type:
```typescript
export interface UserProfile {
  name: string;
  defaultSnoozeLimit: number;
  reminderSoundId: string;
}
```
No `id`, no `phone`, no Supabase-related fields.

### Step 3.5: Remove Supabase auth listener from `App.tsx`
- Remove the `supabase.auth.onAuthStateChange` effect
- Remove imports for `supabase`, `getUser`, `dbToUser`, `useSignIn`, `useSignOut`, `useUser`
- Remove `useSyncOnForeground()` call
- Remove `useWitnessNotifier()` call
- Remove `useInitSubscription()` call and import
- Keep: fonts, notifications, permissions, timer hooks

---

## Phase 4 — Remove Witness System

### Step 4.1: Delete witness files
```
DELETE: src/store/witnessStore.ts
DELETE: src/types/witness.ts
DELETE: src/components/witness/WitnessConnectionCard.tsx
DELETE: src/components/witness/WitnessStatusBadge.tsx
DELETE: src/screens/main/MyWitnessesScreen.tsx
DELETE: src/screens/settings/PeopleISupportScreen.tsx
```

### Step 4.2: Clean up Task type
In `src/types/task.ts`:
- Remove `AccountabilityType` (or simplify to just `'personal' | 'none'` — but since there's no real accountability, just remove it entirely or keep as `'none'` always)
- Remove fields from `Task` interface:
  - `witnessPhone`, `witnessName`, `witnessRelationship`, `witnessConnectionId`
  - Keep `personalWitnessName`, `personalWitnessPhotoUrl` if you want users to set a "thinking of" person locally
  - Remove `accountabilityType` entirely (everything is personal now)
- Remove from `TaskFormData`:
  - `accountabilityType`, `witnessPhone`, `witnessName`, `witnessRelationship`, `personalWitnessName`
- Remove from `DEFAULT_FORM_DATA`:
  - Same fields as above

### Step 4.3: Clean up task form components
In `src/components/task/` — look for any accountability type selector or witness phone input fields and remove them.

---

## Phase 5 — Remove Paywall / Subscription System

### Step 5.1: Delete subscription files
```
DELETE: src/store/subscriptionStore.ts
DELETE: src/services/purchases.ts
DELETE: src/utils/proGates.ts
DELETE: src/utils/trialUtils.ts
DELETE: src/types/subscription.ts
DELETE: src/components/subscription/LockOverlay.tsx
DELETE: src/components/subscription/PostMissNudge.tsx
DELETE: src/components/subscription/ProBadge.tsx
DELETE: src/components/subscription/TrialBanner.tsx
DELETE: src/components/subscription/TrialExpiryModal.tsx
DELETE: src/screens/modals/PaywallScreen.tsx
```

### Step 5.2: Remove all Pro gate checks throughout the app
Search the codebase for:
- `useIsPro` / `isPro` → Remove all checks, assume always true
- `useIsTrialActive` / `isTrialActive` → Remove
- `canAccessFeature` → Remove all calls
- `PaywallReason` → Remove
- `ProBadge` → Remove all usages
- `TrialBanner` → Remove all usages
- `TrialExpiryModal` → Remove
- `LockOverlay` → Remove all usages
- `navigation.navigate('Paywall'...)` → Remove all calls
- `PostMissNudge` → Remove

### Step 5.3: Unlock all features
- **Task limit**: Remove the 3-task limit for free users → unlimited
- **Snooze limit**: Was 1 for free, 3 for Pro → set default to 3 (or make configurable)
- **Photo proof**: Remove Pro gate → always available
- **Custom sound**: Remove Pro gate → always available
- **Full progress**: Remove Pro gate → always available
- **Real accountability**: Being removed entirely (witness system)

---

## Phase 6 — Simplify Stores for Offline-Only

### Step 6.1: Simplify `taskStore.ts`
- Remove `userId` parameter from `addTask` — generate a local-only UUID or just use a constant like `'local_user'`
- Remove `hydrateFromCloud(tasks, events)` method
- Remove any calls to `syncEngine` (pushTask, pushEvent, etc.)
- Task and event data is already persisted via Zustand `persist` middleware → this is your offline storage ✅
- Remove `useHydrateTasks` export

### Step 6.2: Simplify the `Task` type references throughout
- Since `userId` is no longer meaningful, either:
  - Keep it as a constant `'local'` for compatibility
  - Or remove it entirely from the `Task` interface

### Step 6.3: Simplify `reminderStore.ts`
- Should already be fine — review for any witness/subscription references

### Step 6.4: Remove `mockData.ts` references
- Search for any imports of `mockData` and remove them

---

## Phase 7 — Simplify Navigation (No Auth Gate)

### Step 7.1: Update `AppNavigator.tsx`
Currently:
```tsx
const isAuthenticated = useIsAuthenticated();
return (
  <NavigationContainer>
    {isAuthenticated ? <RootStack /> : <AuthStack />}
    <ReminderOverlay />
  </NavigationContainer>
);
```

Change to:
```tsx
const hasCompletedOnboarding = useHasCompletedOnboarding(); // from onboardingStore
return (
  <NavigationContainer>
    {hasCompletedOnboarding ? <RootStack /> : <OnboardingStack />}
    <ReminderOverlay />
  </NavigationContainer>
);
```

### Step 7.2: Simplify `AuthStack.tsx` → `OnboardingStack.tsx`
Rename and simplify:
- Screen 1: `WelcomeScreen` (keep as-is)
- Screen 2: `OnboardingScreen` (keep as-is — the swipeable pages explaining the app)
- Screen 3: `NameSetupScreen` (new, simple) — ask for name (optional), then proceed
- Screen 4: `PermissionSetupScreen` (keep as-is)
- **REMOVE**: `PhoneInputScreen`, `OTPVerifyScreen`, `ProfileSetupScreen`

### Step 7.3: Create `NameSetupScreen.tsx`
Simple screen:
- "What should we call you?" with a text input
- "Skip" button (name is optional)
- "Continue" button
- On continue: `onboardingStore.completeOnboarding(name)`
- Navigates to `PermissionSetup`

### Step 7.4: Update `RootStack.tsx`
Remove these stack screens:
- `MyWitnesses`
- `EditProfile` (replace with simplified version that just edits name)
- `QuietHours` (remove if you want — was already requested to remove previously)
- `PeopleISupport`
- `Paywall`

### Step 7.5: Update `MainTabs.tsx`
- Review for any Pro/subscription badges on tab icons

### Step 7.6: Update navigation types (`src/types/navigation.ts`)
- Remove `AuthStackParamList` entries for `PhoneInput`, `OTPVerify`, `ProfileSetup`
- Add `NameSetup` to the onboarding param list
- Remove `MyWitnesses`, `EditProfile`, `QuietHours`, `PeopleISupport`, `Paywall` from `RootStackParamList`
- Remove corresponding screen prop types

---

## Phase 8 — Simplify Settings Screen

### Step 8.1: Update `SettingsScreen.tsx`
**Remove these rows:**
- "My Witnesses" row
- "People I Support" row
- "Edit Profile" row (or simplify to just "Edit Name")
- "Quiet Hours" row (previously requested to remove)
- Any "Upgrade to Pro" / "Manage Subscription" row
- "Delete Account" (no account to delete)
- "Sign Out" (no auth)

**Keep these rows:**
- "How Showd Works" — keep
- "Snooze Limit" — keep
- "Reminder Sound" — keep
- "Send Feedback" — keep
- "Privacy Policy" — keep
- "Terms of Service" — keep
- "Rate Showd" — **ADD** (opens Play Store directly)

**Add these rows:**
- "Your Name" — simple row showing current name, tappable to edit inline or navigate to a simple edit screen
- "Rate Showd ⭐" — opens Play Store

### Step 8.2: Remove `handleSignOut` and `handleDeleteAccount` functions
- These are no longer needed

### Step 8.3: Remove import of `signOut`, `deleteAccount`, subscription hooks, etc.

---

## Phase 9 — Clean Up Types

### Step 9.1: Simplify `src/types/task.ts`
```typescript
// REMOVE:
export type AccountabilityType = 'real' | 'personal' | 'none';

// In Task interface, REMOVE:
accountabilityType: AccountabilityType;
witnessPhone?: string;
witnessName?: string;
witnessRelationship?: string;
witnessConnectionId?: string;
personalWitnessName?: string;
personalWitnessPhotoUrl?: string;

// In TaskFormData, REMOVE:
accountabilityType: AccountabilityType;
witnessPhone: string;
witnessName: string;
witnessRelationship: string;
personalWitnessName: string;

// In DEFAULT_FORM_DATA, REMOVE:
accountabilityType: 'none',
witnessPhone: '',
witnessName: '',
witnessRelationship: '',
personalWitnessName: '',
```

### Step 9.2: Delete `src/types/witness.ts`
Already listed above.

### Step 9.3: Delete `src/types/subscription.ts`
Already listed above.

### Step 9.4: Delete `src/types/database.ts`
Already listed above.

### Step 9.5: Simplify `src/types/user.ts`
Replace with:
```typescript
export interface UserProfile {
  name: string;
  defaultSnoozeLimit: number;
  reminderSoundId: string;
}
```

### Step 9.6: Update `src/types/navigation.ts`
Remove all auth/witness/paywall screen types. Final ParamLists:

```typescript
export type OnboardingStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  NameSetup: undefined;
  PermissionSetup: undefined;
};

export type MainTabParamList = {
  Today: undefined;
  Progress: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  CreateTask: undefined;
  EditTask: { taskId: string };
  TaskDetail: { taskId: string };
  FocusTimer: { taskId: string; taskEventId: string };
  HowShowdWorks: undefined;
  SnoozeLimit: undefined;
  ReminderSound: undefined;
  SendFeedback: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};
```

---

## Phase 10 — Implement Rating Prompt System

### Step 10.1: Create `src/store/ratingStore.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RatingTriggerResult {
  shouldShow: boolean;
  trigger: 'streak_3' | 'streak_7' | 'streak_14' | 'task_10' | 'struggle_then_complete' | null;
  streakCount?: number;
  taskCount?: number;
}

interface RatingState {
  // Tracking
  totalCompletedTasks: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  hasStruggleThenCompletedToday: boolean;
  appOpenCount: number;
  
  // Rating prompt state
  lastRatingPromptDate: string | null;
  hasRatedApp: boolean;
  ratingPromptCount: number;
  
  // Actions
  recordAppOpen: () => void;
  recordTaskCompletion: () => void;
  recordStruggle: () => void;
  shouldShowRatingPrompt: () => RatingTriggerResult;
  markRatingPromptShown: () => void;
  markAppRated: () => void;
}
```

**Key Logic:**

```typescript
recordTaskCompletion: () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const { lastActiveDate, currentStreak } = get();
  
  let newStreak = currentStreak;
  if (lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    newStreak = lastActiveDate === yesterday ? currentStreak + 1 : 1;
  }
  
  set((state) => ({
    totalCompletedTasks: state.totalCompletedTasks + 1,
    currentStreak: newStreak,
    longestStreak: Math.max(state.longestStreak, newStreak),
    lastActiveDate: today,
  }));
},

shouldShowRatingPrompt: () => {
  const {
    hasRatedApp,
    appOpenCount,
    lastRatingPromptDate,
    currentStreak,
    totalCompletedTasks,
    hasStruggleThenCompletedToday,
  } = get();
  
  // Never show if already rated
  if (hasRatedApp) return { shouldShow: false, trigger: null };
  
  // Never show on first or second open
  if (appOpenCount <= 2) return { shouldShow: false, trigger: null };
  
  // Cooldown: 5 days between prompts
  if (lastRatingPromptDate) {
    const daysSinceLastPrompt = Math.floor(
      (Date.now() - new Date(lastRatingPromptDate).getTime()) / 86400000
    );
    if (daysSinceLastPrompt < 5) return { shouldShow: false, trigger: null };
  }
  
  // Priority 1: Streak milestones
  if ([3, 7, 14].includes(currentStreak)) {
    return {
      shouldShow: true,
      trigger: `streak_${currentStreak}` as any,
      streakCount: currentStreak,
    };
  }
  
  // Priority 2: 10th completed task
  if (totalCompletedTasks === 10) {
    return {
      shouldShow: true,
      trigger: 'task_10',
      taskCount: totalCompletedTasks,
    };
  }
  
  // Priority 3: Struggled then completed
  if (hasStruggleThenCompletedToday) {
    return { shouldShow: true, trigger: 'struggle_then_complete' };
  }
  
  return { shouldShow: false, trigger: null };
},
```

### Step 10.2: Create `src/services/ratingPrompt.ts`
Simple utility to open Play Store:
```typescript
import { Linking, Platform } from 'react-native';

// Replace with your actual package name
const PACKAGE_NAME = 'com.showd.app';

export async function openPlayStoreRating(): Promise<void> {
  const playStoreUrl = `market://details?id=${PACKAGE_NAME}`;
  const webUrl = `https://play.google.com/store/apps/details?id=${PACKAGE_NAME}`;
  
  try {
    const supported = await Linking.canOpenURL(playStoreUrl);
    await Linking.openURL(supported ? playStoreUrl : webUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
}
```

### Step 10.3: Create `src/components/ui/RatingPromptSheet.tsx`
Bottom sheet component with:
- Drag handle bar
- Dynamic title/body based on trigger type
- "⭐ Rate on Play Store" primary button
- "Not right now" secondary text button
- "Won't bug you for 5 days" footer text
- Smooth slide-up animation
- Semi-transparent backdrop (tap to dismiss)
- Swipe down to dismiss

### Step 10.4: Integrate rating prompt into task completion flow
In `taskStore.ts` → `completeTask()`:
- After successfully completing, call `ratingStore.getState().recordTaskCompletion()`

In the **success animation** component (or wherever the celebration is shown after marking a task "Done"):
- After the celebration animation finishes, check `ratingStore.getState().shouldShowRatingPrompt()`
- If `shouldShow === true`, show the `RatingPromptSheet`

### Step 10.5: Integrate into the struggle → complete flow
When a user taps "Struggling" → then later completes the task:
- Call `ratingStore.getState().recordStruggle()` when struggling
- The `recordTaskCompletion()` will check if there was a struggle today and set `hasStruggleThenCompletedToday`

### Step 10.6: Track app opens
In `App.tsx`:
- On mount, call `ratingStore.getState().recordAppOpen()` to increment `appOpenCount`

---

## Phase 11 — Cleanup .env, Supabase folder, witness-web

### Step 11.1: Delete directories
```
DELETE: supabase/ (entire directory)
DELETE: witness-web/ (entire directory)
```

### Step 11.2: Delete root-level docs
```
DELETE: SUPABASE_SETUP.md
DELETE: WITNESS_WEB_DEPLOY.md
DELETE: witness_web_prompt.md
```

### Step 11.3: Clean up `.env`
The `showd/.env` file should either be deleted entirely or cleaned to only contain:
```env
# No backend configuration needed — Showd is fully offline
```

### Step 11.4: Clean up root `.env`
The root-level `.env` has Supabase/Twilio keys — delete or clean it.

---

## Phase 12 — Update CLAUDE.md and App Metadata

### Step 12.1: Rewrite `CLAUDE.md`
Update to reflect the new architecture:
- Remove all Supabase/backend references
- Remove auth flow description
- Remove witness system description
- Remove subscription/paywall description
- Add offline-only architecture description
- Update store list (remove authStore, subscriptionStore, witnessStore)
- Add ratingStore
- Update navigation flow (onboarding → main, no auth)

### Step 12.2: Update `app.json`
- Review for any Supabase/backend-related configuration
- Ensure package name is correct for Play Store rating

---

## Phase 13 — Test & Verify

### Step 13.1: TypeScript Check
```bash
cd showd
npx tsc --noEmit
```
Fix all type errors from removed imports/references.

### Step 13.2: Build Check
```bash
npx expo start
```
Verify the app starts without errors.

### Step 13.3: Functional Testing Checklist
- [ ] App opens → shows Welcome/Onboarding
- [ ] Onboarding completes → shows Today screen
- [ ] Create task → no limit on number of tasks
- [ ] Task reminder fires → full-screen notification
- [ ] Complete task → streak updates
- [ ] Snooze task → works (3 snoozes available)
- [ ] Struggle flow → works
- [ ] Progress screen → shows all data (no Pro gate)
- [ ] Settings → no "Sign Out", no "Delete Account", no witness rows
- [ ] Settings → "Rate Showd" row opens Play Store
- [ ] Custom sounds → no Pro gate
- [ ] Focus timer → works with extensions
- [ ] Rating prompt → shows after streak milestones
- [ ] Close app → reopen → all data persisted (AsyncStorage)
- [ ] No network calls made (airplane mode test)

---

## File-by-File Impact Map

### 🗑️ Files to DELETE (34 files + 2 directories)

#### Services (7 files)
| File | Lines |
|------|-------|
| `src/services/supabase.ts` | 15 |
| `src/services/database.ts` | 106 |
| `src/services/syncEngine.ts` | 179 |
| `src/services/auth.ts` | 165 |
| `src/services/api.ts` | 51 |
| `src/services/purchases.ts` | 62 |
| `src/services/witness.ts` | 103 |

#### Hooks (2 files)
| File | Lines |
|------|-------|
| `src/hooks/useSyncOnForeground.ts` | 49 |
| `src/hooks/useWitnessNotifier.ts` | 53 |

#### Stores (3 files)
| File | Lines |
|------|-------|
| `src/store/authStore.ts` | 79 |
| `src/store/subscriptionStore.ts` | 154 |
| `src/store/witnessStore.ts` | 131 |

#### Types (3 files)
| File | Lines |
|------|-------|
| `src/types/database.ts` | 153 |
| `src/types/subscription.ts` | 16 |
| `src/types/witness.ts` | 32 |

#### Utils (3 files)
| File | Lines |
|------|-------|
| `src/utils/proGates.ts` | 64 |
| `src/utils/trialUtils.ts` | 48 |
| `src/utils/mappers.ts` | 207 |

#### Components (7 files)
| File | Lines |
|------|-------|
| `src/components/subscription/LockOverlay.tsx` | ~25 |
| `src/components/subscription/PostMissNudge.tsx` | ~80 |
| `src/components/subscription/ProBadge.tsx` | ~20 |
| `src/components/subscription/TrialBanner.tsx` | ~150 |
| `src/components/subscription/TrialExpiryModal.tsx` | ~170 |
| `src/components/witness/WitnessConnectionCard.tsx` | ~120 |
| `src/components/witness/WitnessStatusBadge.tsx` | ~60 |

#### Screens (6 files)
| File | Lines |
|------|-------|
| `src/screens/auth/PhoneInputScreen.tsx` | ~350 |
| `src/screens/auth/OTPVerifyScreen.tsx` | ~250 |
| `src/screens/auth/ProfileSetupScreen.tsx` | ~130 |
| `src/screens/modals/PaywallScreen.tsx` | ~300 |
| `src/screens/main/MyWitnessesScreen.tsx` | ~220 |
| `src/screens/settings/PeopleISupportScreen.tsx` | ~140 |

#### Root-level (3 files + 2 directories)
| Path | Type |
|------|------|
| `supabase/` | Directory (20 files) |
| `witness-web/` | Directory (6 files) |
| `SUPABASE_SETUP.md` | File |
| `WITNESS_WEB_DEPLOY.md` | File |
| `witness_web_prompt.md` | File |

### ✏️ Files to MODIFY (15+ files)

| File | What Changes |
|------|-------------|
| `App.tsx` | Remove Supabase auth listener, sync hook, witness hook, subscription init |
| `src/navigation/AppNavigator.tsx` | Replace auth gate with onboarding gate |
| `src/navigation/AuthStack.tsx` → rename to `OnboardingStack.tsx` | Remove phone/OTP screens, add NameSetup |
| `src/navigation/RootStack.tsx` | Remove MyWitnesses, EditProfile, QuietHours, PeopleISupport, Paywall screens |
| `src/navigation/MainTabs.tsx` | Remove any Pro badges |
| `src/store/taskStore.ts` | Remove userId param, hydrateFromCloud, sync calls |
| `src/types/task.ts` | Remove witness/accountability fields |
| `src/types/navigation.ts` | Simplify param lists |
| `src/types/user.ts` | Simplify to UserProfile |
| `src/screens/main/SettingsScreen.tsx` | Remove witness/auth/paywall rows, add "Rate Showd" |
| `src/screens/main/TodayScreen.tsx` | Remove any Pro/trial banner references |
| `src/screens/main/ProgressScreen.tsx` | Remove Pro gate on full progress |
| `src/screens/main/TaskDetailScreen.tsx` | Remove witness info, Pro gates |
| `src/screens/modals/CreateTaskScreen.tsx` | Remove witness/accountability section |
| `src/screens/modals/EditTaskScreen.tsx` | Remove witness/accountability section |
| `src/screens/auth/WelcomeScreen.tsx` | Update navigation target |
| `src/screens/auth/OnboardingScreen.tsx` | Update navigation target |
| `src/screens/auth/PermissionSetupScreen.tsx` | Update to use onboardingStore instead of authStore |
| `src/screens/settings/EditProfileScreen.tsx` | Replace with simple name editor (or delete + inline in settings) |
| `package.json` | Remove uninstalled packages |
| `CLAUDE.md` | Full rewrite |
| `.env` | Clean up |

### ➕ Files to CREATE (5 files)

| File | Purpose |
|------|---------|
| `src/store/onboardingStore.ts` | Simple onboarding state (replaces authStore) |
| `src/store/ratingStore.ts` | Rating prompt tracking + trigger logic |
| `src/services/ratingPrompt.ts` | Play Store URL opener |
| `src/components/ui/RatingPromptSheet.tsx` | Bottom sheet rating prompt UI |
| `src/screens/auth/NameSetupScreen.tsx` | Simple name input screen (replaces ProfileSetup) |

---

## ⚡ Recommended Execution Order

```
1.  Phase 1  — Uninstall packages (npm uninstall)
2.  Phase 2  — Delete backend service files
3.  Phase 4  — Delete witness system files
4.  Phase 5  — Delete subscription/paywall files
5.  Phase 3  — Remove auth, create onboardingStore
6.  Phase 9  — Clean up types
7.  Phase 6  — Simplify remaining stores
8.  Phase 7  — Simplify navigation
9.  Phase 8  — Simplify settings
10. Phase 10 — Implement rating prompt
11. Phase 11 — Cleanup root-level files
12. Phase 12 — Update docs
13. Phase 13 — Test everything
```

> **Why this order?** Delete first (removes the most code), then build the replacements, then wire everything up, then test. Deleting before modifying avoids editing files that will just be deleted.

---

## 📊 Impact Summary

| Metric | Before | After |
|--------|--------|-------|
| npm packages | 28 | 25-26 |
| Service files | 12 | 5 (notifications, permissions, missedTaskChecker, timerNotification, soundPlayer + ratingPrompt) |
| Stores | 8 | 6 (taskStore, reminderStore, timerStore, permissionStore, soundStore, onboardingStore + ratingStore) |
| Hooks | 5 | 3 (useMissedTaskChecker, useTimerTick, useAbandonedTimerDetector) |
| Auth screens | 6 | 3 (Welcome, Onboarding, NameSetup + PermissionSetup) |
| Type files | 6 | 3 (task, navigation, user) |
| External dependencies | Supabase, Twilio, RevenueCat | **NONE** |
| Network calls | Many | **ZERO** |
| Login required | Yes (OTP) | **No** |
| Features behind paywall | 6+ | **ZERO** |
| Data storage | Supabase + AsyncStorage | **AsyncStorage only** |
