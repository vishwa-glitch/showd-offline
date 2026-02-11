import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { sendSms } from '../_shared/twilio.ts';
import { missedTaskMessage, struggledTaskMessage } from '../_shared/templates.ts';

serve(async (req) => {
  try {
    const {
      connectionId,
      witnessPhone,
      witnessName,
      taskDoerName,
      taskName,
      type,
      reason,
    } = await req.json();

    if (!['missed', 'struggled'].includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid event type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const body = type === 'missed'
      ? missedTaskMessage({ taskDoerName, taskName })
      : struggledTaskMessage({ taskDoerName, taskName });

    const result = await sendSms({ to: witnessPhone, body });

    // Log SMS
    await supabaseAdmin.from('sms_log').insert({
      connection_id: connectionId,
      recipient_phone: witnessPhone,
      message_type: `task_${type}`,
      message_body: body,
      twilio_sid: result.sid,
      segments: parseInt(result.num_segments, 10) || 1,
      status: result.status,
    });

    return new Response(JSON.stringify({ success: true, sid: result.sid }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('on-task-event-change error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
