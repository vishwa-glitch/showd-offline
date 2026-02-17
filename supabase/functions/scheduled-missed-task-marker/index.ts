import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

// Runs every 30 minutes — marks tasks as missed if they are past their
// reminder window (10 minutes) and have no event for today.
serve(async () => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const cutoffTime = `${String(tenMinutesAgo.getHours()).padStart(2, '0')}:${String(tenMinutesAgo.getMinutes()).padStart(2, '0')}`;

    // Get active tasks whose reminder time is before the cutoff
    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select('id, user_id, reminder_time, created_at')
      .eq('is_active', true)
      .lte('reminder_time', cutoffTime);

    if (error) throw error;

    let marked = 0;
    let skipped = 0;
    for (const task of tasks || []) {
      // Skip tasks created after today's reminder time — the user hasn't had
      // a fair chance to complete them yet (e.g. task created at 6 PM with
      // reminder_time set to 4 PM should NOT be marked missed today).
      const [rH, rM] = task.reminder_time.split(':').map(Number);
      const todayReminderTime = new Date(now);
      todayReminderTime.setHours(rH, rM, 0, 0);
      const taskCreatedAt = new Date(task.created_at);
      if (taskCreatedAt >= todayReminderTime) {
        skipped++;
        continue;
      }
      // Check if there's already an event today for this task
      const { data: existing } = await supabaseAdmin
        .from('task_events')
        .select('id')
        .eq('task_id', task.id)
        .gte('scheduled_for', `${today}T00:00:00`)
        .lt('scheduled_for', `${today}T23:59:59`)
        .in('status', ['done', 'struggled', 'missed', 'in_progress'])
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Mark as missed
      const nowIso = new Date().toISOString();
      await supabaseAdmin.from('task_events').insert({
        id: crypto.randomUUID(),
        task_id: task.id,
        scheduled_for: nowIso,
        status: 'missed',
        snooze_count: 0,
        created_at: nowIso,
      });

      // Reset streak
      await supabaseAdmin
        .from('tasks')
        .update({ current_streak: 0, updated_at: nowIso })
        .eq('id', task.id);

      marked++;
    }

    return new Response(JSON.stringify({ marked, skipped, checked: tasks?.length || 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('scheduled-missed-task-marker error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
