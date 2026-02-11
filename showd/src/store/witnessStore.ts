// ============================================
// DEMO MODE: Supabase calls commented out.
// Using Zustand-only local state for demo.
// Search for [SUPABASE-TODO] to restore.
// ============================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useShallow } from 'zustand/react/shallow';
import type { WitnessConnection, ConnectionStatus } from '../types/witness';
// [SUPABASE-TODO] Restore cloud sync:
// import { pushConnection, pushDeleteConnection } from '../services/syncEngine';

const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const generateInviteToken = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

interface WitnessState {
  connections: WitnessConnection[];

  createConnection: (params: {
    taskId: string;
    taskDoerId: string;
    taskDoerName: string;
    witnessPhone: string;
    witnessName: string;
    witnessRelationship?: string;
  }) => WitnessConnection;
  updateConnectionStatus: (connectionId: string, status: ConnectionStatus) => void;
  removeConnection: (connectionId: string) => void;
  getConnectionByTaskId: (taskId: string) => WitnessConnection | undefined;
  getConnectionById: (id: string) => WitnessConnection | undefined;
  getActiveConnections: () => WitnessConnection[];
  markFollowUpSent: (connectionId: string) => void;
  removeConnectionsByTaskId: (taskId: string) => void;
  hydrateFromCloud: (connections: WitnessConnection[]) => void;
}

const useWitnessStoreBase = create<WitnessState>()(
  persist(
    (set, get) => ({
      connections: [],

      createConnection: (params) => {
        const now = new Date().toISOString();
        const connection: WitnessConnection = {
          id: generateUUID(),
          taskId: params.taskId,
          taskDoerId: params.taskDoerId,
          taskDoerName: params.taskDoerName,
          witnessPhone: params.witnessPhone,
          witnessName: params.witnessName,
          inviteToken: generateInviteToken(),
          status: 'invited',
          notificationPreference: 'alerts_only',
          invitedAt: now,
        };
        set((state) => ({ connections: [...state.connections, connection] }));
        // [SUPABASE-TODO] Restore: pushConnection(connection);
        return connection;
      },

      updateConnectionStatus: (connectionId, status) => {
        const now = new Date().toISOString();
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === connectionId
              ? {
                  ...c,
                  status,
                  ...(status === 'active' ? { acceptedAt: now } : {}),
                  ...(status === 'declined' ? { declinedAt: now } : {}),
                }
              : c,
          ),
        }));
        // [SUPABASE-TODO] Restore cloud sync:
        // const updated = get().connections.find((c) => c.id === connectionId);
        // if (updated) pushConnection(updated);
      },

      removeConnection: (connectionId) => {
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== connectionId),
        }));
        // [SUPABASE-TODO] Restore: pushDeleteConnection(connectionId);
      },

      getConnectionByTaskId: (taskId) =>
        get().connections.find((c) => c.taskId === taskId && c.status !== 'removed'),

      getConnectionById: (id) =>
        get().connections.find((c) => c.id === id),

      getActiveConnections: () =>
        get().connections.filter((c) => c.status === 'active'),

      markFollowUpSent: (connectionId) => {
        const now = new Date().toISOString();
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === connectionId ? { ...c, followUpSentAt: now } : c,
          ),
        }));
        // [SUPABASE-TODO] Restore cloud sync:
        // const updated = get().connections.find((c) => c.id === connectionId);
        // if (updated) pushConnection(updated);
      },

      removeConnectionsByTaskId: (taskId) => {
        // [SUPABASE-TODO] Restore cloud sync:
        // const toRemove = get().connections.filter((c) => c.taskId === taskId);
        set((state) => ({
          connections: state.connections.filter((c) => c.taskId !== taskId),
        }));
        // [SUPABASE-TODO] Restore: toRemove.forEach((c) => pushDeleteConnection(c.id));
      },

      hydrateFromCloud: (connections) =>
        set({ connections }),
    }),
    {
      name: 'showd-witnesses',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        connections: state.connections,
      }),
    },
  ),
);

// Hook exports
export const useConnections = () => useWitnessStoreBase(useShallow((s) => s.connections));
export const useCreateConnection = () => useWitnessStoreBase((s) => s.createConnection);
export const useUpdateConnectionStatus = () => useWitnessStoreBase((s) => s.updateConnectionStatus);
export const useRemoveConnection = () => useWitnessStoreBase((s) => s.removeConnection);
export const useGetConnectionByTaskId = () => useWitnessStoreBase((s) => s.getConnectionByTaskId);
export const useGetConnectionById = () => useWitnessStoreBase((s) => s.getConnectionById);
export const useGetActiveConnections = () => useWitnessStoreBase((s) => s.getActiveConnections);
export const useMarkFollowUpSent = () => useWitnessStoreBase((s) => s.markFollowUpSent);
export const useRemoveConnectionsByTaskId = () => useWitnessStoreBase((s) => s.removeConnectionsByTaskId);
export const useHydrateWitnesses = () => useWitnessStoreBase((s) => s.hydrateFromCloud);
