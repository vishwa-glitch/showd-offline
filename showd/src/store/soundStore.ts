import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SOUND_ID } from '../utils/sounds';

interface SoundState {
    selectedSoundId: string;
    setSelectedSound: (id: string) => void;
}

const useSoundStoreBase = create<SoundState>()(
    persist(
        (set) => ({
            selectedSoundId: DEFAULT_SOUND_ID,
            setSelectedSound: (id: string) => set({ selectedSoundId: id }),
        }),
        {
            name: 'showd-sound',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                selectedSoundId: state.selectedSoundId,
            }),
        },
    ),
);

// Selector hooks
export const useSelectedSoundId = () => useSoundStoreBase((s) => s.selectedSoundId);
export const useSetSelectedSound = () => useSoundStoreBase((s) => s.setSelectedSound);

// Non-hook accessor for use outside React components (e.g., in services)
export const getSelectedSoundId = () => useSoundStoreBase.getState().selectedSoundId;
