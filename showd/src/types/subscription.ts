export interface TrialInfo {
  isActive: boolean;
  daysRemaining: number;
  dayNumber: number;
}

export type PaywallReason =
  | 'task_limit'
  | 'real_accountability'
  | 'trial_witness_limit'
  | 'photo_proof'
  | 'custom_sound'
  | 'full_progress'
  | 'three_snoozes'
  | 'pro_required';
