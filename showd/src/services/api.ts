import { supabase } from './supabase';

interface SendWitnessInviteParams {
  connectionId: string;
  witnessPhone: string;
  witnessName: string;
  taskDoerName: string;
  taskName: string;
  inviteToken: string;
  isFollowUp?: boolean;
}

interface NotifyTaskEventParams {
  connectionId: string;
  witnessPhone: string;
  witnessName: string;
  taskDoerName: string;
  taskName: string;
  type: 'missed' | 'struggled';
  reason?: string;
}

interface WitnessRespondParams {
  inviteToken: string;
  action: 'accept' | 'decline';
}

export async function callSendWitnessInvite(params: SendWitnessInviteParams) {
  const { data, error } = await supabase.functions.invoke('send-witness-invite', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export async function callNotifyTaskEvent(params: NotifyTaskEventParams) {
  const { data, error } = await supabase.functions.invoke('on-task-event-change', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export async function callWitnessRespond(params: WitnessRespondParams) {
  const { data, error } = await supabase.functions.invoke('witness-respond', {
    body: params,
  });
  if (error) throw error;
  return data;
}
