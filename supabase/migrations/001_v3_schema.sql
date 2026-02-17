-- Showd v3 Database Schema
-- Run this in Supabase SQL Editor

-- ── Users ──
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  profile_photo_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  default_snooze_limit INTEGER DEFAULT 3 CHECK (default_snooze_limit BETWEEN 1 AND 3),
  reminder_sound_id TEXT DEFAULT 'gentle_pulse',
  custom_sound_url TEXT,
  firebase_uid TEXT,
  expo_push_token TEXT,
  permissions_completed BOOLEAN DEFAULT FALSE,
  oem_setup_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tasks ──
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('medication', 'exercise', 'work', 'self_care', 'habit', 'other')),
  reminder_time TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('once', 'daily', 'weekly', 'custom')),
  frequency_days INTEGER[],
  custom_interval_days INTEGER,
  one_time_date DATE,
  snooze_limit INTEGER DEFAULT 3 CHECK (snooze_limit BETWEEN 1 AND 3),
  duration_minutes INTEGER,
  accountability_type TEXT NOT NULL CHECK (accountability_type IN ('real', 'personal', 'none')),
  witness_phone TEXT,
  witness_name TEXT,
  witness_relationship TEXT,
  witness_connection_id UUID,
  personal_witness_name TEXT,
  personal_witness_photo_url TEXT,
  require_photo_proof BOOLEAN DEFAULT FALSE,
  reminder_sound_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_paused BOOLEAN DEFAULT FALSE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Task Events ──
CREATE TABLE IF NOT EXISTS task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'done', 'snoozed', 'in_progress', 'struggled', 'missed')),
  responded_at TIMESTAMPTZ,
  snooze_count INTEGER DEFAULT 0,
  struggling_reason TEXT,
  struggling_note TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_duration_seconds INTEGER DEFAULT 0,
  actual_duration_seconds INTEGER,
  original_duration_minutes INTEGER,
  extensions_used INTEGER DEFAULT 0,
  total_extension_seconds INTEGER DEFAULT 0,
  timer_completed BOOLEAN,
  proof_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_events_user_scheduled ON task_events(user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_task_events_status ON task_events(status) WHERE status = 'pending';

-- ── Witness Connections ──
CREATE TABLE IF NOT EXISTS witness_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  task_doer_id UUID REFERENCES users(id),
  task_doer_name TEXT NOT NULL,
  witness_phone TEXT NOT NULL,
  witness_name TEXT NOT NULL,
  witness_user_id UUID REFERENCES users(id),
  invite_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'active', 'declined', 'removed', 'suspended')),
  notification_preference TEXT DEFAULT 'alerts_only'
    CHECK (notification_preference IN ('alerts_only', 'weekly')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  follow_up_sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ
);

-- ── Nudges ──
CREATE TABLE IF NOT EXISTS nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_witness_phone TEXT NOT NULL,
  from_witness_name TEXT NOT NULL,
  to_user_id UUID REFERENCES users(id),
  task_id UUID REFERENCES tasks(id),
  message TEXT NOT NULL,
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SMS Log ──
CREATE TABLE IF NOT EXISTS sms_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  witness_connection_id UUID REFERENCES witness_connections(id),
  type TEXT NOT NULL CHECK (type IN ('invite', 'followup', 'missed', 'struggling', 'weekly_summary', 'milestone', 'ended', 'suspended', 'reactivated')),
  to_phone TEXT NOT NULL,
  message_body TEXT NOT NULL,
  twilio_message_sid TEXT,
  segment_count INTEGER,
  cost_usd NUMERIC(6,4),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own" ON users FOR UPDATE USING (auth.uid() = id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);

ALTER TABLE task_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own events" ON task_events FOR ALL USING (auth.uid() = user_id);

ALTER TABLE witness_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doers manage connections" ON witness_connections FOR ALL USING (auth.uid() = task_doer_id);

ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own nudges" ON nudges FOR SELECT USING (auth.uid() = to_user_id);

ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;
-- No user policies — only Edge Functions via service_role_key
