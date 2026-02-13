/**
 * Showd Witness Dashboard — Phase 1
 * Fully functional UI with hardcoded mock data.
 */

// ── Mock Event Generator ──────────────────────────────────────

function generateMockEvents(frequency, days, config) {
  const events = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build a realistic pattern for the last 14 days
  const recentPattern = [
    'done',           // today (will be overridden per-task)
    'snoozed_done',   // yesterday
    'done',           // 2 days ago
    'missed',         // 3 days ago
    'done',           // 4 days ago
    'done',           // 5 days ago
    'struggled',      // 6 days ago
    'done',           // 7 days ago
    'done',           // 8 days ago
    'done',           // 9 days ago
    'snoozed_done',   // 10 days ago
    'done',           // 11 days ago
    'done',           // 12 days ago
    'missed',         // 13 days ago
  ];

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = formatDateISO(date);
    const dayOfWeek = date.getDay(); // 0=Sun

    // For weekly tasks, only schedule on certain days
    if (frequency === 'weekly' && dayOfWeek !== 1 && dayOfWeek !== 3 && dayOfWeek !== 5) {
      continue;
    }

    let status;
    if (i === 0) {
      status = 'pending'; // today default (overridden by mock data)
    } else if (i < 14) {
      status = recentPattern[i] || 'done';
    } else {
      // Older days: use configured rates
      const roll = Math.random();
      if (roll < config.doneRate) status = 'done';
      else if (roll < config.doneRate + config.snoozedThenDoneRate) status = 'snoozed_done';
      else if (roll < config.doneRate + config.snoozedThenDoneRate + config.missedRate) status = 'missed';
      else status = 'struggled';
    }

    const hour = parseInt(config.scheduledTime || '08', 10);
    let respondedAt = null;
    let snoozeCount = 0;
    let actualDurationMinutes = null;
    let targetDurationMinutes = null;
    let extensionsUsed = 0;

    if (status === 'done') {
      const mins = hour * 60 + Math.floor(Math.random() * 20) + 2;
      respondedAt = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    } else if (status === 'snoozed_done') {
      snoozeCount = Math.random() > 0.5 ? 2 : 1;
      const mins = hour * 60 + 30 + Math.floor(Math.random() * 30);
      respondedAt = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    } else if (status === 'struggled') {
      respondedAt = `${String(hour).padStart(2, '0')}:${String(Math.floor(Math.random() * 30) + 5).padStart(2, '0')}`;
    }

    if (config.timedTask && (status === 'done' || status === 'snoozed_done')) {
      targetDurationMinutes = config.avgActualMinutes ? config.avgActualMinutes - 4 : 30;
      actualDurationMinutes = targetDurationMinutes + Math.floor(Math.random() * 10) - 2;
      if (actualDurationMinutes < targetDurationMinutes) actualDurationMinutes = targetDurationMinutes;
      extensionsUsed = Math.random() < (config.extensionRate || 0) ? 1 : 0;
    }

    events.push({
      date: dateStr,
      scheduledTime: `${String(hour).padStart(2, '0')}:00`,
      status,
      respondedAt,
      snoozeCount,
      actualDurationMinutes,
      targetDurationMinutes,
      extensionsUsed,
    });
  }

  return events;
}

function formatDateISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Mock Data ──────────────────────────────────────────────────

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
          durationMinutes: null,
          currentStreak: 14,
          longestStreak: 21,
          completionRateMonth: 87,
          events: generateMockEvents('daily', 45, {
            doneRate: 0.72, snoozedThenDoneRate: 0.10, missedRate: 0.08, struggledRate: 0.10,
            scheduledTime: '08',
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
          durationMinutes: 30,
          currentStreak: 7,
          longestStreak: 30,
          completionRateMonth: 78,
          events: generateMockEvents('daily', 45, {
            doneRate: 0.65, snoozedThenDoneRate: 0.13, missedRate: 0.12, struggledRate: 0.10,
            scheduledTime: '07', timedTask: true, avgActualMinutes: 34, extensionRate: 0.3,
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
            doneRate: 0.60, snoozedThenDoneRate: 0.11, missedRate: 0.18, struggledRate: 0.11,
            scheduledTime: '20',
          }),
        },
      ],
    },
  ],
};

// Override today's events for realism
(function patchTodayEvents() {
  const todayStr = formatDateISO(new Date());
  // Alex's medication: done today
  const medEvents = MOCK_DASHBOARD.wards[0].tasks[0].events;
  const todayMed = medEvents.find(e => e.date === todayStr);
  if (todayMed) {
    todayMed.status = 'done';
    todayMed.respondedAt = '08:12';
  }
  // Alex's workout: pending
  const workEvents = MOCK_DASHBOARD.wards[0].tasks[1].events;
  const todayWork = workEvents.find(e => e.date === todayStr);
  if (todayWork) {
    todayWork.status = 'pending';
    todayWork.respondedAt = null;
  }
  // Dad's medication: done today
  const dadEvents = MOCK_DASHBOARD.wards[1].tasks[0].events;
  const todayDad = dadEvents.find(e => e.date === todayStr);
  if (todayDad) {
    todayDad.status = 'done';
    todayDad.respondedAt = '20:05';
  }
})();

// ── Relationship Labels ────────────────────────────────────────

const RELATIONSHIP_LABELS = {
  partner: 'Your partner',
  parent: 'Your parent',
  child: 'Your child',
  friend: 'Your friend',
  sibling: 'Your sibling',
  other: 'Someone you support',
};

// ── App State ──────────────────────────────────────────────────

let state = {
  selectedWardIndex: 0,
  selectedTaskIndex: 0,
  calendarMonth: new Date().getMonth(),
  calendarYear: new Date().getFullYear(),
  activityPage: 0,
  data: null,
};

// ── DOM Helpers ────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showEl(id) { document.getElementById(id).classList.remove('hidden'); }
function hideEl(id) { document.getElementById(id).classList.add('hidden'); }

function showToast(message, duration) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, duration || 2000);
}

// ── Init ───────────────────────────────────────────────────────

function init() {
  // Simulate load delay
  setTimeout(() => {
    state.data = MOCK_DASHBOARD;
    hideEl('state-loading');
    showEl('state-dashboard');
    renderDashboard();
    animateSections();
  }, 600);
}

function animateSections() {
  const sections = $$('.section-animate');
  sections.forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), i * 100);
  });
}

// ── Render Dashboard ───────────────────────────────────────────

function renderDashboard() {
  const d = state.data;
  const w = d.witness;
  const wards = d.wards;

  // Greeting
  $('#greeting-name').textContent = `👋 Hey ${w.name}`;
  if (wards.length === 1) {
    $('#greeting-subtitle').textContent = `You're supporting ${wards[0].name}`;
  } else {
    $('#greeting-subtitle').textContent = `You're supporting ${wards.length} people`;
  }

  // Ward selector
  if (wards.length > 1) {
    showEl('ward-selector');
    renderWardSelector();
  }

  renderSelectedWard();
  wireGlobalEvents();
}

function renderWardSelector() {
  const container = $('#ward-cards');
  container.innerHTML = '';
  const wards = state.data.wards;

  wards.forEach((ward, idx) => {
    const card = document.createElement('div');
    card.className = `ward-card${idx === state.selectedWardIndex ? ' selected' : ''}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View ${ward.name}'s dashboard`);

    const taskCount = ward.tasks.length;
    const todayStr = formatDateISO(new Date());

    // Quick status
    let statusText = '';
    const firstTask = ward.tasks[0];
    if (firstTask.currentStreak > 0) {
      statusText = `🔥 ${firstTask.currentStreak} days`;
    } else {
      const missedToday = ward.tasks.some(t => {
        const ev = t.events.find(e => e.date === todayStr);
        return ev && ev.status === 'missed';
      });
      if (missedToday) statusText = '⚠️ 1 missed';
    }

    card.innerHTML = `
      <div class="ward-card-header">
        <div class="avatar avatar-sm">${ward.initials}</div>
        <span class="ward-card-name">${ward.name}</span>
      </div>
      <span class="ward-card-meta">${taskCount} task${taskCount !== 1 ? 's' : ''}</span>
      ${statusText ? `<span class="ward-card-status">${statusText}</span>` : ''}
    `;

    card.addEventListener('click', () => selectWard(idx));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectWard(idx); }
    });
    container.appendChild(card);
  });
}

function selectWard(idx) {
  if (idx === state.selectedWardIndex) return;
  state.selectedWardIndex = idx;
  state.selectedTaskIndex = 0;
  state.calendarMonth = new Date().getMonth();
  state.calendarYear = new Date().getFullYear();
  state.activityPage = 0;

  // Update selector visuals
  $$('.ward-card').forEach((c, i) => c.classList.toggle('selected', i === idx));

  // Crossfade content
  const dashboard = $('#ward-dashboard');
  dashboard.style.opacity = '0';
  setTimeout(() => {
    renderSelectedWard();
    dashboard.style.opacity = '1';
  }, 150);
}

// ── Render Selected Ward ───────────────────────────────────────

function renderSelectedWard() {
  const ward = state.data.wards[state.selectedWardIndex];

  renderSummary(ward);
  renderTaskTabs(ward);
  renderTaskInfo(ward);
  renderCalendar(ward);
  renderActivity(ward);
  renderNudge(ward);
  renderPreferences(ward);
  renderFooter(ward);
}

function getSelectedTask() {
  return state.data.wards[state.selectedWardIndex].tasks[state.selectedTaskIndex];
}

// ── Summary Card ───────────────────────────────────────────────

function renderSummary(ward) {
  $('#summary-avatar').textContent = ward.initials;
  $('#summary-name').textContent = ward.name;
  $('#summary-relationship').textContent = RELATIONSHIP_LABELS[ward.relationship] || 'Someone you support';

  const todayStr = formatDateISO(new Date());
  let doneToday = 0;
  let totalToday = 0;
  ward.tasks.forEach(t => {
    const ev = t.events.find(e => e.date === todayStr);
    if (ev) {
      totalToday++;
      if (ev.status === 'done' || ev.status === 'snoozed_done') doneToday++;
    }
  });

  const allDone = totalToday > 0 && doneToday === totalToday;
  const celebration = $('#summary-celebration');
  if (allDone) {
    celebration.classList.remove('hidden');
  } else {
    celebration.classList.add('hidden');
  }

  // Use currently selected task for streak/rate
  const task = getSelectedTask();

  let streakHTML;
  if (task.currentStreak > 0) {
    streakHTML = `<span class="streak-fire">🔥</span> ${task.currentStreak}`;
  } else {
    streakHTML = '—';
  }

  let todayStatColor = '';
  let todayLabel;
  if (totalToday === 0) {
    todayLabel = 'Not yet';
  } else if (allDone) {
    todayStatColor = 'stat-green';
    todayLabel = 'All done!';
  } else if (doneToday > 0) {
    todayStatColor = 'stat-amber';
    todayLabel = `${doneToday}/${totalToday} Done`;
  } else {
    const anyMissed = ward.tasks.some(t => {
      const ev = t.events.find(e => e.date === todayStr);
      return ev && ev.status === 'missed';
    });
    todayStatColor = anyMissed ? 'stat-red' : '';
    todayLabel = `${doneToday}/${totalToday} Done`;
  }

  $('#summary-stats').innerHTML = `
    <div class="stat-box">
      <div class="stat-value">${streakHTML}</div>
      <div class="stat-label">${task.currentStreak > 0 ? 'Day Streak' : 'No active streak'}</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${task.completionRateMonth}%</div>
      <div class="stat-label">This Month</div>
    </div>
    <div class="stat-box">
      <div class="stat-value ${todayStatColor}">${allDone ? '✅' : `✅ ${doneToday}/${totalToday}`}</div>
      <div class="stat-label">${allDone ? todayLabel : 'Done Today'}</div>
    </div>
  `;
}

// ── Task Tabs ──────────────────────────────────────────────────

function renderTaskTabs(ward) {
  const tabContainer = $('#task-tabs');
  if (ward.tasks.length <= 1) {
    tabContainer.classList.add('hidden');
    return;
  }
  tabContainer.classList.remove('hidden');

  const pills = $('#task-pills');
  pills.innerHTML = '';
  ward.tasks.forEach((task, idx) => {
    const btn = document.createElement('button');
    btn.className = `task-pill${idx === state.selectedTaskIndex ? ' active' : ''}`;
    btn.textContent = `${task.categoryEmoji} ${task.name}`;
    btn.addEventListener('click', () => selectTask(idx));
    pills.appendChild(btn);
  });
}

function selectTask(idx) {
  if (idx === state.selectedTaskIndex) return;
  state.selectedTaskIndex = idx;
  state.calendarMonth = new Date().getMonth();
  state.calendarYear = new Date().getFullYear();

  $$('.task-pill').forEach((p, i) => p.classList.toggle('active', i === idx));

  const ward = state.data.wards[state.selectedWardIndex];
  renderSummary(ward);
  renderTaskInfo(ward);
  renderCalendar(ward);
  renderActivity(ward);
}

// ── Task Info ──────────────────────────────────────────────────

function renderTaskInfo(ward) {
  const task = getSelectedTask();
  const durationLine = task.durationMinutes
    ? `⏱️ ${task.durationMinutes} minutes · Focus timer`
    : '⏱️ Instant task (no timer)';

  $('#task-info').innerHTML = `
    <div class="task-info-card">
      <div class="task-info-name">${task.categoryEmoji} ${task.name}</div>
      <div class="task-info-detail">
        ⏰ ${formatTime12(task.reminderTime)} · ${task.frequencyLabel}<br/>
        ${durationLine}
      </div>
    </div>
  `;
}

function formatTime12(time24) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ── Calendar ───────────────────────────────────────────────────

function renderCalendar() {
  const task = getSelectedTask();
  const year = state.calendarYear;
  const month = state.calendarMonth;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDateISO(today);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Title
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  $('#cal-title').textContent = `${monthNames[month]} ${year}`;

  // Nav limits: 6 months back, can't go past current month
  const minDate = new Date(currentYear, currentMonth - 6, 1);
  const maxDate = new Date(currentYear, currentMonth, 1);
  const viewDate = new Date(year, month, 1);

  $('#cal-prev').disabled = viewDate <= minDate;
  $('#cal-next').disabled = year === currentYear && month === currentMonth;

  // Build event lookup
  const eventMap = {};
  task.events.forEach(e => { eventMap[e.date] = e; });

  // Build grid
  const grid = $('#cal-grid');
  grid.innerHTML = '';

  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay(); // 0=Sun
  startDay = startDay === 0 ? 6 : startDay - 1; // Convert to Mon=0

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Previous month padding
  for (let i = startDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const cell = document.createElement('div');
    cell.className = 'cal-cell other-month';
    cell.textContent = d;
    grid.appendChild(cell);
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = formatDateISO(date);
    const event = eventMap[dateStr];
    const isPast = date < today;
    const isToday = dateStr === todayStr;
    const isFuture = date > today;

    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    cell.textContent = d;

    // Determine if scheduled (for daily, all days are scheduled)
    const isScheduled = task.frequency === 'daily' || !!event;

    if (!isScheduled && !event) {
      cell.classList.add('not-scheduled');
    } else if (event) {
      let tooltipText = '';
      switch (event.status) {
        case 'done':
          if (isToday) {
            cell.classList.add('today-done', 'clickable');
            tooltipText = `Done at ${formatTime12(event.respondedAt)}`;
          } else {
            cell.classList.add('done', 'clickable');
            tooltipText = `Done at ${formatTime12(event.respondedAt)}`;
          }
          break;
        case 'snoozed_done':
          cell.classList.add('snoozed-done', 'clickable');
          tooltipText = `Snoozed ${event.snoozeCount}x, done at ${formatTime12(event.respondedAt)}`;
          break;
        case 'missed':
          cell.classList.add('missed', 'clickable');
          tooltipText = 'Missed';
          break;
        case 'struggled':
          cell.classList.add('struggled', 'clickable');
          tooltipText = 'Had a tough day';
          break;
        case 'pending':
          if (isToday) {
            cell.classList.add('today-pending');
            tooltipText = 'Pending';
          }
          break;
      }

      if (tooltipText) {
        const tip = document.createElement('span');
        tip.className = 'cal-tooltip';
        tip.textContent = tooltipText;
        cell.appendChild(tip);
      }

      // Aria label
      const dateLabel = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      cell.setAttribute('aria-label', `${dateLabel}, ${tooltipText || 'Scheduled'}`);

      // Click to scroll to activity
      if (event.status !== 'pending' || isToday) {
        cell.addEventListener('click', () => scrollToActivity(dateStr));
      }
    } else if (isFuture && isScheduled) {
      cell.classList.add('future');
    } else if (isScheduled) {
      cell.classList.add('scheduled');
    }

    grid.appendChild(cell);
  }

  // Next month padding
  const totalCells = startDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell other-month';
    cell.textContent = i;
    grid.appendChild(cell);
  }
}

function scrollToActivity(dateStr) {
  const card = document.querySelector(`.activity-card[data-date="${dateStr}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('highlight');
  setTimeout(() => card.classList.remove('highlight'), 800);
}

// ── Activity Feed ──────────────────────────────────────────────

function renderActivity() {
  const task = getSelectedTask();
  const list = $('#activity-list');
  list.innerHTML = '';
  state.activityPage = 0;

  const sorted = [...task.events]
    .filter(e => {
      const d = new Date(e.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d <= today;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const PAGE_SIZE = 14;
  const page = sorted.slice(0, PAGE_SIZE);

  page.forEach(ev => list.appendChild(createActivityEntry(ev, task)));

  const showMore = $('#btn-show-more');
  if (sorted.length > PAGE_SIZE) {
    showMore.classList.remove('hidden');
    showMore.onclick = () => loadMoreActivity(sorted, task);
  } else {
    showMore.classList.add('hidden');
  }
}

function loadMoreActivity(allEvents, task) {
  state.activityPage++;
  const PAGE_SIZE = 14;
  const start = state.activityPage * PAGE_SIZE;
  const page = allEvents.slice(start, start + PAGE_SIZE);
  const list = $('#activity-list');

  page.forEach(ev => list.appendChild(createActivityEntry(ev, task)));

  if (start + PAGE_SIZE >= allEvents.length) {
    $('#btn-show-more').classList.add('hidden');
  }
}

function createActivityEntry(ev, task) {
  const wrapper = document.createElement('div');

  // Date label
  const dateLabel = document.createElement('div');
  dateLabel.className = 'activity-date';
  dateLabel.textContent = formatActivityDate(ev.date);
  wrapper.appendChild(dateLabel);

  // Card
  const card = document.createElement('div');
  card.className = `activity-card status-${ev.status}`;
  card.setAttribute('data-date', ev.date);

  let statusText = '';
  let detailText = '';

  switch (ev.status) {
    case 'done':
      statusText = `✅ Done at ${formatTime12(ev.respondedAt)}`;
      if (task.durationMinutes && ev.actualDurationMinutes) {
        detailText = `⏱️ Completed in ${ev.actualDurationMinutes} min (target: ${ev.targetDurationMinutes})`;
        if (ev.extensionsUsed > 0) detailText += ` +${ev.extensionsUsed} extension`;
      }
      break;
    case 'snoozed_done':
      statusText = `⏰ Snoozed ${ev.snoozeCount}x, then ✅ Done at ${formatTime12(ev.respondedAt)}`;
      if (task.durationMinutes && ev.actualDurationMinutes) {
        detailText = `⏱️ Completed in ${ev.actualDurationMinutes} min`;
      }
      break;
    case 'missed':
      statusText = '❌ Missed';
      break;
    case 'struggled':
      statusText = '😔 Had a tough day';
      break;
    case 'pending':
      statusText = '🔵 Pending';
      break;
  }

  card.innerHTML = `
    <div class="activity-status">${statusText}</div>
    ${detailText ? `<div class="activity-detail">${detailText}</div>` : ''}
  `;
  wrapper.appendChild(card);
  return wrapper;
}

function formatActivityDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === formatDateISO(today)) {
    return `Today · ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
  if (dateStr === formatDateISO(yesterday)) {
    return `Yesterday · ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Nudge Section ──────────────────────────────────────────────

function renderNudge(ward) {
  $('#nudge-heading').textContent = `💛 Send ${ward.name} some encouragement`;
  $('#nudge-caption').textContent = `${ward.name} will see this next time they open Showd.`;
  $('#nudge-input').value = '';
  $('#nudge-count').textContent = '0';
}

function wireNudgeEvents() {
  const input = $('#nudge-input');
  const countEl = $('#nudge-count');

  input.addEventListener('input', () => {
    countEl.textContent = input.value.length;
  });

  // Quick chips
  $$('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = chip.dataset.msg;
      countEl.textContent = input.value.length;
      input.focus();
    });
  });

  // Send
  $('#btn-nudge').addEventListener('click', () => {
    const msg = input.value.trim();
    if (!msg) return;

    const btn = $('#btn-nudge');
    const ward = state.data.wards[state.selectedWardIndex];
    btn.disabled = true;
    btn.textContent = '...';

    setTimeout(() => {
      console.log('[DEMO] Nudge sent:', { to: ward.name, message: msg });
      btn.textContent = 'Sent! 💛';
      btn.style.transform = 'scale(1.05)';
      setTimeout(() => { btn.style.transform = ''; }, 200);

      input.value = '';
      countEl.textContent = '0';

      setTimeout(() => {
        btn.textContent = 'Send Nudge →';
        btn.disabled = false;
      }, 2000);
    }, 300);
  });
}

// ── Preferences ────────────────────────────────────────────────

function renderPreferences(ward) {
  $('#prefs-subtitle').textContent = `How often would you like updates about ${ward.name}?`;
}

function wirePrefsEvents() {
  $('#btn-save-prefs').addEventListener('click', () => {
    const selected = document.querySelector('input[name="notif-pref"]:checked');
    if (selected) {
      console.log('[DEMO] Preferences saved:', selected.value);
      showToast('Preferences updated ✓');
    }
  });
}

// ── Footer / Opt-out ───────────────────────────────────────────

function renderFooter(ward) {
  $('#btn-opt-out').textContent = `Stop being ${ward.name}'s witness`;
}

function wireOptOut() {
  $('#btn-opt-out').addEventListener('click', () => {
    const ward = state.data.wards[state.selectedWardIndex];
    showModal(
      'Are you sure?',
      `${ward.name} will be notified that you've opted out. They can choose a new witness.`,
      () => {
        console.log('[DEMO] Opted out of witnessing:', ward.name);
        showToast('You are no longer witnessing ' + ward.name);
      }
    );
  });
}

// ── Modal ──────────────────────────────────────────────────────

function showModal(title, body, onConfirm) {
  $('#modal-title').textContent = title;
  $('#modal-body').textContent = body;
  $('#modal-overlay').classList.remove('hidden');

  const cancel = $('#modal-cancel');
  const confirm = $('#modal-confirm');

  function close() {
    $('#modal-overlay').classList.add('hidden');
    cancel.replaceWith(cancel.cloneNode(true));
    confirm.replaceWith(confirm.cloneNode(true));
  }

  cancel.addEventListener('click', close);
  confirm.addEventListener('click', () => {
    close();
    if (onConfirm) onConfirm();
  });
  $('#modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) close();
  });
}

// ── Global Events ──────────────────────────────────────────────

function wireGlobalEvents() {
  // Calendar nav
  $('#cal-prev').addEventListener('click', () => {
    state.calendarMonth--;
    if (state.calendarMonth < 0) {
      state.calendarMonth = 11;
      state.calendarYear--;
    }
    renderCalendar();
  });

  $('#cal-next').addEventListener('click', () => {
    state.calendarMonth++;
    if (state.calendarMonth > 11) {
      state.calendarMonth = 0;
      state.calendarYear++;
    }
    renderCalendar();
  });

  // Preferences scroll
  $('#btn-preferences').addEventListener('click', () => {
    $('#preferences-section').scrollIntoView({ behavior: 'smooth' });
  });

  wireNudgeEvents();
  wirePrefsEvents();
  wireOptOut();
}

// ── Ward Dashboard Transition ──────────────────────────────────

const wardDashboard = document.getElementById('ward-dashboard');
if (wardDashboard) {
  wardDashboard.style.transition = 'opacity 0.15s ease';
}

// ── Boot ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
