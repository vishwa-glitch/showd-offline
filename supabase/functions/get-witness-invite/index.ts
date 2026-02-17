import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

serve(async (req) => {
  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Find the connection by invite token
    const { data: connection, error: findError } = await supabaseAdmin
      .from('witness_connections')
      .select('id, task_doer_name, witness_name, status, task_id')
      .eq('invite_token', token)
      .single();

    if (findError || !connection) {
      return new Response(
        JSON.stringify({ error: 'invalid_or_expired' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Get task name
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('name')
      .eq('id', connection.task_id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        doerName: connection.task_doer_name,
        taskName: task?.name || 'their task',
        witnessName: connection.witness_name,
        status: connection.status,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('get-witness-invite error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
