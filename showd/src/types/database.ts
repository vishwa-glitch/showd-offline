// Database row types — snake_case to match Supabase columns.
// These are kept separate from app types (camelCase) so the boundary is explicit.

export interface DbUser {
  id: string;
  phone: string;
  name: string;
  profile_photo_url: string | null;
  timezone: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  default_snooze_limit: number;
  reminder_sound_id: string;
  custom_sound_url: string | null;
  expo_push_token: string | null;
  permissions_completed: boolean;
  oem_setup_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbTask {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  reminder_time: string;
  frequency: string;
  frequency_days: number[] | null;
  custom_interval_days: number | null;
  one_time_date: string | null;
  snooze_limit: number;
  duration_minutes: number | null;
  accountability_type: string;
  witness_phone: string | null;
  witness_name: string | null;
  witness_relationship: string | null;
  witness_connection_id: string | null;
  personal_witness_name: string | null;
  personal_witness_photo_url: string | null;
  require_photo_proof: boolean;
  reminder_sound_id: string | null;
  is_active: boolean;
  is_paused: boolean;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

export interface DbTaskEvent {
  id: string;
  task_id: string;
  user_id: string;
  scheduled_for: string;
  status: string;
  responded_at: string | null;
  snooze_count: number;
  struggling_reason: string | null;
  struggling_note: string | null;
  started_at: string | null;
  completed_at: string | null;
  paused_duration_seconds: number | null;
  actual_duration_seconds: number | null;
  original_duration_minutes: number | null;
  extensions_used: number | null;
  total_extension_seconds: number | null;
  timer_completed: boolean | null;
  proof_photo_url: string | null;
  created_at: string;
}

export interface DbWitnessConnection {
  id: string;
  task_id: string;
  task_doer_id: string;
  task_doer_name: string;
  witness_phone: string;
  witness_name: string;
  witness_user_id: string | null;
  invite_token: string;
  status: string;
  notification_preference: string;
  invited_at: string;
  follow_up_sent_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  suspended_at: string | null;
}

export interface DbSmsLog {
  id: string;
  witness_connection_id: string | null;
  type: string;
  to_phone: string;
  message_body: string;
  twilio_message_sid: string | null;
  segment_count: number | null;
  cost_usd: number | null;
  sent_at: string;
}

export interface DbNudge {
  id: string;
  from_witness_phone: string;
  from_witness_name: string;
  to_user_id: string;
  task_id: string;
  message: string;
  seen: boolean;
  created_at: string;
}

// Typed Supabase database interface for createClient<Database>()
export interface Database {
  public: {
    Tables: {
      users: {
        Row: DbUser;
        Insert: Partial<DbUser> & Pick<DbUser, 'id' | 'phone' | 'name'>;
        Update: Partial<DbUser>;
      };
      tasks: {
        Row: DbTask;
        Insert: Partial<DbTask> & Pick<DbTask, 'id' | 'user_id' | 'name' | 'category' | 'reminder_time' | 'frequency'>;
        Update: Partial<DbTask>;
      };
      task_events: {
        Row: DbTaskEvent;
        Insert: Partial<DbTaskEvent> & Pick<DbTaskEvent, 'id' | 'task_id' | 'user_id' | 'scheduled_for' | 'status'>;
        Update: Partial<DbTaskEvent>;
      };
      witness_connections: {
        Row: DbWitnessConnection;
        Insert: Partial<DbWitnessConnection> & Pick<DbWitnessConnection, 'id' | 'task_id' | 'task_doer_id' | 'witness_phone' | 'witness_name' | 'invite_token'>;
        Update: Partial<DbWitnessConnection>;
      };
      sms_log: {
        Row: DbSmsLog;
        Insert: Partial<DbSmsLog> & Pick<DbSmsLog, 'to_phone' | 'type' | 'message_body'>;
        Update: Partial<DbSmsLog>;
      };
      nudges: {
        Row: DbNudge;
        Insert: Partial<DbNudge> & Pick<DbNudge, 'from_witness_phone' | 'from_witness_name' | 'to_user_id' | 'task_id' | 'message'>;
        Update: Partial<DbNudge>;
      };
    };
  };
}
