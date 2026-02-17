import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// DEPRECATED: Daily summary notifications have been removed in v3.
// The 'daily' notification_preference no longer exists.
// This function is kept as a no-op to avoid breaking any existing cron schedules.
serve(async () => {
  console.log('scheduled-daily-summary is deprecated and no longer sends messages.');
  return new Response(
    JSON.stringify({ deprecated: true, message: 'Daily summary has been removed in v3.' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
