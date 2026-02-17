import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIAL_START_KEY = 'trial.startDate';
const TRIAL_EXPIRED_KEY = 'trial.expired';
const TRIAL_EXPIRY_MODAL_SHOWN_KEY = 'trial.expiryModalShown';

export interface TrialInfo {
  isActive: boolean;
  daysRemaining: number;
  dayNumber: number;
}

export function calculateTrialInfo(trialStartDate: string | null): TrialInfo {
  if (!trialStartDate) return { isActive: false, daysRemaining: 0, dayNumber: 0 };
  const startMs = new Date(trialStartDate).getTime();
  const nowMs = Date.now();
  const daysSinceStart = Math.floor((nowMs - startMs) / 86400000);
  const isActive = daysSinceStart < 7;
  const daysRemaining = Math.max(0, 7 - daysSinceStart);
  return { isActive, daysRemaining, dayNumber: daysSinceStart + 1 };
}

export async function getTrialStartDate(): Promise<string | null> {
  return AsyncStorage.getItem(TRIAL_START_KEY);
}

export async function setTrialStartDate(date: string): Promise<void> {
  await AsyncStorage.setItem(TRIAL_START_KEY, date);
}

export async function isTrialExpired(): Promise<boolean> {
  const val = await AsyncStorage.getItem(TRIAL_EXPIRED_KEY);
  return val === 'true';
}

export async function markTrialExpired(): Promise<void> {
  await AsyncStorage.setItem(TRIAL_EXPIRED_KEY, 'true');
}

export async function wasExpiryModalShown(): Promise<boolean> {
  const val = await AsyncStorage.getItem(TRIAL_EXPIRY_MODAL_SHOWN_KEY);
  return val === 'true';
}

export async function markExpiryModalShown(): Promise<void> {
  await AsyncStorage.setItem(TRIAL_EXPIRY_MODAL_SHOWN_KEY, 'true');
}
