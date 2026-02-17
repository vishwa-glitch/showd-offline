import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useUser } from '../store/authStore';
import { useHydrateTasks } from '../store/taskStore';
import { useHydrateWitnesses } from '../store/witnessStore';
import { getUserTasks, getUserEvents } from '../services/database';
import { dbToTask, dbToTaskEvent } from '../utils/mappers';

/**
 * Pulls tasks + events from Supabase on mount and when the app returns to foreground.
 * Witness sync is stubbed until the witness cloud layer is wired up.
 */
export function useSyncOnForeground() {
  const user = useUser();
  const hydrateTasks = useHydrateTasks();
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!user) return;

    const sync = async () => {
      try {
        const [{ data: dbTasks }, { data: dbEvents }] = await Promise.all([
          getUserTasks(user.id),
          getUserEvents(user.id),
        ]);
        if (dbTasks && dbEvents) {
          hydrateTasks(dbTasks.map(dbToTask), dbEvents.map(dbToTaskEvent));
        }
      } catch (err) {
        console.warn('[useSyncOnForeground] sync failed:', err);
      }
    };

    // Sync on mount
    sync();

    // Sync when app returns to foreground
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        sync();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [user, hydrateTasks]);
}
