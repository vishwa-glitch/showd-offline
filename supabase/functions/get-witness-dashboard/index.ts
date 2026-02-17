import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

// ── Helpers ──────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  medication: '💊',
  exercise: '🏋️',
  work: '💼',
  self_care: '🧘',
  habit: '✨',
  other: '📋',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getFrequencyLabel(task: any): string {
  if (task.frequency === 'daily') return 'Daily';
  if (task.frequency === 'weekly') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = (task.frequency_days || []).map((d: number) => dayNames[d]).join(', ');
    return days ? `Weekly (${days})` : 'Weekly';
  }
  if (task.frequency === 'custom') {
    return `Every ${task.custom_interval_days || '?'} days`;
  }
  if (task.frequency === 'once') return 'One time';
  return task.frequency;
}

function toDateStr(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toTimeStr(isoString: string | null): string | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function mapEventStatus(dbEvent: any): string {
  // DB statuses: pending, done, snoozed, in_progress, struggled, missed
  // Dashboard expects: done, snoozed_done, missed, struggled, pending
  if (dbEvent.status === 'done' && dbEvent.snooze_count > 0) {
    return 'snoozed_done';
  }
  if (dbEvent.status === 'done') return 'done';
  if (dbEvent.status === 'missed') return 'missed';
  if (dbEvent.status === 'struggled') return 'struggled';
  // snoozed, in_progress, pending all map to pending
  return 'pending';
}

function computeMonthlyCompletionRate(events: any[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEvents = events.filter((e: any) => new Date(e.scheduled_for) >= monthStart);
  const completed = monthEvents.filter((e: any) =>
    e.status === 'done' || e.status === 'struggled'
  );
  return monthEvents.length > 0
    ? Math.round((completed.length / monthEvents.length) * 100)
    : 0;
}

// ── Main Handler ─────────────────────────────────────────────

serve(async (req) => {
  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 1. Validate token — find the seed connection
    const { data: seedConn, error: seedErr } = await supabaseAdmin
      .from('witness_connections')
      .select('*')
      .eq('invite_token', token)
      .eq('status', 'active')
      .single();

    if (seedErr || !seedConn) {
      return new Response(
        JSON.stringify({ error: 'invalid_or_expired' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 2. Get ALL active connections for this witness phone (multi-ward support)
    const { data: allConnections, error: connErr } = await supabaseAdmin
      .from('witness_connections')
      .select('*')
      .eq('witness_phone', seedConn.witness_phone)
      .eq('status', 'active');

    if (connErr) throw connErr;

    if (!allConnections || allConnections.length === 0) {
      return new Response(
        JSON.stringify({ error: 'invalid_or_expired' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 3. Group connections by ward (task_doer_id)
    const wardMap = new Map<string, any[]>();
    for (const conn of allConnections) {
      const existing = wardMap.get(conn.task_doer_id) || [];
      existing.push(conn);
      wardMap.set(conn.task_doer_id, existing);
    }

    // 4. Build ward data
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const wards = [];

    for (const [wardId, connections] of wardMap) {
      // Fetch ward user info
      const { data: wardUser } = await supabaseAdmin
        .from('users')
        .select('id, name, profile_photo_url')
        .eq('id', wardId)
        .single();

      const wardName = wardUser?.name || connections[0].task_doer_name;
      const notificationPreference = connections[0].notification_preference || 'alerts_only';

      // Build tasks array for this ward
      const tasks = [];
      let wardRelationship = 'other';

      for (const conn of connections) {
        // Fetch task details
        const { data: task } = await supabaseAdmin
          .from('tasks')
          .select('*')
          .eq('id', conn.task_id)
          .single();

        if (!task || !task.is_active) continue;

        // Capture relationship from first task
        if (tasks.length === 0 && task.witness_relationship) {
          wardRelationship = task.witness_relationship;
        }

        // Fetch task events for the past 60 days
        const { data: events } = await supabaseAdmin
          .from('task_events')
          .select('*')
          .eq('task_id', conn.task_id)
          .gte('scheduled_for', sixtyDaysAgo)
          .order('scheduled_for', { ascending: false });

        const completionRate = computeMonthlyCompletionRate(events || []);

        // Map events to dashboard format
        const mappedEvents = (events || []).map((ev: any) => ({
          date: toDateStr(ev.scheduled_for),
          scheduledTime: task.reminder_time,
          status: mapEventStatus(ev),
          respondedAt: toTimeStr(ev.responded_at),
          snoozeCount: ev.snooze_count || 0,
          actualDurationMinutes: ev.actual_duration_seconds
            ? Math.round(ev.actual_duration_seconds / 60)
            : null,
          targetDurationMinutes: ev.original_duration_minutes || null,
          extensionsUsed: ev.extensions_used || 0,
        }));

        tasks.push({
          id: task.id,
          name: task.name,
          category: task.category,
          categoryEmoji: CATEGORY_EMOJI[task.category] || '📋',
          reminderTime: task.reminder_time,
          frequency: task.frequency,
          frequencyLabel: getFrequencyLabel(task),
          durationMinutes: task.duration_minutes || null,
          currentStreak: task.current_streak || 0,
          longestStreak: task.longest_streak || 0,
          completionRateMonth: completionRate,
          events: mappedEvents,
        });
      }

      if (tasks.length === 0) continue;

      wards.push({
        id: wardId,
        name: wardName,
        initials: getInitials(wardName),
        relationship: wardRelationship,
        notificationPreference,
        tasks,
      });
    }

    // 5. Return structured response
    return new Response(
      JSON.stringify({
        success: true,
        witness: {
          name: seedConn.witness_name,
          phone: seedConn.witness_phone,
        },
        wards,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('get-witness-dashboard error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
