import type { PaywallReason } from '../types/subscription';

interface GateResult {
  allowed: boolean;
  reason?: PaywallReason;
}

/**
 * Check whether a feature is accessible given the current subscription state.
 * Called imperatively — reads store state directly.
 */
export function canAccessFeature(
  feature: string,
  opts: {
    isPro: boolean;
    isTrialActive: boolean;
    activeTaskCount: number;
    activeRealAccountabilityCount: number;
  },
): GateResult {
  const { isPro, isTrialActive, activeTaskCount, activeRealAccountabilityCount } = opts;

  // Pro users: everything allowed
  if (isPro) return { allowed: true };

  // Trial users: Pro features with limits
  if (isTrialActive) {
    switch (feature) {
      case 'real_accountability':
        if (activeRealAccountabilityCount >= 1) {
          return { allowed: false, reason: 'trial_witness_limit' };
        }
        return { allowed: true };
      case 'photo_proof':
      case 'custom_sound':
      case 'unlimited_tasks':
      case 'full_progress':
      case 'three_snoozes':
        return { allowed: true };
      default:
        return { allowed: true };
    }
  }

  // Free users (post-trial)
  switch (feature) {
    case 'real_accountability':
      return { allowed: false, reason: 'pro_required' };
    case 'photo_proof':
      return { allowed: false, reason: 'photo_proof' };
    case 'custom_sound':
      return { allowed: false, reason: 'custom_sound' };
    case 'create_task':
      if (activeTaskCount >= 3) return { allowed: false, reason: 'task_limit' };
      return { allowed: true };
    case 'full_progress':
      return { allowed: false, reason: 'full_progress' };
    case 'three_snoozes':
      return { allowed: false, reason: 'three_snoozes' };
    default:
      return { allowed: true };
  }
}
