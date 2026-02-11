import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { sendSms } from '../_shared/twilio.ts';
import { dailySummaryMessage } from '../_shared/templates.ts';

// Runs daily at 9pm — sends daily summary to witnesses with 'daily' preference.
serve(async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get all active connections with daily notification preference
    const { data: connections, error } = await supabaseAdmin
      .from('witness_connections')
      .select('*, tasks!inner(name, user_id)')
      .eq('status', 'active')
      .eq('notification_preference', 'daily');

    if (error) throw error;

    let sent = 0;
    for (const conn of connections || []) {
      try {
        // Count today's events for this task
        const { data: events } = await supabaseAdmin
          .from('task_events')
          .select('status')
          .eq('task_id', conn.task_id)
          .gte('scheduled_for', `${today}T00:00:00`)
          .lt('scheduled_for', `${today}T23:59:59`);

        const completed = events?.filter((e: any) => e.status === 'done').length || 0;
        const total = events?.length || 0;

        if (total === 0) continue; // No events today, skip

        const body = dailySummaryMessage({
          taskDoerName: conn.task_doer_name,
          completed,
          total,
        });

        const result = await sendSms({ to: conn.witness_phone, body });

        await supabaseAdmin.from('sms_log').insert({
          connection_id: conn.id,
          recipient_phone: conn.witness_phone,
          message_type: 'daily_summary',
          message_body: body,
          twilio_sid: result.sid,
          segments: parseInt(result.num_segments, 10) || 1,
          status: result.status,
        });

        sent++;
      } catch (e) {
        console.error(`Failed daily summary for connection ${conn.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('scheduled-daily-summary error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
