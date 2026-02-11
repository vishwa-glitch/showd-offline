import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

serve(async (req) => {
  try {
    const { inviteToken, action } = await req.json();

    if (!inviteToken || !['accept', 'decline'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Find the connection by invite token
    const { data: connection, error: findError } = await supabaseAdmin
      .from('witness_connections')
      .select('*')
      .eq('invite_token', inviteToken)
      .single();

    if (findError || !connection) {
      return new Response(
        JSON.stringify({ error: 'Invite not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (connection.status !== 'invited') {
      return new Response(
        JSON.stringify({ error: 'Invite already responded to', status: connection.status }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      status: action === 'accept' ? 'active' : 'declined',
    };
    if (action === 'accept') updates.accepted_at = now;
    if (action === 'decline') updates.declined_at = now;

    const { error: updateError } = await supabaseAdmin
      .from('witness_connections')
      .update(updates)
      .eq('id', connection.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, status: updates.status }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('witness-respond error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
