# Witness Web Dashboard — Deployment Guide

Complete guide for deploying the witness web pages (invite + dashboard) and their Supabase Edge Function backends.

---

## 1. Database Migration

No migration needed. The existing `notification_preference` constraint already supports the two options used by the dashboard:

- **`alerts_only`** — SMS only when a task is missed or the doer is struggling
- **`weekly`** — One summary SMS on Sundays

> Daily SMS was intentionally excluded to control Twilio costs.

---

## 2. Deploy New Edge Functions

From the project root, deploy all 5 new Edge Functions:

```bash
# Witness web — invite page backend
supabase functions deploy get-witness-invite

# Witness web — dashboard backends
supabase functions deploy get-witness-dashboard
supabase functions deploy send-witness-nudge
supabase functions deploy update-witness-preferences
supabase functions deploy witness-opt-out
```

Also redeploy the updated weekly summary function:

```bash
supabase functions deploy scheduled-weekly-summary
```

### Verify deployment

```bash
supabase functions list
```

You should see all 5 new functions listed alongside the existing ones.

### Edge Function summary

| Function | Purpose | Called by |
|---|---|---|
| `get-witness-invite` | Look up invite by token, return doer/task/status | `app.js` (invite page) |
| `get-witness-dashboard` | Fetch all dashboard data for a witness token | `dashboard.js` |
| `send-witness-nudge` | Insert nudge + send push notification | `dashboard.js` (nudge button) |
| `update-witness-preferences` | Update notification preference | `dashboard.js` (preferences save) |
| `witness-opt-out` | Remove witness connection | `dashboard.js` (opt-out button) |

---

## 3. Hosting the Witness Web Pages

The `witness-web/` folder contains 6 static files (HTML, CSS, JS) with no build step. You need a static file host with URL routing support.

### Recommended: Cloudflare Pages (Free)

Best option — free, fast global CDN, custom domain support, simple setup.

1. **Create a Cloudflare Pages project:**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
   - Select **Connect to Git** or **Direct Upload**
   - If using Git: point to your repo, set build output directory to `witness-web/`
   - If using Direct Upload: drag the `witness-web/` folder

2. **Set up URL routing** (so `/witness/invite/TOKEN` and `/witness/dashboard/TOKEN` work):

   Create a `witness-web/_redirects` file:
   ```
   /witness/invite/*  /index.html?token=:splat  200
   /witness/dashboard/*  /dashboard.html?token=:splat  200
   ```

   Or use `witness-web/_routes.json`:
   ```json
   {
     "version": 1,
     "include": ["/*"]
   }
   ```

3. **Custom domain:**
   - Add `showd.app` (or a subdomain like `web.showd.app`) in Cloudflare Pages settings
   - Point your DNS CNAME to `your-project.pages.dev`

4. **Deploy:**
   ```bash
   # Using Wrangler CLI (Cloudflare's CLI)
   npx wrangler pages deploy witness-web/ --project-name showd-witness
   ```

### Alternative: Vercel (Free)

1. Create a `vercel.json` in the `witness-web/` folder:
   ```json
   {
     "rewrites": [
       { "source": "/witness/invite/:token", "destination": "/index.html?token=:token" },
       { "source": "/witness/dashboard/:token", "destination": "/dashboard.html?token=:token" }
     ]
   }
   ```

2. Deploy:
   ```bash
   cd witness-web
   npx vercel --prod
   ```

### Alternative: Netlify (Free)

1. Create a `witness-web/_redirects` file:
   ```
   /witness/invite/:token  /index.html?token=:token  200
   /witness/dashboard/:token  /dashboard.html?token=:token  200
   ```

2. Deploy:
   ```bash
   cd witness-web
   npx netlify deploy --prod --dir .
   ```

### Alternative: Supabase Storage (Simple, already in your stack)

If you want everything under one roof, you can host static files in Supabase Storage:

1. Create a public bucket called `witness-web`
2. Upload all 6 files
3. Access via `https://jbmvhlrdtyluahrqpimp.supabase.co/storage/v1/object/public/witness-web/dashboard.html?token=XYZ`

> **Downside:** No URL rewriting — witnesses would see the raw query string URL in their SMS. The other hosting options give cleaner URLs like `showd.app/witness/dashboard/TOKEN`.

---

## 4. Update SMS Link Format

After hosting is set up, update the `APP_URL` Edge Function secret to match your hosting domain:

```bash
supabase secrets set APP_URL=https://showd.app
```

This is used by:
- `send-witness-invite` — invite links in SMS: `https://showd.app/witness/invite/TOKEN`
- `scheduled-weekly-summary` — dashboard links in SMS: `https://showd.app/witness/dashboard/TOKEN`

> If your hosting doesn't support clean URL routing, you can change the URL format in `_shared/templates.ts` to use query strings instead:
> `https://showd.app/witness/index.html?token=TOKEN`

---

## 5. CORS Configuration (if needed)

Supabase Edge Functions handle CORS automatically for browser requests. If you encounter CORS issues from your hosted domain, add explicit CORS headers.

Go to **SQL Editor** and run:

```sql
-- Check if any CORS config is needed
-- Supabase Edge Functions serve CORS headers by default.
-- If you get CORS errors, check that your functions are deployed
-- and that you're calling the correct Supabase URL.
```

No SQL is usually needed — this is handled at the Edge Function level. If issues persist, you can add headers in each function:

```typescript
// Add to the top of any Edge Function that needs explicit CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Handle preflight
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}

// Add corsHeaders to all responses:
// { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
```

---

## 6. Testing

### Test the invite page

Open in browser:
```
# Demo mode (mock data, no API calls)
witness-web/index.html?token=DEMO01

# Real mode (calls get-witness-invite API)
witness-web/index.html?token=REAL_INVITE_TOKEN
```

### Test the dashboard

Open in browser:
```
# Demo mode (mock data, no API calls)
witness-web/dashboard.html

# Real mode (calls get-witness-dashboard API)
witness-web/dashboard.html?token=REAL_INVITE_TOKEN
```

### Test Edge Functions locally

```bash
# Start local Supabase (if not already running)
supabase start

# Serve functions locally
supabase functions serve

# Test get-witness-invite
curl -X POST http://localhost:54321/functions/v1/get-witness-invite \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_INVITE_TOKEN"}'

# Test get-witness-dashboard
curl -X POST http://localhost:54321/functions/v1/get-witness-dashboard \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_INVITE_TOKEN"}'

# Test send-witness-nudge
curl -X POST http://localhost:54321/functions/v1/send-witness-nudge \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_INVITE_TOKEN", "wardId": "WARD_USER_UUID", "message": "You got this!"}'

# Test update-witness-preferences
curl -X POST http://localhost:54321/functions/v1/update-witness-preferences \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_INVITE_TOKEN", "wardId": "WARD_USER_UUID", "preference": "daily"}'

# Test witness-opt-out
curl -X POST http://localhost:54321/functions/v1/witness-opt-out \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_INVITE_TOKEN", "wardId": "WARD_USER_UUID"}'
```

### Verify in Supabase dashboard

After testing:
- **Table Editor > nudges** — check nudge was inserted
- **Table Editor > witness_connections** — check notification_preference was updated
- **Table Editor > witness_connections** — check status changed to 'removed' after opt-out

---

## 7. Update SUPABASE_SETUP.md Deploy Section

Add the new functions to the deploy commands in Section 5 of `SUPABASE_SETUP.md`:

```bash
# Witness web page backends
supabase functions deploy get-witness-invite
supabase functions deploy get-witness-dashboard
supabase functions deploy send-witness-nudge
supabase functions deploy update-witness-preferences
supabase functions deploy witness-opt-out
```

---

## Summary Checklist

- [ ] No database migration needed (alerts_only + weekly already supported)
- [ ] All 5 new Edge Functions deployed
- [ ] Updated `scheduled-weekly-summary` redeployed
- [ ] Static files hosted (Cloudflare Pages / Vercel / Netlify)
- [ ] URL routing configured (`/witness/invite/TOKEN` and `/witness/dashboard/TOKEN`)
- [ ] Custom domain pointed to hosting
- [ ] `APP_URL` secret set to match hosting domain
- [ ] Invite page tested with real token
- [ ] Dashboard tested with real token
- [ ] Nudge, preferences, and opt-out tested end-to-end
- [ ] SMS templates verified (weekly summary includes dashboard link)

---

## Architecture Overview

```
Witness receives SMS
  → clicks link: showd.app/witness/invite/TOKEN
  → index.html loads
  → app.js calls get-witness-invite (Edge Function)
  → Shows invite details → Accept/Decline
  → Calls witness-respond (existing Edge Function)
  → On accept → shows "View Dashboard" link

Dashboard link: showd.app/witness/dashboard/TOKEN
  → dashboard.html loads
  → dashboard.js calls get-witness-dashboard (Edge Function)
  → Renders ward selector, calendar, activity feed
  → Nudge → send-witness-nudge (Edge Function) → nudges table + push notification
  → Preferences → update-witness-preferences (Edge Function)
  → Opt-out → witness-opt-out (Edge Function)
```
