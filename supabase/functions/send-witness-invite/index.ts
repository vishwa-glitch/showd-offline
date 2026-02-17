import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { sendSms } from '../_shared/twilio.ts';
import { inviteMessage, followUpMessage } from '../_shared/templates.ts';

const APP_URL = Deno.env.get('APP_URL') || 'https://showd.app';

serve(async (req) => {
  try {
    const {
      connectionId,
      witnessPhone,
      witnessName,
      taskDoerName,
      taskName,
      inviteToken,
      isFollowUp,
    } = await req.json();

    const body = isFollowUp
      ? followUpMessage({ taskDoerName, inviteToken, appUrl: APP_URL })
      : inviteMessage({ taskDoerName, taskName, inviteToken, appUrl: APP_URL });

    const result = await sendSms({ to: witnessPhone, body });

    // Log SMS
    await supabaseAdmin.from('sms_log').insert({
      witness_connection_id: connectionId,
      to_phone: witnessPhone,
      type: isFollowUp ? 'followup' : 'invite',
      message_body: body,
      twilio_message_sid: result.sid,
      segment_count: parseInt(result.num_segments, 10) || 1,
    });

    // Update follow_up_sent_at if it's a follow-up
    if (isFollowUp && connectionId) {
      await supabaseAdmin
        .from('witness_connections')
        .update({ follow_up_sent_at: new Date().toISOString() })
        .eq('id', connectionId);
    }

    return new Response(JSON.stringify({ success: true, sid: result.sid }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('send-witness-invite error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
