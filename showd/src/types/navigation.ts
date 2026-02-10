import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { User } from './user';

export type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  PhoneInput: undefined;
  OTPVerify: { phoneNumber: string };
  ProfileSetup: undefined;
  PermissionSetup: { user: User };
  OEMBatterySetup: { user: User };
};

export type MainTabParamList = {
  Today: undefined;
  Progress: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  CreateTask: undefined;
  EditTask: { taskId: string };
  TaskDetail: { taskId: string };
  FocusTimer: { taskId: string; taskEventId: string };
};

// Screen prop types
export type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;
export type OnboardingScreenProps = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;
export type PhoneInputScreenProps = NativeStackScreenProps<AuthStackParamList, 'PhoneInput'>;
export type OTPVerifyScreenProps = NativeStackScreenProps<AuthStackParamList, 'OTPVerify'>;
export type ProfileSetupScreenProps = NativeStackScreenProps<AuthStackParamList, 'ProfileSetup'>;
export type PermissionSetupScreenProps = NativeStackScreenProps<AuthStackParamList, 'PermissionSetup'>;
export type OEMBatterySetupScreenProps = NativeStackScreenProps<AuthStackParamList, 'OEMBatterySetup'>;

export type TodayScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Today'>,
  NativeStackScreenProps<RootStackParamList>
>;
export type ProgressScreenProps = BottomTabScreenProps<MainTabParamList, 'Progress'>;
export type SettingsScreenProps = BottomTabScreenProps<MainTabParamList, 'Settings'>;

export type CreateTaskScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateTask'>;
export type EditTaskScreenProps = NativeStackScreenProps<RootStackParamList, 'EditTask'>;
export type TaskDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'TaskDetail'>;
export type FocusTimerScreenProps = NativeStackScreenProps<RootStackParamList, 'FocusTimer'>;
