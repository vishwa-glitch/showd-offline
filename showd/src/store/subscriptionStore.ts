import { create } from 'zustand';
// RevenueCat disabled until Play Console credentials are configured
// import type { PurchasesOffering } from 'react-native-purchases';
import {
  checkProStatus,
  getOfferings,
  purchasePro,
  restorePurchases,
} from '../services/purchases';
import {
  calculateTrialInfo,
  getTrialStartDate,
  markTrialExpired,
  isTrialExpired as checkTrialExpired,
} from '../utils/trialUtils';
import type { TrialInfo } from '../utils/trialUtils';

interface SubscriptionState {
  isPro: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  trialDayNumber: number;
  trialStartDate: string | null;
  offerings: any | null; // Was PurchasesOffering — RevenueCat disabled

  initSubscription: () => Promise<void>;
  refreshProStatus: () => Promise<void>;
  refreshTrialInfo: () => Promise<void>;
  getTrialInfo: () => TrialInfo;
  purchase: (pkg: any) => Promise<boolean>;
  restore: () => Promise<boolean>;
  handleTrialExpiry: () => Promise<void>;
  handleProUpgrade: () => void;
}

const useSubscriptionStoreBase = create<SubscriptionState>((set, get) => ({
  isPro: true,           // Default to Pro while RevenueCat is disabled
  isTrialActive: false,
  trialDaysRemaining: 0,
  trialDayNumber: 0,
  trialStartDate: null,
  offerings: null,

  initSubscription: async () => {
    try {
      const isPro = await checkProStatus();
      const trialStartDate = await getTrialStartDate();
      const trialInfo = calculateTrialInfo(trialStartDate);
      const alreadyExpired = await checkTrialExpired();

      let offerings: any | null = null;
      try {
        offerings = await getOfferings();
      } catch {
        // Offerings may not be available yet
      }

      set({
        isPro,
        isTrialActive: !isPro && !alreadyExpired && trialInfo.isActive,
        trialDaysRemaining: trialInfo.daysRemaining,
        trialDayNumber: trialInfo.dayNumber,
        trialStartDate,
        offerings,
      });
    } catch (err) {
      console.warn('[subscriptionStore] init failed:', err);
    }
  },

  refreshProStatus: async () => {
    try {
      const isPro = await checkProStatus();
      const wasPro = get().isPro;

      if (wasPro && !isPro) {
        // Subscription lapsed — downgrade
        await get().handleTrialExpiry();
      } else if (!wasPro && isPro) {
        // Subscription restored — upgrade
        get().handleProUpgrade();
      }

      set({ isPro });
    } catch (err) {
      console.warn('[subscriptionStore] refreshProStatus failed:', err);
    }
  },

  refreshTrialInfo: async () => {
    const trialStartDate = await getTrialStartDate();
    const trialInfo = calculateTrialInfo(trialStartDate);
    const alreadyExpired = await checkTrialExpired();
    const isPro = get().isPro;

    set({
      trialStartDate,
      isTrialActive: !isPro && !alreadyExpired && trialInfo.isActive,
      trialDaysRemaining: trialInfo.daysRemaining,
      trialDayNumber: trialInfo.dayNumber,
    });
  },

  getTrialInfo: () => {
    const { trialStartDate } = get();
    return calculateTrialInfo(trialStartDate);
  },

  purchase: async (pkg) => {
    const success = await purchasePro(pkg);
    if (success) {
      set({ isPro: true, isTrialActive: false });
      get().handleProUpgrade();
    }
    return success;
  },

  restore: async () => {
    const success = await restorePurchases();
    if (success) {
      set({ isPro: true, isTrialActive: false });
      get().handleProUpgrade();
    }
    return success;
  },

  handleTrialExpiry: async () => {
    await markTrialExpired();
    set({ isTrialActive: false, trialDaysRemaining: 0 });
    // Task pausing, witness suspending, snooze downgrade will be handled
    // by the calling code (useSyncOnForeground or App.tsx effect)
  },

  handleProUpgrade: () => {
    set({ isPro: true, isTrialActive: false });
    // Task reactivation, witness unsuspending, snooze upgrade will be handled
    // by the calling code
  },
}));

// Selector hooks
export const useIsPro = () => useSubscriptionStoreBase((s) => s.isPro);
export const useIsTrialActive = () => useSubscriptionStoreBase((s) => s.isTrialActive);
export const useTrialDaysRemaining = () => useSubscriptionStoreBase((s) => s.trialDaysRemaining);
export const useTrialDayNumber = () => useSubscriptionStoreBase((s) => s.trialDayNumber);
export const useOfferings = () => useSubscriptionStoreBase((s) => s.offerings);
export const useInitSubscription = () => useSubscriptionStoreBase((s) => s.initSubscription);
export const useRefreshProStatus = () => useSubscriptionStoreBase((s) => s.refreshProStatus);
export const useRefreshTrialInfo = () => useSubscriptionStoreBase((s) => s.refreshTrialInfo);
export const usePurchase = () => useSubscriptionStoreBase((s) => s.purchase);
export const useRestore = () => useSubscriptionStoreBase((s) => s.restore);
export const useGetTrialInfo = () => useSubscriptionStoreBase((s) => s.getTrialInfo);
export const useSubscriptionStore = useSubscriptionStoreBase;
