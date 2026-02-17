import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

serve(async (req) => {
  try {
    const { token, wardId, message } = await req.json();

    if (!token || !wardId || !message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Validate token
    const { data: seedConn, error: seedErr } = await supabaseAdmin
      .from('witness_connections')
      .select('witness_phone, witness_name')
      .eq('invite_token', token)
      .eq('status', 'active')
      .single();

    if (seedErr || !seedConn) {
      return new Response(
        JSON.stringify({ error: 'invalid_or_expired' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Find a connection for this specific ward
    const { data: wardConn, error: wardErr } = await supabaseAdmin
      .from('witness_connections')
      .select('id, task_id, task_doer_id')
      .eq('witness_phone', seedConn.witness_phone)
      .eq('task_doer_id', wardId)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (wardErr || !wardConn) {
      return new Response(
        JSON.stringify({ error: 'Connection not found for this ward' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Insert nudge
    const { error: nudgeErr } = await supabaseAdmin.from('nudges').insert({
      from_witness_phone: seedConn.witness_phone,
      from_witness_name: seedConn.witness_name,
      to_user_id: wardConn.task_doer_id,
      task_id: wardConn.task_id,
      message: message.trim().slice(0, 200),
    });

    if (nudgeErr) throw nudgeErr;

    // Send push notification if ward has a push token
    const { data: wardUser } = await supabaseAdmin
      .from('users')
      .select('expo_push_token')
      .eq('id', wardConn.task_doer_id)
      .single();

    if (wardUser?.expo_push_token) {
      try {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: wardUser.expo_push_token,
            title: `${seedConn.witness_name} sent you a nudge 💛`,
            body: message.trim().slice(0, 100),
            data: { type: 'nudge', taskId: wardConn.task_id },
          }),
        });
      } catch (pushErr) {
        // Non-fatal: nudge is saved in DB regardless
        console.error('Push notification failed:', pushErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('send-witness-nudge error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
