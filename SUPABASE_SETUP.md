# Supabase Setup Guide for Showd

Complete guide for configuring your Supabase project. Run these steps in order.

---

## 1. Authentication — Phone OTP via Twilio

Go to **Authentication > Providers > Phone** in the Supabase dashboard.

1. Enable the Phone provider
2. Set OTP expiry to `600` seconds (10 minutes)
3. Set SMS provider to **Twilio**
4. Fill in:
   - **Twilio Account SID**: your SID from Twilio console
   - **Twilio Auth Token**: your auth token
   - **Twilio Message Service SID** or **Twilio Phone Number**: your Twilio sending number
   - **SMS Message**: `Your Showd verification code is: {{ .Code }}`
5. Save

Under **Authentication > Rate Limits**:
- **SMS OTP rate limit**: 60 seconds per phone number (default — prevents spam)
- These built-in limits replace Firebase's anti-abuse protection

> The app uses `supabase.auth.signInWithOtp({ phone })` and `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`.
> No custom Edge Function is involved in the auth flow — Supabase handles user creation and session management natively.

**Important**: This is the same Twilio account used for witness SMS. Auth OTP goes through Supabase's built-in provider; witness SMS goes through the Edge Functions. They share the Twilio account but use different code paths.

---

## 2. Database Tables & Row Level Security — Complete Schema

Go to **SQL Editor** and run this complete migration (creates tables + enables RLS in one step):

```sql
-- ============================================
-- Showd Database Schema (v3)
-- ============================================

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  profile_photo_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  default_snooze_limit INTEGER NOT NULL DEFAULT 3,
  reminder_sound_id TEXT NOT NULL DEFAULT 'gentle_pulse',
  custom_sound_url TEXT,
  expo_push_token TEXT,
  permissions_completed BOOLEAN NOT NULL DEFAULT FALSE,
  oem_setup_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  reminder_time TEXT NOT NULL DEFAULT '08:00',
  frequency TEXT NOT NULL DEFAULT 'daily',
  frequency_days INTEGER[],
  custom_interval_days INTEGER,
  one_time_date TEXT,
  snooze_limit INTEGER NOT NULL DEFAULT 3,
  duration_minutes INTEGER,
  accountability_type TEXT NOT NULL DEFAULT 'none',
  witness_phone TEXT,
  witness_name TEXT,
  witness_relationship TEXT,
  witness_connection_id UUID,
  personal_witness_name TEXT,
  personal_witness_photo_url TEXT,
  require_photo_proof BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_sound_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);

-- Task Events
CREATE TABLE IF NOT EXISTS public.task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  snooze_count INTEGER NOT NULL DEFAULT 0,
  struggling_reason TEXT,
  struggling_note TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_duration_seconds INTEGER,
  actual_duration_seconds INTEGER,
  original_duration_minutes INTEGER,
  extensions_used INTEGER,
  total_extension_seconds INTEGER,
  timer_completed BOOLEAN,
  proof_photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_events_task_id ON public.task_events(task_id);
CREATE INDEX IF NOT EXISTS idx_task_events_user_id ON public.task_events(user_id);
CREATE INDEX IF NOT EXISTS idx_task_events_scheduled ON public.task_events(scheduled_for);

-- Witness Connections
CREATE TABLE IF NOT EXISTS public.witness_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  task_doer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_doer_name TEXT NOT NULL,
  witness_phone TEXT NOT NULL,
  witness_name TEXT NOT NULL,
  witness_user_id UUID REFERENCES public.users(id),
  invite_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'invited',
  notification_preference TEXT NOT NULL DEFAULT 'alerts_only',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  follow_up_sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_witness_connections_task_doer ON public.witness_connections(task_doer_id);
CREATE INDEX IF NOT EXISTS idx_witness_connections_invite_token ON public.witness_connections(invite_token);

-- SMS Log (for cost tracking and debugging)
CREATE TABLE IF NOT EXISTS public.sms_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  witness_connection_id UUID REFERENCES public.witness_connections(id) ON DELETE SET NULL,
  to_phone TEXT NOT NULL,
  type TEXT NOT NULL,
  message_body TEXT NOT NULL,
  twilio_message_sid TEXT,
  segment_count INTEGER,
  cost_usd NUMERIC(8,4),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_log_connection ON public.sms_log(witness_connection_id);
CREATE INDEX IF NOT EXISTS idx_sms_log_sent_at ON public.sms_log(sent_at);

-- Nudges
CREATE TABLE IF NOT EXISTS public.nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_witness_phone TEXT NOT NULL,
  from_witness_name TEXT NOT NULL,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  seen BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nudges_to_user ON public.nudges(to_user_id);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.witness_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

-- ─── Users ───
CREATE POLICY IF NOT EXISTS "Users can read own profile"
  ON public.users FOR SELECT
  USING ((SELECT auth.uid()) = id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON public.users FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ─── Tasks ───
CREATE POLICY IF NOT EXISTS "Users can read own tasks"
  ON public.tasks FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own tasks"
  ON public.tasks FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own tasks"
  ON public.tasks FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ─── Task Events ───
CREATE POLICY IF NOT EXISTS "Users can read own task events"
  ON public.task_events FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own task events"
  ON public.task_events FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own task events"
  ON public.task_events FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- ─── Witness Connections ───
CREATE POLICY IF NOT EXISTS "Task owners can read own connections"
  ON public.witness_connections FOR SELECT
  USING ((SELECT auth.uid()) = task_doer_id);

CREATE POLICY IF NOT EXISTS "Task owners can insert connections"
  ON public.witness_connections FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = task_doer_id);

CREATE POLICY IF NOT EXISTS "Task owners can update connections"
  ON public.witness_connections FOR UPDATE
  USING ((SELECT auth.uid()) = task_doer_id);

CREATE POLICY IF NOT EXISTS "Task owners can delete connections"
  ON public.witness_connections FOR DELETE
  USING ((SELECT auth.uid()) = task_doer_id);

-- ─── SMS Log (read-only for users, inserts via service role in Edge Functions) ───
CREATE POLICY IF NOT EXISTS "Users can read own SMS logs"
  ON public.sms_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.witness_connections
      WHERE witness_connections.id = sms_log.witness_connection_id
      AND witness_connections.task_doer_id = (SELECT auth.uid())
    )
  );

-- ─── Nudges ───
CREATE POLICY IF NOT EXISTS "Users can read own nudges"
  ON public.nudges FOR SELECT
  USING ((SELECT auth.uid()) = to_user_id);

CREATE POLICY IF NOT EXISTS "Users can update own nudges"
  ON public.nudges FOR UPDATE
  USING ((SELECT auth.uid()) = to_user_id);
```

> **Note**: This script is **idempotent** (safe to re-run). The `IF NOT EXISTS` clauses ensure it won't error if tables/indexes/policies already exist.

---

## 4. Edge Function Secrets

Go to **Settings > Edge Functions** or use the CLI:

```bash
supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
supabase secrets set TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
supabase secrets set APP_URL=https://showd.app
```

These secrets are available as `Deno.env.get()` in all Edge Functions.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available in Edge Functions — no need to set them manually.

---

## 5. Deploy Edge Functions

From the project root:

```bash
# Account management
supabase functions deploy delete-account

# Witness system (called from the app)
supabase functions deploy send-witness-invite
supabase functions deploy witness-respond
supabase functions deploy on-task-event-change

# Witness web page backends
supabase functions deploy get-witness-invite
supabase functions deploy get-witness-dashboard
supabase functions deploy send-witness-nudge
supabase functions deploy update-witness-preferences
supabase functions deploy witness-opt-out

# Scheduled functions (called by pg_cron)
supabase functions deploy scheduled-follow-up-invites
supabase functions deploy scheduled-weekly-summary
supabase functions deploy scheduled-streak-check
supabase functions deploy scheduled-missed-task-marker
```

---

## 6. pg_cron — Scheduled Jobs

Enable the `pg_cron` extension:

1. Go to **Database > Extensions**
2. Search for `pg_cron` and enable it

Then run this SQL to create the cron schedules:

```sql
-- Enable pg_net for HTTP calls from cron
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Follow-up invites — daily at 10am UTC
SELECT cron.schedule(
  'follow-up-invites',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/scheduled-follow-up-invites',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Weekly summary — every Sunday at 6pm UTC
SELECT cron.schedule(
  'weekly-summary',
  '0 18 * * 0',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/scheduled-weekly-summary',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Streak milestone check — daily at 11pm UTC
SELECT cron.schedule(
  'streak-check',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/scheduled-streak-check',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Missed task marker — every 30 minutes
SELECT cron.schedule(
  'missed-task-marker',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/scheduled-missed-task-marker',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

> **Note**: Set the database config values first:
> ```sql
> ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
> ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
> ```

---

## 7. Verify pg_cron Jobs

Check that all jobs are registered:

```sql
SELECT jobid, schedule, command, jobname FROM cron.job ORDER BY jobid;
```

Check recent execution history:

```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
```

---

## 8. Environment Variables (App Side)

Make sure your `showd/.env` file has:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These are read by the Supabase client in `src/services/supabase.ts`.

---

## 9. SMS Cost Monitoring

Query the `sms_log` table to track costs:

```sql
-- Total segments sent today
SELECT SUM(segment_count) as total_segments,
       COUNT(*) as total_messages
FROM public.sms_log
WHERE sent_at >= CURRENT_DATE;

-- Breakdown by message type
SELECT type,
       COUNT(*) as count,
       SUM(segment_count) as segments
FROM public.sms_log
WHERE sent_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY type
ORDER BY segments DESC;

-- Cost estimate (Twilio: ~$0.0079/segment for US numbers)
SELECT SUM(segment_count) * 0.0079 as estimated_cost_usd
FROM public.sms_log
WHERE sent_at >= CURRENT_DATE - INTERVAL '30 days';
```

---

## Summary Checklist

- [ ] Phone OTP provider enabled with Twilio credentials
- [ ] Rate limits configured (60s per phone number)
- [ ] All 6 tables created (users, tasks, task_events, witness_connections, sms_log, nudges)
- [ ] RLS enabled and policies created for all tables
- [ ] Edge Function secrets set (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, APP_URL)
- [ ] All 13 Edge Functions deployed (delete-account, send-witness-invite, witness-respond, on-task-event-change, get-witness-invite, get-witness-dashboard, send-witness-nudge, update-witness-preferences, witness-opt-out, + 4 scheduled)
- [ ] pg_cron and pg_net extensions enabled
- [ ] 4 cron jobs scheduled (follow-up-invites, weekly-summary, streak-check, missed-task-marker)
- [ ] App `.env` configured with Supabase URL and anon key
