/**
 * Showd Witness Web Page — App Logic
 *
 * URL format: ?token=ABC123
 *
 * States: loading → invite | invalid
 *         invite → accepted | declined
 *
 * In demo mode this uses hardcoded mock data instead of
 * calling Supabase Edge Functions.
 */

// --- Mock data (matches mockData.ts connections) ---
const MOCK_CONNECTIONS = {
  ABC123: {
    id: 'conn-mom',
    doerName: 'Alex',
    taskName: 'Take morning meds',
    witnessName: 'Mom',
    status: 'active', // already accepted
  },
  XYZ789: {
    id: 'conn-jordan',
    doerName: 'Alex',
    taskName: '30-min workout',
    witnessName: 'Jordan',
    status: 'invited',
  },
  // Demo token for testing invite flow
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
function init() {
  const params = new URLSearchParams(window.location.search);
  const token = (params.get('token') || '').toUpperCase().trim();

  if (!token) {
    showState('invalid');
    return;
  }

  // Simulate network delay
  setTimeout(() => {
    const connection = MOCK_CONNECTIONS[token];

    if (!connection) {
      showState('invalid');
      return;
    }

    // If already accepted/declined, show that state
    if (connection.status === 'active') {
      setText('accepted-doer', connection.doerName);
      showState('accepted');
      return;
    }

    if (connection.status === 'declined') {
      setText('declined-doer', connection.doerName);
      showState('declined');
      return;
    }

    // Show invite state
    setText('doer-name', connection.doerName);
    setText('task-name', connection.taskName);
    showState('invite');

    // Wire up buttons
    document.getElementById('btn-accept').addEventListener('click', function () {
      this.disabled = true;
      this.textContent = 'Accepting...';

      // [SUPABASE-TODO] Replace with Edge Function call:
      // fetch(`${SUPABASE_URL}/functions/v1/witness-respond`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ inviteToken: token, action: 'accept' }),
      // })

      setTimeout(() => {
        connection.status = 'active';
        setText('accepted-doer', connection.doerName);
        showState('accepted');
      }, 600);
    });

    document.getElementById('btn-decline').addEventListener('click', function () {
      this.disabled = true;
      document.getElementById('btn-accept').disabled = true;
      this.textContent = 'Declining...';

      // [SUPABASE-TODO] Replace with Edge Function call:
      // fetch(`${SUPABASE_URL}/functions/v1/witness-respond`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ inviteToken: token, action: 'decline' }),
      // })

      setTimeout(() => {
        connection.status = 'declined';
        setText('declined-doer', connection.doerName);
        showState('declined');
      }, 600);
    });
  }, 800);
}

document.addEventListener('DOMContentLoaded', init);
