import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { sendSms } from '../_shared/twilio.ts';
import { followUpMessage } from '../_shared/templates.ts';

const APP_URL = Deno.env.get('APP_URL') || 'https://showd.app';

// Runs daily — sends follow-up invites for connections that have been
// in "invited" status for 48+ hours without a follow-up already sent.
serve(async () => {
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: pending, error } = await supabaseAdmin
      .from('witness_connections')
      .select('*')
      .eq('status', 'invited')
      .is('follow_up_sent_at', null)
      .lt('invited_at', cutoff);

    if (error) throw error;

    let sent = 0;
    for (const conn of pending || []) {
      try {
        const body = followUpMessage({
          taskDoerName: conn.task_doer_name,
          inviteToken: conn.invite_token,
          appUrl: APP_URL,
        });

        const result = await sendSms({ to: conn.witness_phone, body });

        await supabaseAdmin
          .from('witness_connections')
          .update({ follow_up_sent_at: new Date().toISOString() })
          .eq('id', conn.id);

        await supabaseAdmin.from('sms_log').insert({
          witness_connection_id: conn.id,
          to_phone: conn.witness_phone,
          type: 'followup',
          message_body: body,
          twilio_message_sid: result.sid,
          segment_count: parseInt(result.num_segments, 10) || 1,
        });

        sent++;
      } catch (e) {
        console.error(`Failed to send follow-up for connection ${conn.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ sent, total: pending?.length || 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('scheduled-follow-up-invites error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
