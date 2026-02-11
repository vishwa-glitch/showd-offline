// ============================================
// DEMO MODE: Supabase Edge Function calls commented out.
// Using console.log stubs for demo.
// Search for [SUPABASE-TODO] to restore.
// ============================================
import type { WitnessConnection } from '../types/witness';
// [SUPABASE-TODO] Restore Edge Function calls:
// import { callSendWitnessInvite, callNotifyTaskEvent } from './api';

// --- SMS Demo Stubs ---

interface InviteSMSParams {
  connectionId: string;
  witnessPhone: string;
  witnessName: string;
  taskDoerName: string;
  taskName: string;
  inviteToken: string;
}

export async function sendWitnessInviteSMS(params: InviteSMSParams): Promise<void> {
  // [SUPABASE-TODO] Restore: await callSendWitnessInvite({ ...params, isFollowUp: false });
  console.log('[DEMO] Would send SMS invite:', {
    type: 'invite',
    to: params.witnessPhone,
    message: `${params.taskDoerName} chose you to help them stay on track with ${params.taskName}.`,
  });
}

export async function sendResendInviteSMS(params: InviteSMSParams): Promise<void> {
  // [SUPABASE-TODO] Restore: await callSendWitnessInvite({ ...params, isFollowUp: true });
  console.log('[DEMO] Would send SMS follow-up:', {
    type: 'follow_up',
    to: params.witnessPhone,
    message: `${params.taskDoerName} is still waiting for your support on Showd.`,
  });
}

interface MissedSMSParams {
  connectionId: string;
  witnessPhone: string;
  witnessName: string;
  taskDoerName: string;
  taskName: string;
}

export async function sendMissedTaskSMS(params: MissedSMSParams): Promise<void> {
  // [SUPABASE-TODO] Restore: await callNotifyTaskEvent({ ...params, type: 'missed' });
  console.log('[DEMO] Would send SMS missed alert:', {
    type: 'missed',
    to: params.witnessPhone,
    message: `${params.taskDoerName} missed ${params.taskName} today.`,
  });
}

interface StruggledSMSParams extends MissedSMSParams {
  reason: string;
}

export async function sendStruggledTaskSMS(params: StruggledSMSParams): Promise<void> {
  // [SUPABASE-TODO] Restore: await callNotifyTaskEvent({ ...params, type: 'struggled', reason: params.reason });
  console.log('[DEMO] Would send SMS struggled alert:', {
    type: 'struggled',
    to: params.witnessPhone,
    message: `${params.taskDoerName} is having a tough day with ${params.taskName}.`,
  });
}

// --- Helpers ---

const RESEND_COOLDOWN_MS = 48 * 60 * 60 * 1000; // 48 hours

export function canResendInvite(connection: WitnessConnection): boolean {
  const lastSent = connection.followUpSentAt || connection.invitedAt;
  const elapsed = Date.now() - new Date(lastSent).getTime();
  return elapsed >= RESEND_COOLDOWN_MS;
}

export function getInviteSMSPreview(params: {
  witnessName: string;
  taskDoerName: string;
  taskName: string;
}): string {
  return (
    `Hey! ${params.taskDoerName} chose you to help them stay on track ` +
    `with ${params.taskName || 'their task'}. Accept here: [link]. ` +
    `Reply STOP to opt out — Showd`
  );
}

export function validateWitnessPhone(
  witnessPhone: string,
  userPhone: string,
): string | null {
  const digits = witnessPhone.replace(/\D/g, '');
  if (digits.length < 10) {
    return digits.length > 0 ? 'Enter a valid phone number' : null;
  }
  const userDigits = userPhone.replace(/\D/g, '');
  if (userDigits.length > 0 && digits === userDigits) {
    return "This is your own number. Add someone else!";
  }
  return null;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  return `***-***-${digits.slice(-4)}`;
}
