import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
// RevenueCat disabled until Play Console credentials are configured
// import Purchases from 'react-native-purchases';

// ── AsyncStorage Keys ──
const AUTH_KEYS = {
  userId: 'auth.userId',
  phone: 'auth.phone',
  isAuthenticated: 'auth.isAuthenticated',
  trialStartDate: 'trial.startDate',
  trialIsActive: 'trial.isActive',
} as const;

/**
 * Send OTP to phone number.
 * Supabase sends the SMS via Twilio (configured in Supabase Dashboard).
 */
export async function sendOTP(phoneNumber: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneNumber,
  });

  if (error) {
    if (error.message.includes('rate limit') || error.status === 429) {
      throw new Error('Too many attempts. Please wait 60 seconds and try again.');
    }
    if (error.message.includes('invalid') || error.message.includes('format')) {
      throw new Error('Invalid phone number. Please check and try again.');
    }
    throw new Error(error.message || 'Failed to send verification code.');
  }
}

/**
 * Verify OTP code.
 * On success, Supabase automatically creates the user (if new) and returns a session.
 * The session is persisted by the Supabase client via AsyncStorage.
 */
export async function verifyOTP(
  phoneNumber: string,
  code: string,
): Promise<{ userId: string; isNewUser: boolean }> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneNumber,
    token: code,
    type: 'sms',
  });

  if (error) {
    if (error.message.includes('invalid') || error.message.includes('expired')) {
      throw new Error('Incorrect or expired code. Please try again.');
    }
    if (error.message.includes('rate limit') || error.status === 429) {
      throw new Error('Too many attempts. Please wait a few minutes.');
    }
    throw new Error(error.message || 'Verification failed.');
  }

  if (!data.session || !data.user) {
    throw new Error('Verification failed. No session returned.');
  }

  const userId = data.user.id;
  const phone = data.user.phone!;

  // Check if this user already has a profile in the public.users table
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', userId)
    .single();

  const isNewUser = !existingUser || !existingUser.name;

  // If brand new (no row in users table), create one
  if (!existingUser) {
    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      phone: phone,
      name: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    });
    // Ignore unique constraint errors (race condition on double-tap)
    if (insertError && !insertError.message.includes('duplicate')) {
      console.error('Error creating user row:', insertError);
    }
  }

  // RevenueCat disabled until Play Console credentials are configured
  // try {
  //   await Purchases.logIn(userId);
  // } catch (e) {
  //   console.error('RevenueCat login error:', e);
  // }

  // Store auth info locally
  await AsyncStorage.setItem(AUTH_KEYS.userId, userId);
  await AsyncStorage.setItem(AUTH_KEYS.phone, phone);
  await AsyncStorage.setItem(AUTH_KEYS.isAuthenticated, 'true');

  // Set trial start date for new users
  if (isNewUser) {
    await AsyncStorage.setItem(AUTH_KEYS.trialStartDate, new Date().toISOString());
    await AsyncStorage.setItem(AUTH_KEYS.trialIsActive, 'true');
  }

  return { userId, isNewUser };
}

/**
 * Get current authenticated user.
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get current session.
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Sign out. Clears Supabase session and local state.
 */
export async function signOut() {
  await supabase.auth.signOut();
  // RevenueCat disabled until Play Console credentials are configured
  // try {
  //   await Purchases.logOut();
  // } catch (_e) {
  //   // Non-fatal
  // }
  await AsyncStorage.multiRemove(Object.values(AUTH_KEYS));
}

/**
 * Delete account. Removes user data from Supabase.
 * The actual Supabase Auth user deletion requires a service_role call,
 * so we trigger it via an Edge Function.
 */
export async function deleteAccount() {
  const userId = await AsyncStorage.getItem(AUTH_KEYS.userId);
  if (!userId) return;

  const { error } = await supabase.functions.invoke('delete-account', {
    body: { userId },
  });

  if (error) throw error;

  await signOut();
}

/**
 * Get the current Supabase user ID from local storage.
 */
export async function getStoredUserId(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_KEYS.userId);
}
