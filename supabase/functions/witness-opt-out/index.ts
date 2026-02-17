import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

serve(async (req) => {
  try {
    const { token, wardId } = await req.json();

    if (!token || !wardId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    // Get affected connection IDs before updating
    const { data: affectedConns } = await supabaseAdmin
      .from('witness_connections')
      .select('id, task_id')
      .eq('witness_phone', seedConn.witness_phone)
      .eq('task_doer_id', wardId)
      .eq('status', 'active');

    // Set all connections for this witness+ward to 'removed'
    const { error: updateErr } = await supabaseAdmin
      .from('witness_connections')
      .update({ status: 'removed' })
      .eq('witness_phone', seedConn.witness_phone)
      .eq('task_doer_id', wardId)
      .eq('status', 'active');

    if (updateErr) throw updateErr;

    // Clear witness fields on affected tasks
    if (affectedConns) {
      for (const conn of affectedConns) {
        await supabaseAdmin
          .from('tasks')
          .update({
            witness_connection_id: null,
            accountability_type: 'none',
            updated_at: new Date().toISOString(),
          })
          .eq('id', conn.task_id);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('witness-opt-out error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
