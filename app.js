/**
 * StatusRadar — app.js
 * ─────────────────────────────────────────────────────────────
 * Core application logic.
 *
 * Fetch strategy (3-layer, no backend needed):
 *   1. Try corsproxy.io   — primary CORS proxy
 *   2. Try allorigins.win — secondary CORS proxy
 *   3. Fall back to realistic mock data from apis.js profiles
 *
 * Depends on: apis.js (APIS array + MOCK_PROFILE object)
 */

'use strict';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const S = {
  results:    {},   // { [id]: { status, latency, message, checkedAt, _isMock } }
  history:    {},   // { [id]: [ { status, latency } ] }  — max 12 entries
  filter:     'all',
  search:     '',
  sort:       'default',
  countdown:  30,
  timer:      null,
  refreshing: false,
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CORS PROXIES (tried in order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HELPERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/** Current time as HH:MM:SS string */
function nowTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/** CSS class for a latency value */
function latClass(ms) {
  if (ms === null || ms === undefined) return 'unknown';
  if (ms < 400) return 'fast';
  if (ms < 900) return 'medium';
  return 'slow';
}

/** Bar fill % from latency (capped at 1500ms = 100%) */
function latWidth(ms) {
  if (!ms) return 0;
  return Math.min((ms / 1500) * 100, 100);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MOCK DATA FALLBACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Returns a realistic simulated result for an API
 * using its mock profile defined in apis.js.
 */
function getMockResult(id) {
  const p = MOCK_PROFILE[id] || { base: 150, variance: 100, upProb: 0.95 };
  const r = Math.random();
  let status, latency, message;

  if (r < p.upProb) {
    // Operational — with slight random latency fluctuation
    const raw = Math.round(p.base + (Math.random() - 0.5) * p.variance);
    latency = Math.max(40, raw);
    status  = latency > 800 ? 'degraded' : 'operational';
    message = status === 'operational' ? 'All Systems Operational' : 'Elevated response times';
  } else if (r < p.upProb + 0.05) {
    // Degraded
    status  = 'degraded';
    latency = Math.round(p.base * 2.5 + Math.random() * 200);
    message = 'Partial service disruption';
  } else {
    // Down
    status  = 'down';
    latency = null;
    message = 'Service unavailable or timed out';
  }

  return { status, latency, message };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FETCH LOGIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Fetch a URL through a given proxy function with a timeout.
 * Returns parsed JSON or throws.
 */
async function tryFetch(url, proxyFn, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(proxyFn(url), { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(tid);
    throw err;
  }
}

/**
 * Parse a Statuspage v2 JSON response.
 * Handles both direct JSON and allorigins-wrapped `{ contents: "..." }`.
 * Returns { status, message } or null if parsing fails.
 */
function parseStatuspage(raw) {
  try {
    let data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    // allorigins wraps response in { contents: "..." }
    if (data && data.contents) data = JSON.parse(data.contents);

    const indicator = data?.status?.indicator ?? '';
    const desc      = data?.status?.description ?? 'Unknown';
    if (!indicator) return null;

    const status =
      indicator === 'none'                            ? 'operational' :
      indicator === 'minor' || indicator === 'maintenance' ? 'degraded'    :
      'down';

    return { status, message: desc };
  } catch {
    return null;
  }
}

/**
 * Check a single API — tries each proxy in order, falls back to mock.
 * Updates S.results and S.history, then re-renders card immediately.
 */
async function checkAPI(api) {
  // Ensure history array exists
  if (!S.history[api.id]) S.history[api.id] = [];

  const t0 = performance.now();
  let result = null;

  // ── Try each CORS proxy ──────────────────────────────────
  for (const proxyFn of PROXIES) {
    try {
      const raw     = await tryFetch(api.url, proxyFn);
      const latency = Math.round(performance.now() - t0);
      const parsed  = parseStatuspage(raw);
      if (parsed) {
        result = { ...parsed, latency };
        break;
      }
    } catch (_) {
      // Try next proxy silently
    }
  }

  // ── Fall back to realistic mock ──────────────────────────
  if (!result) {
    result = { ...getMockResult(api.id), _isMock: true };
  }

  result.checkedAt = nowTime();
  S.results[api.id] = result;

  // Append to history (max 12)
  S.history[api.id].push({ status: result.status, latency: result.latency });
  if (S.history[api.id].length > 12) S.history[api.id].shift();

  // Update UI immediately (don't wait for all APIs)
  renderCard(api.id);
  updateStats();
  updateTicker();
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DOM — CARD BUILDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/** Build initial DOM for one API card (skeleton state) */
function buildCard(api, idx) {
  const card = document.createElement('div');
  card.className   = 'api-card st-checking';
  card.id          = `card-${api.id}`;
  card.tabIndex    = 0;
  card.setAttribute('data-status', 'checking');
  card.setAttribute('data-name', api.name.toLowerCase());
  card.style.animationDelay = `${idx * 0.03}s`;

  card.innerHTML = `
    <div class="card-head">
      <div class="card-left">
        <div class="card-emoji">${api.emoji}</div>
        <div class="card-name-wrap">
          <div class="card-name">${api.name}</div>
          <div class="card-cat">${api.cat}</div>
        </div>
      </div>
      <div class="status-pill checking" id="pill-${api.id}">
        <span class="pdot"></span>
        <span id="pill-lbl-${api.id}">Checking</span>
      </div>
    </div>

    <div class="latency-wrap">
      <div class="lat-row">
        <span class="lat-label">Response Time</span>
        <span class="lat-val unknown" id="lat-val-${api.id}">—</span>
      </div>
      <div class="lat-track">
        <div class="lat-fill" id="lat-fill-${api.id}" style="width:0%"></div>
      </div>
    </div>

    <div class="spark-wrap">
      <div class="spark-lbl">Last 12 checks</div>
      <div class="sparkline" id="spark-${api.id}">
        ${Array.from({ length: 12 })
          .map(() => `<div class="s-bar empty" style="height:3px"></div>`)
          .join('')}
      </div>
    </div>

    <div class="card-footer">
      <span class="card-desc">${api.desc}</span>
      <button class="ping-btn" data-id="${api.id}">Ping</button>
    </div>

    <div class="card-detail" id="detail-${api.id}">
      <div class="detail-grid" id="detail-grid-${api.id}"></div>
      <div class="error-note" id="error-${api.id}" style="display:none"></div>
      <a href="${api.hp}" target="_blank" rel="noopener" class="detail-link">
        ↗ View official status page
      </a>
    </div>
  `;

  // Click anywhere on card (except ping btn / link) → expand/collapse
  card.addEventListener('click', (e) => {
    if (e.target.closest('.ping-btn') || e.target.closest('.detail-link')) return;
    card.classList.toggle('expanded');
  });

  // Keyboard accessible
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.classList.toggle('expanded');
    }
  });

  return card;
}

/** Insert all cards into the grid */
function buildGrid() {
  const grid = document.getElementById('apiGrid');
  grid.innerHTML = '';
  APIS.forEach((api, idx) => grid.appendChild(buildCard(api, idx)));
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DOM — CARD RENDERING (after fetch)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/** Update a single card's UI from S.results[id] */
function renderCard(id) {
  const card = document.getElementById(`card-${id}`);
  const r    = S.results[id];
  const api  = APIS.find((a) => a.id === id);
  if (!card || !r || !api) return;

  const { status, latency, message, checkedAt, _isMock } = r;
  const lc = latClass(latency);

  // ── Card border ──────────────────────────────────────────
  const wasExpanded = card.classList.contains('expanded');
  card.className    = `api-card st-${status}${wasExpanded ? ' expanded' : ''}`;
  card.setAttribute('data-status', status);

  // ── Status pill ──────────────────────────────────────────
  const pill = document.getElementById(`pill-${id}`);
  const lbl  = document.getElementById(`pill-lbl-${id}`);
  const labels = { operational: 'Operational', degraded: 'Degraded', down: 'Down', checking: 'Checking' };
  pill.className  = `status-pill ${status}`;
  lbl.textContent = labels[status] || status;

  // ── Latency value ────────────────────────────────────────
  const latVal  = document.getElementById(`lat-val-${id}`);
  const latFill = document.getElementById(`lat-fill-${id}`);
  latVal.className  = `lat-val ${lc}`;
  latVal.textContent = latency !== null ? `${latency}ms` : '—';
  latFill.className  = `lat-fill ${lc}`;
  // Delay for CSS transition to fire
  requestAnimationFrame(() => {
    latFill.style.width = latency ? `${latWidth(latency)}%` : '0%';
  });

  // ── Sparkline ────────────────────────────────────────────
  const hist   = S.history[id] || [];
  const spark  = document.getElementById(`spark-${id}`);
  const padded = Array.from({ length: 12 }, (_, i) => {
    const hi = i - (12 - hist.length);
    return hi >= 0 ? hist[hi] : null;
  });
  spark.innerHTML = padded.map((h) => {
    if (!h) return `<div class="s-bar empty" style="height:3px"></div>`;
    const hpx = h.latency
      ? Math.max(3, Math.min(22, Math.round((h.latency / 800) * 22)))
      : 3;
    const cls = h.status === 'operational' ? 'ok'
              : h.status === 'degraded'    ? 'warn'
              : 'err';
    return `<div class="s-bar ${cls}" style="height:${hpx}px" title="${h.latency || 0}ms"></div>`;
  }).join('');

  // ── Detail panel ─────────────────────────────────────────
  const mockNote = _isMock ? ' <span style="opacity:.5">(simulated)</span>' : '';
  document.getElementById(`detail-grid-${id}`).innerHTML = `
    <div class="detail-item">
      <div class="detail-key">Status message</div>
      <div class="detail-val">${message || '—'}</div>
    </div>
    <div class="detail-item">
      <div class="detail-key">Last checked</div>
      <div class="detail-val">${checkedAt}${mockNote}</div>
    </div>
    <div class="detail-item">
      <div class="detail-key">Response time</div>
      <div class="detail-val">${latency !== null ? latency + 'ms' : 'Timeout'}</div>
    </div>
    <div class="detail-item">
      <div class="detail-key">Category</div>
      <div class="detail-val">${api.cat}</div>
    </div>
  `;

  // ── Error note ───────────────────────────────────────────
  const errNote = document.getElementById(`error-${id}`);
  if (status === 'down') {
    errNote.style.display = 'block';
    errNote.textContent   = `⚠ ${message || 'Service appears to be down or unreachable.'}`;
  } else {
    errNote.style.display = 'none';
  }

  // Re-apply visibility filter (in case card changed status category)
  applyVisibility();
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PING BUTTON (per-card)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.ping-btn');
  if (!btn || btn.disabled) return;

  const id  = btn.dataset.id;
  const api = APIS.find((a) => a.id === id);
  if (!api) return;

  btn.disabled    = true;
  btn.textContent = '...';

  const card = document.getElementById(`card-${id}`);
  if (card) card.classList.add('st-checking');

  try {
    await checkAPI(api);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Ping';
    showToast(`✓ ${api.name} re-checked`);
  }
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   STATS STRIP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function updateStats() {
  const vals = Object.values(S.results);
  const ok   = vals.filter((v) => v.status === 'operational').length;
  const warn = vals.filter((v) => v.status === 'degraded').length;
  const dn   = vals.filter((v) => v.status === 'down').length;
  const lats = vals.map((v) => v.latency).filter((l) => l != null);
  const avg  = lats.length
    ? Math.round(lats.reduce((a, b) => a + b, 0) / lats.length)
    : null;

  animNum('sOk',  ok);
  animNum('sWarn', warn);
  animNum('sDown', dn);
  document.getElementById('sAvg').textContent = avg != null ? avg + 'ms' : '—';
  document.getElementById('sectionCount').textContent =
    `${vals.length} of ${APIS.length} checked`;
}

/** Pop the number with a brief scale animation when it changes */
function animNum(id, val) {
  const el = document.getElementById(id);
  if (!el || parseInt(el.textContent) === val) return;
  el.textContent      = val;
  el.style.transform  = 'scale(1.15)';
  setTimeout(() => { el.style.transform = ''; }, 200);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LIVE TICKER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function updateTicker() {
  const issues = APIS.filter((a) => {
    const r = S.results[a.id];
    return r && (r.status === 'down' || r.status === 'degraded');
  });
  const allOk = APIS.filter((a) => {
    const r = S.results[a.id];
    return r && r.status === 'operational';
  });

  let items = [];
  if (issues.length === 0 && allOk.length > 0) {
    items = ['✅ All monitored services operational'];
    allOk.slice(0, 8).forEach((a) => {
      const r = S.results[a.id];
      items.push(`${a.emoji} ${a.name} — ${r.latency}ms`);
    });
  } else {
    issues.forEach((a) => {
      const r    = S.results[a.id];
      const icon = r.status === 'down' ? '🔴' : '🟡';
      items.push(`${icon} ${a.name}: ${r.message || r.status}`);
    });
    allOk.slice(0, 5).forEach((a) => {
      const r = S.results[a.id];
      items.push(`✅ ${a.name} — ${r.latency}ms`);
    });
  }

  if (!items.length) return;
  // Duplicate for seamless loop
  const html = [...items, ...items]
    .map((t) => `<span class="ticker-item">${t}<span class="ticker-sep">·</span></span>`)
    .join('');
  document.getElementById('tickerInner').innerHTML = html;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FILTER / SEARCH / SORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/** Show/hide cards based on current filter, search and sort */
function applyVisibility() {
  const f = S.filter;
  const q = S.search.toLowerCase();
  let visible = 0;

  APIS.forEach((api) => {
    const card   = document.getElementById(`card-${api.id}`);
    if (!card) return;
    const r      = S.results[api.id];
    const status = r ? r.status : 'checking';
    const nameMatch   = api.name.toLowerCase().includes(q) || api.cat.toLowerCase().includes(q);
    const statusMatch = f === 'all' || f === status;
    const show        = nameMatch && statusMatch;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  // ── Sort ────────────────────────────────────────────────
  const grid  = document.getElementById('apiGrid');
  const cards = [...grid.querySelectorAll('.api-card')];

  if (S.sort === 'name') {
    cards.sort((a, b) => {
      const na = APIS.find((x) => `card-${x.id}` === a.id)?.name || '';
      const nb = APIS.find((x) => `card-${x.id}` === b.id)?.name || '';
      return na.localeCompare(nb);
    });
  } else if (S.sort === 'latency') {
    cards.sort((a, b) => {
      const la = S.results[a.id.replace('card-', '')]?.latency ?? 99999;
      const lb = S.results[b.id.replace('card-', '')]?.latency ?? 99999;
      return la - lb;
    });
  } else if (S.sort === 'status') {
    const order = { operational: 0, degraded: 1, down: 2, checking: 3 };
    cards.sort((a, b) => {
      const sa = S.results[a.id.replace('card-', '')]?.status ?? 'checking';
      const sb = S.results[b.id.replace('card-', '')]?.status ?? 'checking';
      return (order[sa] || 3) - (order[sb] || 3);
    });
  }

  cards.forEach((c) => grid.appendChild(c));

  // ── Empty State ─────────────────────────────────────────
  let empty = grid.querySelector('.empty-state');
  if (visible === 0) {
    if (!empty) {
      empty = document.createElement('div');
      empty.className   = 'empty-state';
      empty.innerHTML   = `<p>No services match your filter. Try adjusting your search or filter.</p>`;
      grid.appendChild(empty);
    }
  } else if (empty) {
    empty.remove();
  }
}

// ── Filter button events ──────────────────────────────────
document.querySelectorAll('.fbtn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fbtn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    S.filter = btn.dataset.f;
    applyVisibility();
  });
});

// ── Search event ──────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', (e) => {
  S.search = e.target.value;
  applyVisibility();
});

// ── Sort event ────────────────────────────────────────────
document.getElementById('sortSelect').addEventListener('change', (e) => {
  S.sort = e.target.value;
  applyVisibility();
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   REFRESH ALL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
async function refreshAll() {
  if (S.refreshing) return;
  S.refreshing = true;

  const btn = document.getElementById('refreshBtn');
  btn.classList.add('spinning');

  try {
    // Fire all checks in parallel — each updates the UI as it resolves
    await Promise.allSettled(APIS.map((api) => checkAPI(api)));
  } finally {
    S.refreshing = false;
    btn.classList.remove('spinning');
    resetCountdown();
    showToast(`✓ All ${APIS.length} services checked — ${nowTime()}`);
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   COUNTDOWN TIMER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function resetCountdown() {
  clearInterval(S.timer);
  S.countdown = 30;
  const el    = document.getElementById('countdown');
  if (el) el.textContent = 30;

  S.timer = setInterval(() => {
    S.countdown--;
    const el = document.getElementById('countdown');
    if (el) el.textContent = S.countdown;
    if (S.countdown <= 0) {
      clearInterval(S.timer);
      refreshAll();
    }
  }, 1000);
}

// Manual refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
  clearInterval(S.timer);
  refreshAll();
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LIVE CLOCK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function updateClock() {
  const d = new Date();
  const dateStr = d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  const dateEl = document.getElementById('metaDate');
  const timeEl = document.getElementById('metaTime');
  if (dateEl) dateEl.textContent = dateStr;
  if (timeEl) timeEl.textContent = nowTime();
}
setInterval(updateClock, 1000);
updateClock();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TOAST NOTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   INIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function init() {
  buildGrid();
  refreshAll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
