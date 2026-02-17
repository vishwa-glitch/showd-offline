import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

const VALID_PREFS = ['alerts_only', 'weekly'];

serve(async (req) => {
  try {
    const { token, wardId, preference } = await req.json();

    if (!token || !wardId || !VALID_PREFS.includes(preference)) {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Validate token
    const { data: seedConn, error: seedErr } = await supabaseAdmin
      .from('witness_connections')
      .select('witness_phone')
      .eq('invite_token', token)
      .eq('status', 'active')
      .single();

    if (seedErr || !seedConn) {
      return new Response(
        JSON.stringify({ error: 'invalid_or_expired' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Update ALL connections for this witness+ward pair
    const { error: updateErr } = await supabaseAdmin
      .from('witness_connections')
      .update({ notification_preference: preference })
      .eq('witness_phone', seedConn.witness_phone)
      .eq('task_doer_id', wardId)
      .eq('status', 'active');

    if (updateErr) throw updateErr;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('update-witness-preferences error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
