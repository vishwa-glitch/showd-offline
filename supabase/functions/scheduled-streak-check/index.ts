import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { sendSms } from '../_shared/twilio.ts';
import { streakMilestoneMessage } from '../_shared/templates.ts';

const MILESTONES = [7, 14, 21, 30, 50, 100];

// Runs daily — checks for streak milestones and notifies active witnesses.
serve(async () => {
  try {
    // Get tasks that hit a milestone streak
    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select('id, name, user_id, current_streak')
      .in('current_streak', MILESTONES)
      .eq('is_active', true);

    if (error) throw error;

    let sent = 0;
    for (const task of tasks || []) {
      // Find active witness for this task
      const { data: connections } = await supabaseAdmin
        .from('witness_connections')
        .select('*')
        .eq('task_id', task.id)
        .eq('status', 'active');

      // Get user name
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', task.user_id)
        .single();

      for (const conn of connections || []) {
        try {
          const body = streakMilestoneMessage({
            taskDoerName: user?.name || conn.task_doer_name,
            taskName: task.name,
            streak: task.current_streak,
          });

          const result = await sendSms({ to: conn.witness_phone, body });

          await supabaseAdmin.from('sms_log').insert({
            witness_connection_id: conn.id,
            to_phone: conn.witness_phone,
            type: 'milestone',
            message_body: body,
            twilio_message_sid: result.sid,
            segment_count: parseInt(result.num_segments, 10) || 1,
          });

          sent++;
        } catch (e) {
          console.error(`Failed streak notification for connection ${conn.id}:`, e);
        }
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('scheduled-streak-check error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
