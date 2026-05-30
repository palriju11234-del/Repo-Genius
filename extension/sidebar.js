/**
 * RepoGenius Chrome Extension — Sidebar Content Script (sidebar.js)
 *
 * Injected on GitHub search pages. Detects the search query, fetches
 * personalized recommendations from RepoGenius backend, and renders
 * a glassmorphism sidebar panel above the native GitHub search results.
 */

const BACKEND_URL = 'http://127.0.0.1:8000';
const SIDEBAR_ID  = 'rg-personalized-sidebar';

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractSearchQuery() {
  const params = new URLSearchParams(window.location.search);
  return (params.get('q') || '').trim();
}

function getIconUrl() {
  return chrome.runtime.getURL('icons/icon48.png');
}

// ── Profile Fetch ─────────────────────────────────────────────────────────────

async function getProfile() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'RG_GET_PROFILE' }, (resp) => {
      resolve(resp?.profile || null);
    });
  });
}

// ── Track Interaction ─────────────────────────────────────────────────────────

function trackInteraction(repo, action, query) {
  chrome.runtime.sendMessage({
    type: 'RG_TRACK_INTERACTION',
    repo,
    action,
    query,
  });
}

// ── Insert Sidebar into GitHub DOM ────────────────────────────────────────────

function findInsertionPoint() {
  // Primary: the search results list container
  const selectors = [
    '[data-testid="results-list"]',
    '.search-results-container .Box',
    '.search-results .Box',
    'div[aria-label="Search results"]',
    '#search-results',
    '.codesearch-results',
    'main div.container-xl',
    'main',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function removeSidebar() {
  const existing = document.getElementById(SIDEBAR_ID);
  if (existing) existing.remove();
}

// ── Build Sidebar HTML ────────────────────────────────────────────────────────

function buildSidebarHTML(repos, query, profile) {
  const expLabel = {
    beginner:     '🌱 Beginner',
    intermediate: '⚡ Intermediate',
    advanced:     '🔥 Advanced',
    professional: '🏆 Professional',
  }[profile.experience] || (profile.experience || 'Developer');

  const goalLabel = {
    learning: 'Learning',
    building: 'Building',
    hackathons: 'Hackathon',
    open_source: 'Open Source',
    production: 'Production',
    research: 'Research',
  }[profile.goal] || 'Exploring';

  const repoCardsHTML = repos.slice(0, 3).map((repo, idx) => buildRepoCardHTML(repo, idx, query)).join('');

  return `
    <div id="${SIDEBAR_ID}" class="rg-sidebar">

      <!-- Header -->
      <div class="rg-header">
        <div class="rg-brand">
          <img src="${getIconUrl()}" alt="RG" class="rg-brand-icon" />
          <span class="rg-brand-title">RepoGenius AI</span>
          <span class="rg-badge-ai">Personalized</span>
        </div>
        <button class="rg-close-btn" id="rg-close">✕</button>
      </div>

      <!-- Profile strip -->
      <div class="rg-profile-strip">
        <span class="rg-chip rg-chip-exp">${expLabel}</span>
        <span class="rg-chip rg-chip-lang">${profile.language || 'Any Language'}</span>
        <span class="rg-chip rg-chip-goal">${goalLabel}</span>
      </div>

      <!-- Search intent -->
      <p class="rg-intent">
        Search Intent: <strong>${goalLabel} "${escapeHtml(query)}"</strong> projects
      </p>

      <!-- Repo cards -->
      <p class="rg-section-title">Recommendations Personalized For You</p>
      <div class="rg-repo-list">
        ${repoCardsHTML}
      </div>

      <!-- Footer -->
      <div class="rg-footer">
        <a class="rg-footer-link" href="http://localhost:5173?q=${encodeURIComponent(query)}" target="_blank">
          View All in RepoGenius →
        </a>
        <span class="rg-footer-hint">Ranked by AI · Explainable</span>
      </div>
    </div>`;
}

function buildRepoCardHTML(repo, idx, query) {
  const rank  = idx + 1;
  const stars = repo.stars >= 1000
    ? `${(repo.stars / 1000).toFixed(1)}k`
    : `${repo.stars}`;
  const score     = Math.round((repo.personalized_score || repo.relevance_score || 0) * 100);
  const cardId    = `rg-card-${idx}`;
  const explainId = `rg-explain-${idx}`;

  // Repo description — basic feature always shown if available
  const repoDesc = repo.description || '';

  // AI brief description — shown as an extra AI insight if generated
  const briefDesc = repo.ai_brief_description || '';

  // AI discovery insights
  const aiInsight   = repo.ai_insight || '';
  const whyFits     = repo.ai_why_it_fits || '';
  const advantages  = repo.ai_advantages || [];
  const disadvantages = repo.ai_disadvantages || [];
  const bestUseCase = repo.ai_best_use_case || '';

  // Explanation reasons (✓/✗ list)
  const reasons   = repo.explanation_reasons || [];
  const reasonsHTML = reasons.map(r => {
    const cls = r.startsWith('\u2713') ? 'positive' : r.startsWith('\u2717') ? 'negative' : 'neutral';
    return `<li class="${cls}">${escapeHtml(r)}</li>`;
  }).join('');

  // Show AI Insight toggle if there is any rich AI data
  const hasInsight = aiInsight || whyFits || advantages.length > 0 || disadvantages.length > 0 || bestUseCase || reasons.length > 0;
  
  const advantagesHTML = advantages.map(adv => `<li>${escapeHtml(adv)}</li>`).join('');
  const disadvantagesHTML = disadvantages.map(dis => `<li>${escapeHtml(dis)}</li>`).join('');

  const insightPanelHTML = hasInsight ? `
    <button class="rg-explain-toggle" data-target="${explainId}">
      🤖 AI Insight ▾
    </button>
    <div class="rg-explain-card" id="${explainId}">
      <div class="rg-insight-header">★ AI DISCOVERY INSIGHT</div>
      
      ${aiInsight ? `
        <p class="rg-insight-text">${escapeHtml(aiInsight)}</p>
      ` : ''}

      ${whyFits ? `
        <div class="rg-insight-box rg-why-fits-box">
          <div class="rg-box-title">WHY IT FITS YOUR QUERY</div>
          <p class="rg-box-text">${escapeHtml(whyFits)}</p>
        </div>
      ` : ''}

      ${advantages.length > 0 || disadvantages.length > 0 ? `
        <div class="rg-insight-columns">
          ${advantages.length > 0 ? `
            <div class="rg-insight-col rg-advantages-col">
              <div class="rg-col-title">✓ ADVANTAGES</div>
              <ul class="rg-col-list">${advantagesHTML}</ul>
            </div>
          ` : ''}
          ${disadvantages.length > 0 ? `
            <div class="rg-insight-col rg-disadvantages-col">
              <div class="rg-col-title">✗ DISADVANTAGES</div>
              <ul class="rg-col-list">${disadvantagesHTML}</ul>
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${bestUseCase ? `
        <div class="rg-insight-box rg-best-use-box">
          <div class="rg-box-title">🎯 BEST USE CASE</div>
          <p class="rg-box-text">${escapeHtml(bestUseCase)}</p>
        </div>
      ` : ''}

      ${reasons.length > 0 ? `
        <div class="rg-insight-reasons-section">
          <div class="rg-box-title">👤 PROFILE MATCH REASONS</div>
          <ul class="rg-explain-reasons">${reasonsHTML}</ul>
        </div>
      ` : ''}
    </div>` : '';

  return `
    <div class="rg-repo-card" id="${cardId}" data-repo="${escapeHtml(repo.full_name)}" data-query="${escapeHtml(query)}">
      <div class="rg-repo-top">
        <span class="rg-rank-badge">${rank}</span>
        <span class="rg-repo-name">${escapeHtml(repo.full_name)}</span>
        <span class="rg-score-pill">${score}% match</span>
      </div>

      ${repoDesc ? `<div class="rg-repo-desc">${escapeHtml(repoDesc)}</div>` : ''}
      ${briefDesc ? `<div class="rg-repo-desc" style="font-style: italic; color: #58a6ff; margin-top: 6px;">✨ ${escapeHtml(briefDesc)}</div>` : ''}

      <div class="rg-repo-meta">
        <span class="rg-stars">${stars}</span>
        <span class="rg-lang">${escapeHtml(repo.language || 'Unknown')}</span>
        ${repo.ai_suitability ? `<span class="rg-suit">${escapeHtml(repo.ai_suitability)}</span>` : ''}
      </div>

      <!-- AI Insight toggle -->
      ${insightPanelHTML}

      <!-- Quick actions -->
      <div class="rg-actions">
        <a href="${repo.url || `https://github.com/${repo.full_name}`}"
           target="_blank"
           class="rg-action-btn"
           data-action="viewed">🔍 View Repo</a>
        <button class="rg-action-btn" data-action="saved">🔖 Save</button>
        <button class="rg-action-btn" data-action="starred">⭐ Star</button>
      </div>
    </div>`;
}

function scoreBar(label, value = 0) {
  const pct = Math.round((value || 0) * 100);
  return `
    <div class="rg-score-row">
      <span class="rg-score-label">${label}</span>
      <div class="rg-score-bar-track">
        <div class="rg-score-bar-fill" style="width:${pct}%"></div>
      </div>
      <span class="rg-score-val">${pct}%</span>
    </div>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Attach Event Listeners to Sidebar ────────────────────────────────────────

function attachSidebarListeners(query) {
  // Close button
  const closeBtn = document.getElementById('rg-close');
  if (closeBtn) closeBtn.addEventListener('click', removeSidebar);

  // Explain toggles
  document.querySelectorAll('.rg-explain-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (target) {
        target.classList.toggle('open');
        btn.textContent = target.classList.contains('open')
          ? 'Hide AI Insight ▲'
          : '🤖 AI Insight ▾';
      }
    });
  });


  // Action buttons (Save / Star only — View Repo is a real <a> link, don't intercept it)
  document.querySelectorAll('.rg-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Let <a> tags (View Repo) navigate normally
      if (btn.tagName === 'A') {
        const card = btn.closest('.rg-repo-card');
        trackInteraction(card?.dataset.repo || '', 'viewed', query);
        return; // do NOT preventDefault — let the link open
      }
      e.preventDefault();
      const card   = btn.closest('.rg-repo-card');
      const repo   = card?.dataset.repo || '';
      const action = btn.dataset.action;
      if (action === 'saved' || action === 'starred') {
        btn.classList.toggle('active');
        trackInteraction(repo, action, query);
      }
    });
  });

  // Remove the separate "viewed" listener — now handled above inside the <a> click
  document.querySelectorAll('.rg-repo-card').forEach(card => {
    // intentionally left empty — tracking is done in action-btn handler
  });
}

// ── Loading Placeholder ───────────────────────────────────────────────────────

function showLoadingPlaceholder(insertionPoint) {
  removeSidebar();
  const wrapper = document.createElement('div');
  wrapper.id = SIDEBAR_ID;
  wrapper.className = 'rg-sidebar';
  wrapper.innerHTML = `
    <div class="rg-header">
      <div class="rg-brand">
        <img src="${getIconUrl()}" alt="RG" class="rg-brand-icon" />
        <span class="rg-brand-title">RepoGenius AI</span>
        <span class="rg-badge-ai">Personalized</span>
      </div>
    </div>
    <div class="rg-loading">
      <div class="rg-spinner"></div>
      Ranking repositories for your profile…
    </div>`;
  insertionPoint.insertAdjacentElement('beforebegin', wrapper);
}

// ── Main Injection Logic ──────────────────────────────────────────────────────

async function injectSidebar() {
  const query = extractSearchQuery();
  if (!query || query.length < 2) return;

  // Only inject on github.com/search pages
  if (!window.location.pathname.startsWith('/search')) return;

  const profile = await getProfile();
  if (!profile) return; // User hasn't onboarded yet

  const insertionPoint = findInsertionPoint();
  if (!insertionPoint) return;

  showLoadingPlaceholder(insertionPoint);

  try {
    const res = await fetch(`${BACKEND_URL}/api/query/personalized`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        query,
        user_profile: profile,
        n_results: 15,
      }),
    });

    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    const data = await res.json();

    removeSidebar();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildSidebarHTML(data.recommendations || [], query, profile);
    const sidebar = wrapper.firstElementChild;

    const fresh = findInsertionPoint();
    if (fresh) {
      fresh.insertAdjacentElement('beforebegin', sidebar);
      attachSidebarListeners(query);
    }
  } catch (err) {
    removeSidebar();
    console.warn('[RepoGenius] Backend unavailable:', err.message);
    // Silently fail — don't disrupt GitHub UX
  }
}

// ── Page Navigation Detection (GitHub SPA) ───────────────────────────────────

let lastUrl = location.href;

function checkUrlChange() {
  const current = location.href;
  if (current !== lastUrl) {
    lastUrl = current;
    setTimeout(injectSidebar, 800); // Wait for GitHub DOM to settle
  }
}

// Observe DOM mutations for SPA navigation
const observer = new MutationObserver(checkUrlChange);
observer.observe(document.body, { childList: true, subtree: true });

// Listen for explicit page loaded messages from background service worker
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'RG_PAGE_LOADED') {
    setTimeout(injectSidebar, 600);
  }
});

// Initial injection on script load
setTimeout(injectSidebar, 1000);
