export interface User {
  id: string;
  phone: string;
  name: string;
  profilePhotoUrl?: string;
  timezone: string;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  defaultSnoozeLimit: number;
  reminderSoundId: string;
  customSoundUrl?: string;
  expoPushToken?: string;
  permissionsCompleted: boolean;
  oemSetupCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}
