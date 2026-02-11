// ============================================
// DEMO MODE: Cloud sync disabled.
// Search for [SUPABASE-TODO] to restore.
// ============================================

// [SUPABASE-TODO] Restore full sync hook:
// import { useEffect, useRef } from 'react';
// import { AppState } from 'react-native';
// import { useUser, useIsGuest } from '../store/authStore';
// import { useHydrateTasks } from '../store/taskStore';
// import { useHydrateWitnesses } from '../store/witnessStore';
// import { flushQueue, pullFromCloud } from '../services/syncEngine';

/** No-op in demo mode. */
export function useSyncOnForeground() {
  // [SUPABASE-TODO] Restore: flush offline queue + pull from cloud on mount/foreground
}
