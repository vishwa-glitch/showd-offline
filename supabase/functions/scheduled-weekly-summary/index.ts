import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { sendSms } from '../_shared/twilio.ts';
import { weeklySummaryMessage } from '../_shared/templates.ts';

// Runs every Sunday — sends weekly summary to witnesses with 'weekly' preference.
serve(async () => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: connections, error } = await supabaseAdmin
      .from('witness_connections')
      .select('*, tasks!inner(name, user_id, current_streak, longest_streak)')
      .eq('status', 'active')
      .eq('notification_preference', 'weekly');

    if (error) throw error;

    const APP_URL = Deno.env.get('APP_URL') || 'https://showd.app';

    let sent = 0;
    for (const conn of connections || []) {
      try {
        // Count events from the past week
        const { data: events } = await supabaseAdmin
          .from('task_events')
          .select('status')
          .eq('task_id', conn.task_id)
          .gte('scheduled_for', weekAgo);

        const total = events?.length || 0;
        const completed = events?.filter((e: any) => e.status === 'done').length || 0;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const task = conn.tasks as any;
        const dashboardUrl = `${APP_URL}/witness/dashboard/${conn.invite_token}`;

        const body = weeklySummaryMessage({
          taskDoerName: conn.task_doer_name,
          completed,
          total,
          completionRate,
          longestStreak: task?.longest_streak || 0,
          dashboardUrl,
        });

        const result = await sendSms({ to: conn.witness_phone, body });

        await supabaseAdmin.from('sms_log').insert({
          witness_connection_id: conn.id,
          to_phone: conn.witness_phone,
          type: 'weekly_summary',
          message_body: body,
          twilio_message_sid: result.sid,
          segment_count: parseInt(result.num_segments, 10) || 1,
        });

        sent++;
      } catch (e) {
        console.error(`Failed weekly summary for connection ${conn.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('scheduled-weekly-summary error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
