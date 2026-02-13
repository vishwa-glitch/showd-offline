# Claude Code Prompt: Build Witness Dashboard Web Page

## Context

The witness web page already exists in `witness-web/` with an invite/accept flow (`index.html`, `styles.css`, `app.js`). Now we're adding a **dashboard** — a separate page where the witness can see the progress of everyone they're supporting. The dashboard is accessed via a unique token URL, same pattern as the invite page.

This is built in **two phases:**
- **Phase 1 (this prompt):** Fully functional UI with hardcoded mock data. Production-ready design. Everything looks and works as it would in the real app — just backed by mock data instead of API calls.
- **Phase 2 (noted at the bottom):** Supabase Edge Function API endpoints and wiring up real data. Documented here for future reference, not implemented now.

**Tech:** Vanilla HTML, CSS, JS. No frameworks, no build step. Opens directly in a browser. Stays in the `witness-web/` folder alongside the existing invite page.

---

## Files to Create

```
witness-web/
├── index.html          # (existing — invite/accept page)
├── styles.css          # (existing — invite page styles)
├── app.js              # (existing — invite page logic)
├── dashboard.html      # ← NEW
├── dashboard.css       # ← NEW
└── dashboard.js        # ← NEW
```

The dashboard is a **separate HTML page**, not added to the existing `index.html`. In production, the URL would be `showd.app/witness/dashboard/[token]`. For demo, just open `dashboard.html` directly.

---

## Design System (must match the app + existing witness web page)

```css
/* Brand Colors */
--primary: #FF4D6A;
--primary-dark: #E8365A;
--primary-light: #FFF0F3;

/* Neutrals */
--background: #FBF8F6;
--surface: #FFFFFF;
--surface-secondary: #F5F1EE;
--text-primary: #1A1A1A;
--text-secondary: #6B6B6B;
--text-tertiary: #9E9E9E;
--border: #E8E4E1;

/* Status Colors */
--success: #2ECC71;
--success-light: #E8F8F0;
--snooze: #F5A623;
--snooze-light: #FEF6E7;
--struggling: #7C8DB5;
--struggling-light: #EEF1F7;
--missed: #E74C3C;
--missed-light: #FDECEB;
--in-progress: #3498DB;

/* Typography — Outfit from Google Fonts */
--font-family: 'Outfit', sans-serif;

/* Shadows */
--shadow-card: 0 2px 8px rgba(26, 26, 26, 0.06);
--shadow-elevated: 0 8px 24px rgba(26, 26, 26, 0.12);

/* Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
```

**Font:** Import Outfit from Google Fonts (same as the app). Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold).

**Mobile-first:** Max-width container of 480px centered on larger screens. Full-width padding on mobile. Same approach as the existing invite page.

---

## Page Layout — Top to Bottom

### URL Structure
```
Production: https://showd.app/witness/dashboard/[witnessToken]
Demo: just open dashboard.html (reads mock data)
```

On load, read the `?token=xxx` parameter from the URL. In Phase 1, ignore it and show mock data. In Phase 2, use it to fetch real data from the API.

---

### 1. Header

```
┌─────────────────────────────────────────┐
│  Showd.                    [Preferences] │
│  (logo, pink period)       (gear icon)  │
└─────────────────────────────────────────┘
```

- "Showd." logo top-left — same style as invite page (the period is pink)
- Small gear icon top-right — scrolls to notification preferences section at the bottom
- Below: a subtle top border line in pink (`2px solid var(--primary)` at the very top of the page — brand strip)

---

### 2. Witness Greeting

```
┌─────────────────────────────────────────┐
│                                         │
│  👋 Hey Sarah                           │
│  You're supporting 2 people             │
│                                         │
└─────────────────────────────────────────┘
```

- "Hey [witness name]" — 24px, bold, text-primary
- "You're supporting [N] people" — 14px, text-secondary
- If supporting only 1 person: "You're supporting [Name]" (skip the count)

---

### 3. Ward Selector (only if multiple wards)

If the witness supports **multiple people**, show a horizontal row of selectable ward cards:

```
┌────────────────────────────────────────────────┐
│                                                │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  ┌────┐      │  │  ┌────┐      │            │
│  │  │ A  │ Alex │  │  │ D  │ Dad  │            │
│  │  └────┘      │  │  └────┘      │            │
│  │  2 tasks     │  │  1 task      │            │
│  │  🔥 14 days  │  │  ⚠️ 1 missed │            │
│  └──────────────┘  └──────────────┘            │
│                                                │
└────────────────────────────────────────────────┘
```

Each ward card:
- 40px avatar circle (initials on pink gradient, same as the app)
- Ward's name (semibold)
- Number of tasks this witness watches for them
- Quick status indicator: streak fire if active, or warning if missed today
- **Selected state:** pink border (`2px solid var(--primary)`), light pink background (`var(--primary-light)`)
- **Unselected state:** standard border (`var(--border)`), white background
- Cards are horizontally scrollable if more than 2-3 wards on mobile

Tapping a ward card loads that ward's data into all sections below. The switch is instant (no page reload — just JavaScript showing/hiding content).

If only **1 ward**, skip this selector entirely and show their data directly.

---

### 4. Ward Dashboard (everything below changes per selected ward)

#### 4A. Ward Summary Card

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌────────┐                             │
│  │   A    │  Alex                       │
│  │        │  Your partner               │
│  └────────┘                             │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │🔥 14    │ │ 87%     │ │ ✅ 4/5   │  │
│  │Day      │ │This     │ │Done      │  │
│  │Streak   │ │Month    │ │Today     │  │
│  └─────────┘ └─────────┘ └──────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

- Large avatar (56px circle, initials on pink gradient)
- Ward's name (20px, bold)
- Relationship label below name ("Your partner" / "Your child" / "Your friend" etc.) — from `witness_connections.witness_relationship`, but shown from the witness's perspective
- Three stat boxes in a row:
  - **Streak:** fire emoji + number + "Day Streak" (or "No active streak" if 0)
  - **Completion rate:** percentage + "This Month"
  - **Today:** checkmark + "X/Y Done Today" (green text if all done, amber if in progress, red if any missed)
- Card: white surface, rounded 16px, card shadow, generous padding (24px)

#### 4B. Task Tabs (if ward has multiple tasks this witness watches)

If the witness watches **more than one task** for this ward, show pill tabs:

```
  [ 💊 Morning Medication ]  [ 🏋️ 30-min Workout ]
```

- Horizontal pills, scrollable on mobile
- Selected pill: pink background, white text
- Unselected pill: surface-secondary background, text-secondary
- Each pill shows the category emoji + task name
- Switching tabs changes the calendar + activity below

If only **1 task**, skip the tabs and show that task directly.

#### 4C. Task Info Bar

```
┌─────────────────────────────────────────┐
│  💊 Morning Medication                  │
│  ⏰ 8:00 AM · Daily                    │
│  ⏱️ Instant task (no timer)            │
└─────────────────────────────────────────┘
```

Or for a timed task:
```
┌─────────────────────────────────────────┐
│  🏋️ 30-min Workout                     │
│  ⏰ 7:00 AM · Daily                    │
│  ⏱️ 30 minutes · Focus timer           │
└─────────────────────────────────────────┘
```

- Category emoji + task name (18px, semibold)
- Time + frequency badge: "8:00 AM · Daily" or "7:00 AM · Weekly (Mon, Wed, Fri)" or "10:00 AM · Every 3 days"
- Duration line: "Instant task" or "[X] minutes · Focus timer"
- Light background card (`var(--surface-secondary)`), rounded 12px, 16px padding

#### 4D. Monthly Calendar

This is the centerpiece of the dashboard.

```
┌─────────────────────────────────────────┐
│  ◀  February 2026  ▶                   │
│                                         │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun      │
│                                         │
│        ·    ·    ·    ·    ·    ·       │
│   ·    ·    ·    ·    ·    ·    ·       │
│   ·    ·    ·    ·    ·    ·    ·       │
│   ·    ·    ·    ·    ·    ·    ·       │
│   ·    ·                                │
│                                         │
│  Legend:                                │
│  🟢 Done  🔴 Missed  🔵 Struggled      │
│  🟡 Snoozed→Done  ○ Upcoming           │
│                                         │
└─────────────────────────────────────────┘
```

**Calendar cell design — this is critical:**

Each day cell is a square (approximately 40px × 40px on mobile, 48px × 48px on desktop). The cell shows the date number.

**Two visual layers per cell:**

**Layer 1 — Schedule indicator (border):**
- If the task is scheduled on this day → cell gets a colored border
- Active/upcoming day: `2px solid var(--primary)` (pink border) — this shows "a reminder will/did fire on this day"
- Not scheduled (e.g., a weekly task on an off-day): no border, muted date number
- This immediately shows the rhythm: daily tasks have every cell bordered, weekly tasks show the pattern

**Layer 2 — Outcome (fill/dot inside the cell):**
For days that have passed and had a scheduled task:
- **Done:** Solid green fill (`var(--success)`) with white date number
- **Snoozed then done:** Green fill with a small amber dot in the corner (snoozed but ultimately completed)
- **Missed:** Solid red fill (`var(--missed)`) with white date number
- **Struggled:** Solid steel blue fill (`var(--struggling)`) with white date number
- **Today (pending/not yet responded):** Pink border only, no fill, pulsing subtle animation (CSS `@keyframes pulse` on the border opacity). Date number in pink.
- **Today (already done):** Green fill like past done days, but with a subtle "today" label or a slightly thicker border
- **Future scheduled:** Pink border, no fill, muted date number. Shows the upcoming schedule.
- **Not scheduled:** No border, no fill, very muted/light date number (`var(--text-tertiary)`)

**Navigation:**
- Left/right arrows to switch months
- Smooth transition (fade or slide) when switching
- Default to current month
- Can go back up to 6 months. Can't go forward beyond current month.

**Tapping a day cell:**
- If the day has an event → the Recent Activity section below scrolls to and highlights that day's entry
- If no event → nothing happens

**Legend:**
Below the calendar grid, show a small legend row with colored circles + labels. Keep it compact — one line.

#### 4E. Recent Activity (Last 14 Days)

```
┌─────────────────────────────────────────┐
│  Recent Activity                        │
│                                         │
│  Today · Feb 13                         │
│  ┌─────────────────────────────────┐    │
│  │ ✅ Done at 8:12 AM              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Yesterday · Feb 12                     │
│  ┌─────────────────────────────────┐    │
│  │ ⏰ Snoozed 2x, then ✅ Done    │    │
│  │    at 8:47 AM                   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Feb 11                                 │
│  ┌─────────────────────────────────┐    │
│  │ ❌ Missed                       │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Feb 10                                 │
│  ┌─────────────────────────────────┐    │
│  │ 😔 Had a tough day              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Feb 9                                  │
│  ┌─────────────────────────────────┐    │
│  │ ✅ Done at 8:05 AM              │    │
│  │    ⏱️ Completed in 34 min       │    │
│  │    (target: 30) +1 extension    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ...                                    │
│  [Show more ↓]                          │
│                                         │
└─────────────────────────────────────────┘
```

Each activity entry:
- Date label: "Today", "Yesterday", or the date — 12px, semibold, text-secondary, uppercase
- Activity card: white surface, 12px radius, card shadow, 12px padding
- Status icon + description text
- For timed tasks that were done: show actual duration and extensions if any
- For struggled: show "Had a tough day" — **DO NOT show the struggling reason** (privacy). The witness knows they struggled, not why.

**Status-specific styling:**
- Done: left border `3px solid var(--success)`, green status icon
- Missed: left border `3px solid var(--missed)`, red status icon
- Struggled: left border `3px solid var(--struggling)`, steel-blue icon. Text is warm: "Had a tough day" not "Struggled"
- Snoozed then done: left border `3px solid var(--snooze)`, amber icon transitioning to green

**"Show more" button:** If more than 14 days of history, show a "Show more" text link that loads the next 14 days. Don't load everything at once.

---

### 5. Send Encouragement (Nudge — Placeholder)

```
┌─────────────────────────────────────────┐
│                                         │
│  💛 Send Alex some encouragement        │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Write a kind message...         │    │
│  │                                 │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Quick messages:                        │
│  [ 💪 You got this! ]                   │
│  [ ❤️ Proud of you ]                   │
│  [ 🌟 One day at a time ]              │
│  [ ☀️ Tomorrow's a new day ]           │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Send Nudge →                   │    │
│  │  (pink button, full-width)      │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Alex will see this next time           │
│  they open Showd.                       │
│  (caption, muted)                       │
│                                         │
└─────────────────────────────────────────┘
```

- Section heading: "💛 Send [Name] some encouragement" — 18px, semibold
- Text area: 3-line minimum height, placeholder "Write a kind message...", max 200 characters, character count bottom-right
- **Quick message chips:** Pre-written encouraging messages as tappable pills. Tapping one fills the text area with that message (user can edit before sending).
- Send button: pink, full-width, "Send Nudge →"
- Caption below: "[Name] will see this next time they open Showd."

**Phase 1 behavior:** On send, show a success toast/animation ("Sent! 💛"), clear the input, and log to console: `console.log('[DEMO] Nudge sent:', { to: wardName, message })`. The UI should feel complete.

---

### 6. Notification Preferences

```
┌─────────────────────────────────────────┐
│                                         │
│  📱 Your notification preferences       │
│                                         │
│  How often would you like updates       │
│  about Alex?                            │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ (●) Only when they need help    │    │
│  │     Missed tasks & struggling   │    │
│  ├─────────────────────────────────┤    │
│  │ ( ) Daily summary               │    │
│  │     One text at 9pm with the    │    │
│  │     day's results               │    │
│  ├─────────────────────────────────┤    │
│  │ ( ) Weekly summary              │    │
│  │     One text on Sundays         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Save Preferences               │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

- Radio buttons styled the same as the invite page (custom styled, not browser defaults)
- Selected radio: pink filled circle
- Per-ward preferences (if watching multiple people, show a preference selector for each, or show for the currently selected ward)
- Save button: outlined style (not pink fill — secondary action)
- Phase 1: logs to console on save, shows success toast "Preferences updated"

---

### 7. Footer

```
┌─────────────────────────────────────────┐
│                                         │
│  Stop being [Name]'s witness            │
│  (muted text link)                      │
│                                         │
│  ─────────────────────────────          │
│                                         │
│  Showd — accountability that works      │
│  (caption, muted, centered)             │
│                                         │
└─────────────────────────────────────────┘
```

- "Stop being [Name]'s witness" — muted text link (`var(--text-tertiary)`). On tap: confirmation modal ("Are you sure? [Name] will be notified that you've opted out. They can choose a new witness."). On confirm: Phase 1 logs to console and shows a confirmation state. Phase 2 calls the API.
- If witnessing multiple people, this link is per-ward (shown for the currently selected ward)
- Showd tagline at the very bottom

---

## Mock Data (Phase 1)

In `dashboard.js`, define comprehensive mock data:

```javascript
const MOCK_DASHBOARD = {
  witness: {
    name: 'Sarah',
    phone: '+919123456789',
  },
  wards: [
    {
      id: 'ward-001',
      name: 'Alex',
      initials: 'A',
      relationship: 'partner',
      tasks: [
        {
          id: 'task-001',
          name: 'Morning Medication',
          category: 'medication',
          categoryEmoji: '💊',
          reminderTime: '08:00',
          frequency: 'daily',
          frequencyLabel: 'Daily',
          durationMinutes: null, // instant
          currentStreak: 14,
          longestStreak: 21,
          completionRateMonth: 87,
          // Generate 45 days of events (current month + previous month partial)
          events: generateMockEvents('daily', 45, {
            doneRate: 0.72,
            snoozedThenDoneRate: 0.10,
            missedRate: 0.08,
            struggledRate: 0.10,
          }),
        },
        {
          id: 'task-002',
          name: '30-min Workout',
          category: 'exercise',
          categoryEmoji: '🏋️',
          reminderTime: '07:00',
          frequency: 'daily',
          frequencyLabel: 'Daily',
          durationMinutes: 30, // timed
          currentStreak: 7,
          longestStreak: 30,
          completionRateMonth: 78,
          events: generateMockEvents('daily', 45, {
            doneRate: 0.65,
            snoozedThenDoneRate: 0.13,
            missedRate: 0.12,
            struggledRate: 0.10,
            // For timed tasks, include timer data
            timedTask: true,
            avgActualMinutes: 34,
            extensionRate: 0.3,
          }),
        },
      ],
    },
    {
      id: 'ward-002',
      name: 'Dad',
      initials: 'D',
      relationship: 'parent',
      tasks: [
        {
          id: 'task-003',
          name: 'Evening Medication',
          category: 'medication',
          categoryEmoji: '💊',
          reminderTime: '20:00',
          frequency: 'daily',
          frequencyLabel: 'Daily',
          durationMinutes: null,
          currentStreak: 3,
          longestStreak: 12,
          completionRateMonth: 71,
          events: generateMockEvents('daily', 45, {
            doneRate: 0.60,
            snoozedThenDoneRate: 0.11,
            missedRate: 0.18,
            struggledRate: 0.11,
          }),
        },
      ],
    },
  ],
};
```

**The `generateMockEvents` function** should create an array of event objects going back N days from today. Each event has:

```javascript
{
  date: '2026-02-13',         // ISO date string
  scheduledTime: '08:00',
  status: 'done',             // 'done' | 'snoozed_done' | 'missed' | 'struggled' | 'pending'
  respondedAt: '08:12',       // time string, null if missed
  snoozeCount: 0,
  // For timed tasks:
  actualDurationMinutes: 34,  // null for instant
  targetDurationMinutes: 30,  // null for instant
  extensionsUsed: 1,          // 0 if none
}
```

**Rules for mock event generation:**
- Today's first task: already "done" (so the witness sees a green checkmark)
- Today's second task (workout): "pending" (hasn't happened yet — shows the pulsing pink border)
- Yesterday: one snoozed-then-done, realistic mix
- 3 days ago: one missed (so the witness sees a red cell on the calendar)
- A struggled day somewhere in the past week
- The last 14 days should feel varied and realistic — not random noise, but a pattern (mostly done, occasional miss, rare struggle)
- Older days (15-45 days back): follow the rates defined in the mock config
- **Weekends** might have slightly different patterns (more misses for work tasks, fewer for medication)
- For the weekly task scenario: only generate events on scheduled days

---

## Interactions & Animations

1. **Ward selector cards:** On tap, selected card gets a smooth border color transition (200ms ease). The content below cross-fades (150ms fade out old, 150ms fade in new).

2. **Task tab pills:** Same smooth transition. Active pill slides its background with a subtle animation.

3. **Calendar month navigation:** Left/right arrows. Calendar grid fades and slides (slide-left when going forward, slide-right when going back). 250ms transition.

4. **Calendar cell hover (desktop):** Subtle scale-up (1.05) and shadow increase. Shows a small tooltip with the status text: "Done at 8:12 AM" or "Missed".

5. **Calendar cell tap (mobile):** Highlights the cell briefly (flash), scrolls the activity feed to that day's entry, and that entry gets a brief highlight pulse (light pink background flash, 500ms).

6. **Nudge send:** Button shows a brief loading spinner (300ms), then text changes to "Sent! 💛" with a scale-bounce animation, then resets after 2 seconds.

7. **Page load:** Content fades in from bottom, staggered by section (greeting → ward selector → summary card → calendar → activity). Each section delays by 100ms. 400ms fade duration.

8. **Streak number:** If streak > 0, the fire emoji has a subtle CSS flicker/glow animation (very subtle, warm orange glow pulse, 3s infinite).

---

## Responsive Design

**Mobile (< 480px):**
- Full-width with 16px side padding
- Ward selector cards: horizontal scroll, each card min-width 140px
- Calendar cells: 40px × 40px, tighter spacing
- Activity cards: full-width
- Nudge section: full-width
- Stack everything vertically

**Tablet/Desktop (480px+):**
- Max-width 520px container, centered
- Calendar cells: 48px × 48px, comfortable spacing
- Same vertical layout (no side-by-side columns — dashboard is a focused single-column experience)

---

## Accessibility

- All interactive elements are focusable and keyboard-navigable
- Calendar cells have `aria-label`: "February 13, Done at 8:12 AM" or "February 14, Missed"
- Color is not the only indicator — status icons (✅, ❌, 😔, ⏰) accompany all color coding
- Radio buttons in preferences are properly labeled
- Sufficient color contrast (test the light fills against white background)
- Touch targets minimum 44px × 44px

---

## Edge States

**Witness removed / connection expired:**
If the token is invalid or the connection has been removed, show:
```
┌─────────────────────────────────────────┐
│  Showd.                                 │
│                                         │
│  This dashboard is no longer active.    │
│                                         │
│  The person you were supporting has     │
│  ended this accountability connection.  │
│                                         │
│  Thank you for being there. 💛          │
└─────────────────────────────────────────┘
```

**No events yet (new connection):**
If the ward just added the witness and no task events exist yet:
- Calendar shows the schedule (pink borders on upcoming days) but no fills
- Activity feed shows: "No activity yet. [Name]'s first reminder is coming up!"
- Stats show: streak 0, completion rate "—", today "Not yet"

**All tasks done today:**
- Today's stat box is green: "✅ All done!"
- A small celebratory note in the summary: "Great day so far 🎉"

---

## Phase 2 — Supabase Integration (For Future Reference)

When ready to connect to real data, here's what's needed:

### New Edge Function: `get-witness-dashboard`

```
POST /functions/v1/get-witness-dashboard
Body: { token: string }
```

**Logic:**
1. Look up `witness_connections` where `invite_token = token` and `status = 'active'`
2. If not found or not active → return `{ error: 'invalid_or_expired' }`
3. Get all witness_connections for this witness phone (they may witness multiple people)
4. For each connection, fetch:
   - The ward's user data (name, photo from `users` table)
   - The task data (name, category, frequency, duration from `tasks` table)
   - Task events for the past 60 days (from `task_events` table, ordered by scheduled_for)
   - Current streak and completion rate (computed from events)
5. Return structured response:

```typescript
{
  witness: { name: string, phone: string },
  wards: [
    {
      id: string,
      name: string,
      profilePhotoUrl: string | null,
      relationship: string,
      tasks: [
        {
          id: string,
          name: string,
          category: string,
          reminderTime: string,
          frequency: string,
          frequencyDays: number[] | null,
          customIntervalDays: number | null,
          durationMinutes: number | null,
          currentStreak: number,
          completionRateMonth: number,
          events: [
            {
              date: string,
              status: string,
              respondedAt: string | null,
              snoozeCount: number,
              actualDurationSeconds: number | null,
              originalDurationMinutes: number | null,
              extensionsUsed: number,
            }
          ]
        }
      ]
    }
  ]
}
```

### New Edge Function: `send-witness-nudge`

```
POST /functions/v1/send-witness-nudge
Body: { token: string, wardId: string, taskId: string, message: string }
```

**Logic:**
1. Validate the token → get witness connection
2. Validate the ward is actually connected to this witness
3. Insert into `nudges` table: `{ from_witness_phone, from_witness_name, to_user_id, task_id, message }`
4. Send a push notification to the ward (via Expo Push API) if they have a push token
5. Return `{ success: true }`

### New Edge Function: `update-witness-preferences`

```
POST /functions/v1/update-witness-preferences
Body: { token: string, preference: 'alerts_only' | 'daily' | 'weekly' }
```

**Logic:**
1. Validate the token
2. Update `witness_connections.notification_preference` for this connection
3. Return `{ success: true }`

### New Edge Function: `witness-opt-out`

```
POST /functions/v1/witness-opt-out
Body: { token: string, wardId: string }
```

**Logic:**
1. Validate the token
2. Update `witness_connections.status = 'removed'`
3. Send "ended" SMS to the ward
4. Send push notification to the ward: "[Witness name] has opted out of being your witness for [task]"
5. Return `{ success: true }`

### RLS Policy Addition

```sql
-- Witness dashboard: allow reading via Edge Function (service role)
-- No direct user access — all reads go through the get-witness-dashboard function
-- The Edge Function uses the service_role_key, bypassing RLS
```

### Wiring It Up (Phase 2 changes to dashboard.js)

Replace the mock data loading with:

```javascript
// Phase 2: Replace loadMockData() with this
async function loadDashboardData(token) {
  showLoading();
  try {
    const response = await fetch(
      'https://your-project.supabase.co/functions/v1/get-witness-dashboard',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }
    );
    const data = await response.json();
    if (data.error) {
      showErrorState(data.error);
      return;
    }
    renderDashboard(data);
  } catch (err) {
    showErrorState('network_error');
  }
}

// Similar pattern for nudge, preferences, opt-out
```

### Link Distribution

Add the dashboard link to SMS templates:

```
Daily:      "[Name]'s day: ✅ 3/4 done. Missed: [task]. Dashboard: [short-link] — Showd"
Weekly:     "[Name]'s week: ✅ 18/21 done (86%). Dashboard: [short-link] — Showd"
```

And on the invite accepted page (existing `app.js`), add a "View Dashboard" button that links to `dashboard.html?token=[same-token]`.

---

## Linking the Invite Page to the Dashboard

In the existing `app.js` (invite page), in the **accepted state**, add a button:

```html
<a href="dashboard.html?token=demo-invite-token-001" class="dashboard-link-btn">
  📊 View Dashboard
</a>
```

Style it as a secondary button (outlined, not filled). This gives the witness a direct path from accepting → viewing the dashboard.

---

## Implementation Notes

1. **The calendar is the hardest part.** Build it as a proper month grid generator in JavaScript. Handle month boundaries, first-day-of-week alignment, and days from previous/next months (grayed out). Test February 2026 specifically (it starts on a Sunday).

2. **Keep CSS organized.** Use the same class naming convention as the existing invite page styles. If the invite page uses BEM-ish naming, follow that. If it's flat classes, stay flat.

3. **The mock event generator should feel realistic.** Don't just random-roll each day — create patterns. A streak of 5 done days, then a miss, then back to done. Cluster struggles near each other (bad weeks happen). Make weekends slightly different. The mock data IS the demo — it needs to tell a believable story.

4. **Test the calendar grid on month boundaries.** February 2026 has 28 days, starts on Sunday. March starts on Sunday. January has 31 days, starts on Thursday. Make sure the grid handles all of these.

5. **The dashboard should load fast.** No heavy libraries. No unnecessary DOM operations. The mock data is already in memory — render it immediately after the brief entrance animation.

6. **File size:** Keep `dashboard.css` and `dashboard.js` lean. Target under 15KB for CSS, under 20KB for JS (before any minification). This is a simple page — don't over-engineer it.