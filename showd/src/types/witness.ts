export type ConnectionStatus = 'invited' | 'active' | 'declined' | 'removed' | 'suspended';
export type NotificationPreference = 'alerts_only' | 'weekly';

export interface WitnessConnection {
  id: string;
  taskId: string;
  taskDoerId: string;
  taskDoerName: string;
  witnessPhone: string;
  witnessName: string;
  witnessUserId?: string;
  inviteToken: string;
  status: ConnectionStatus;
  notificationPreference: NotificationPreference;
  invitedAt: string;
  followUpSentAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  suspendedAt?: string;
}

export interface Nudge {
  id: string;
  fromWitnessPhone: string;
  fromWitnessName: string;
  toUserId: string;
  taskId: string;
  message: string;
  seen: boolean;
  createdAt: string;
}
