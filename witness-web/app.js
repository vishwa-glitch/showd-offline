/**
 * Showd Witness Web Page — App Logic
 *
 * URL format: ?token=ABC123
 *
 * States: loading → invite | invalid
 *         invite → accepted | declined
 *
 * Phase 2: Real Supabase API integration with mock data fallback.
 */

// ── API Configuration ─────────────────────────────────────────

const SUPABASE_URL = 'https://jbmvhlrdtyluahrqpimp.supabase.co';

// ── Mock data (fallback when no token or for demo tokens) ─────

const MOCK_CONNECTIONS = {
  ABC123: {
    id: 'conn-mom',
    doerName: 'Alex',
    taskName: 'Take morning meds',
    witnessName: 'Mom',
    status: 'active',
  },
  XYZ789: {
    id: 'conn-jordan',
    doerName: 'Alex',
    taskName: '30-min workout',
    witnessName: 'Jordan',
    status: 'invited',
  },
  DEMO01: {
    id: 'conn-demo',
    doerName: 'Alex',
    taskName: 'Evening journal',
    witnessName: 'Sam',
    status: 'invited',
  },
};

// --- DOM helpers ---
function show(id) {
  document.getElementById(id).classList.remove('hidden');
}

function hide(id) {
  document.getElementById(id).classList.add('hidden');
}

function setText(id, text) {
  document.getElementById(id).textContent = text;
}

// --- State transitions ---
function showState(state) {
  ['state-loading', 'state-invite', 'state-accepted', 'state-declined', 'state-invalid']
    .forEach(hide);
  show('state-' + state);
}

// --- Init ---
async function init() {
  const params = new URLSearchParams(window.location.search);
  const rawToken = params.get('token') || '';

  if (!rawToken) {
    showState('invalid');
    return;
  }

  // Check if this is a demo token (uppercase mock key)
  const upperToken = rawToken.toUpperCase().trim();
  const mockConnection = MOCK_CONNECTIONS[upperToken];

  if (mockConnection) {
    // Demo mode — use mock data
    initWithData(mockConnection, upperToken, true);
    return;
  }

  // Real API mode — fetch invite details
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-witness-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      showState('invalid');
      return;
    }

    initWithData(data, rawToken, false);
  } catch (err) {
    console.error('Init failed:', err);
    showState('invalid');
  }
}

function initWithData(connection, token, isDemo) {
  // If already accepted, show accepted state
  if (connection.status === 'active') {
    setText('accepted-doer', connection.doerName);
    // Update dashboard link with actual token
    const dashLink = document.querySelector('.dashboard-link-btn');
    if (dashLink) dashLink.href = `dashboard.html?token=${encodeURIComponent(token)}`;
    showState('accepted');
    return;
  }

  if (connection.status === 'declined') {
    setText('declined-doer', connection.doerName);
    showState('declined');
    return;
  }

  if (connection.status === 'removed') {
    showState('invalid');
    return;
  }

  // Show invite state
  setText('doer-name', connection.doerName);
  setText('task-name', connection.taskName);
  showState('invite');

  // Wire up accept button
  document.getElementById('btn-accept').addEventListener('click', async function () {
    this.disabled = true;
    this.textContent = 'Accepting...';

    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 600));
        connection.status = 'active';
      } else {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/witness-respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inviteToken: token, action: 'accept' }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Accept failed');
      }

      setText('accepted-doer', connection.doerName);
      // Update dashboard link with actual token
      const dashLink = document.querySelector('.dashboard-link-btn');
      if (dashLink) dashLink.href = `dashboard.html?token=${encodeURIComponent(token)}`;
      showState('accepted');
    } catch (err) {
      console.error('Accept failed:', err);
      this.textContent = 'Failed — try again';
      this.disabled = false;
    }
  });

  // Wire up decline button
  document.getElementById('btn-decline').addEventListener('click', async function () {
    this.disabled = true;
    document.getElementById('btn-accept').disabled = true;
    this.textContent = 'Declining...';

    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 600));
        connection.status = 'declined';
      } else {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/witness-respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inviteToken: token, action: 'decline' }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Decline failed');
      }

      setText('declined-doer', connection.doerName);
      showState('declined');
    } catch (err) {
      console.error('Decline failed:', err);
      this.textContent = 'Failed — try again';
      this.disabled = false;
      document.getElementById('btn-accept').disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
