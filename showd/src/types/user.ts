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
  isGuest: boolean;
  createdAt: string;
  updatedAt: string;
}
