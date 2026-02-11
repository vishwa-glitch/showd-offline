import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

// Runs every 30 minutes — marks tasks as missed if they are past their
// reminder window (2 hours) and have no event for today.
serve(async () => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const cutoffTime = `${String(twoHoursAgo.getHours()).padStart(2, '0')}:${String(twoHoursAgo.getMinutes()).padStart(2, '0')}`;

    // Get active tasks whose reminder time is before the cutoff
    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select('id, user_id, reminder_time')
      .eq('is_active', true)
      .lte('reminder_time', cutoffTime);

    if (error) throw error;

    let marked = 0;
    for (const task of tasks || []) {
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

    return new Response(JSON.stringify({ marked, checked: tasks?.length || 0 }), {
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
