/**
 * RepoGenius Chrome Extension — Popup Logic (popup.js)
 *
 * Handles:
 *  - Onboarding wizard (4 steps, multi-select + single-select)
 *  - Profile persistence via chrome.storage.local
 *  - Profile view rendering
 *  - Quick search with personalized results
 *  - Interaction stats display
 */

const BACKEND_URL = 'http://127.0.0.1:8000';

// ── State ─────────────────────────────────────────────────────────────────────
let currentStep = 1;
const TOTAL_STEPS = 4;
let currentInteractions = [];

const profile = {
  experience: null,
  goal: null,
  language: 'Python',
  languages: [],
  complexity: null,
  project_types: [],
};

// ── DOM References ────────────────────────────────────────────────────────────
const screens = {
  loading:  document.getElementById('loading-screen'),
  onboard:  document.getElementById('onboarding'),
  profile:  document.getElementById('profile-view'),
};

const stepPanels   = document.querySelectorAll('.step-panel');
const stepDots     = document.querySelectorAll('.step-indicator');
const stepLines    = document.querySelectorAll('.step-line');
const stepLabel    = document.getElementById('step-label');
const btnNext      = document.getElementById('btn-next');
const btnBack      = document.getElementById('btn-back');
const btnEdit      = document.getElementById('btn-edit-profile');
const quickQuery   = document.getElementById('quick-query');
const btnSearch    = document.getElementById('btn-quick-search');
const quickResults = document.getElementById('quick-results');

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  showScreen('loading');

  const { rg_profile, rg_first_run } = await chrome.storage.local.get(['rg_profile', 'rg_first_run']);

  if (!rg_profile || rg_first_run) {
    showScreen('onboard');
    setupOnboarding();
  } else {
    Object.assign(profile, rg_profile);
    showScreen('profile');
    renderProfileView();
  }
});

// ── Screen Management ─────────────────────────────────────────────────────────
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[name].classList.remove('hidden');
}

// ── Onboarding Setup ──────────────────────────────────────────────────────────
function setupOnboarding() {
  goToStep(1);

  // Attach click handlers to all option buttons
  document.querySelectorAll('.opt-btn').forEach(btn => {
    btn.addEventListener('click', () => handleOptionClick(btn));
  });

  btnNext.addEventListener('click', handleNext);
  btnBack.addEventListener('click', handleBack);
}

function handleOptionClick(btn) {
  const field = btn.dataset.field;
  const val   = btn.dataset.val;
  const isMulti = btn.classList.contains('multi');

  if (isMulti) {
    // Toggle multi-select
    const arr = profile[field];
    const idx = arr.indexOf(val);
    if (idx === -1) {
      arr.push(val);
      btn.classList.add('selected');
    } else {
      arr.splice(idx, 1);
      btn.classList.remove('selected');
    }
    // Keep primary language in sync
    if (field === 'languages' && arr.length > 0) {
      profile.language = arr[0];
    }
  } else {
    // Single select — deselect siblings in same field
    document.querySelectorAll(`.opt-btn[data-field="${field}"]`).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    profile[field] = val;
  }

  validateStep();
}

function validateStep() {
  let valid = false;
  switch (currentStep) {
    case 1: valid = !!profile.experience; break;
    case 2: valid = !!profile.goal; break;
    case 3: valid = profile.languages.length > 0; break;
    case 4: valid = !!profile.complexity; break;
  }
  btnNext.disabled = !valid;
}

function handleNext() {
  if (currentStep < TOTAL_STEPS) {
    goToStep(currentStep + 1);
  } else {
    finishOnboarding();
  }
}

function handleBack() {
  if (currentStep > 1) goToStep(currentStep - 1);
}

function goToStep(step) {
  currentStep = step;

  // Update panels
  stepPanels.forEach((p, i) => {
    p.classList.toggle('active', i + 1 === step);
  });

  // Update step dots
  stepDots.forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i + 1 < step)  dot.classList.add('done');
    if (i + 1 === step) dot.classList.add('active');
  });

  // Update connector lines
  stepLines.forEach((line, i) => {
    line.classList.toggle('done', i + 1 < step);
  });

  stepLabel.textContent = `Step ${step} of ${TOTAL_STEPS}`;
  btnBack.classList.toggle('hidden', step === 1);
  btnNext.textContent = step === TOTAL_STEPS ? '🚀 Get Started' : 'Next →';

  validateStep();
}

async function finishOnboarding() {
  await chrome.storage.local.set({ rg_profile: profile, rg_first_run: false });
  showScreen('profile');
  renderProfileView();
}

// ── Profile View ──────────────────────────────────────────────────────────────
function renderProfileView() {
  const expLabel = {
    beginner:     '🌱 Beginner',
    intermediate: '⚡ Intermediate',
    advanced:     '🔥 Advanced',
    professional: '🏆 Professional',
  }[profile.experience] || profile.experience;

  document.getElementById('profile-exp-badge').textContent = expLabel;
  document.getElementById('profile-lang-badge').textContent = `${profile.language || 'Any'}`;

  const goalLabel = {
    learning: 'Learning',
    building: 'Building Projects',
    hackathons: 'Hackathons',
    open_source: 'Open Source',
    production: 'Production Dev',
    research: 'Research',
  }[profile.goal] || profile.goal;

  document.getElementById('pd-goal').textContent = goalLabel || '—';
  document.getElementById('pd-complexity').textContent =
    { simple: 'Simple', moderate: 'Moderate', advanced: 'Advanced' }[profile.complexity] || '—';
  document.getElementById('pd-types').textContent =
    profile.project_types.length > 0 ? profile.project_types.slice(0, 3).join(', ') : '—';

  // Load interaction stats and collections list
  chrome.storage.local.get(['rg_interactions']).then(({ rg_interactions = [] }) => {
    currentInteractions = rg_interactions;
    updateStatsCounts();

    // Default to 'saved' collections, or fallback to 'starred' or 'viewed'
    const hasSaved = currentInteractions.some(i => i.action === 'saved');
    const hasStarred = currentInteractions.some(i => i.action === 'starred');
    const defaultAction = hasSaved ? 'saved' : (hasStarred ? 'starred' : 'viewed');
    renderCollections(defaultAction);

    // Bind tab clicks to the stat items
    document.getElementById('stat-item-views').addEventListener('click', () => renderCollections('viewed'));
    document.getElementById('stat-item-saved').addEventListener('click', () => renderCollections('saved'));
    document.getElementById('stat-item-starred').addEventListener('click', () => renderCollections('starred'));
  });

  // Edit profile
  btnEdit.addEventListener('click', () => {
    showScreen('onboard');
    setupOnboarding();
    // Pre-select already saved values
    restoreSelections();
  });

  // Quick search
  btnSearch.addEventListener('click', doQuickSearch);
  quickQuery.addEventListener('keydown', e => { if (e.key === 'Enter') doQuickSearch(); });
}

function restoreSelections() {
  // Restore single-select
  ['experience', 'goal', 'complexity'].forEach(field => {
    const val = profile[field];
    if (val) {
      const btn = document.querySelector(`.opt-btn[data-field="${field}"][data-val="${val}"]`);
      if (btn) btn.classList.add('selected');
    }
  });

  // Restore multi-select
  ['languages', 'project_types'].forEach(field => {
    const vals = profile[field] || [];
    vals.forEach(val => {
      const btn = document.querySelector(`.opt-btn[data-field="${field}"][data-val="${val}"]`);
      if (btn) btn.classList.add('selected');
    });
  });
}

// ── Quick Search ──────────────────────────────────────────────────────────────
async function doQuickSearch() {
  const query = quickQuery.value.trim();
  if (!query) return;

  btnSearch.disabled = true;
  btnSearch.textContent = '…';
  quickResults.innerHTML = '<p style="color:#8b949e;font-size:12px;padding:8px">Searching…</p>';
  quickResults.classList.remove('hidden');

  try {
    const res = await fetch(`${BACKEND_URL}/api/query/personalized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        user_profile: profile,
        n_results: 10,
      }),
    });

    if (!res.ok) throw new Error('Backend unavailable');
    const data = await res.json();
    renderQuickResults(data.recommendations || [], query);
  } catch {
    quickResults.innerHTML = `
      <p style="color:#8b949e;font-size:12px;padding:8px">
        ⚠️ Backend unavailable. Start the RepoGenius server at localhost:8000.
      </p>`;
  } finally {
    btnSearch.disabled = false;
    btnSearch.textContent = '→';
  }
}

function renderQuickResults(repos, query) {
  if (!repos.length) {
    quickResults.innerHTML = '<p style="color:#8b949e;font-size:12px;padding:8px">No results found.</p>';
    return;
  }

  quickResults.innerHTML = repos.slice(0, 5).map((repo, idx) => {
    const reason = repo.explanation_reasons?.[0] || '';
    const starsStr = repo.stars >= 1000
      ? `${(repo.stars / 1000).toFixed(1)}k`
      : `${repo.stars}`;

    return `
      <a class="quick-result-card"
         href="${repo.url || `https://github.com/${repo.full_name}`}"
         target="_blank"
         data-repo="${repo.full_name}"
         data-query="${encodeURIComponent(query)}"
      >
        <div class="qrc-header">
          <span class="qrc-name">${repo.full_name}</span>
          <span class="qrc-rank">#${idx + 1}</span>
        </div>
        <div class="qrc-desc">${repo.description || 'No description'}</div>
        <div class="qrc-meta">
          <span class="qrc-stars">${starsStr}</span>
          <span class="qrc-lang">${repo.language || 'Unknown'}</span>
        </div>
        ${reason ? `<div class="qrc-reason">${reason}</div>` : ''}
      </a>`;
  }).join('');

  // Track clicks
  quickResults.querySelectorAll('.quick-result-card').forEach(card => {
    card.addEventListener('click', () => {
      const repoName  = card.dataset.repo;
      const repoQuery = decodeURIComponent(card.dataset.query || '');
      chrome.runtime.sendMessage({
        type: 'RG_TRACK_INTERACTION',
        repo: repoName,
        action: 'viewed',
        query: repoQuery,
      });
    });
  });
}

// ── Collections rendering & management ────────────────────────────────────────

function renderCollections(actionFilter) {
  // Update active state in stat boxes
  ['views', 'saved', 'starred'].forEach(act => {
    const item = document.getElementById(`stat-item-${act}`);
    if (item) {
      item.classList.toggle('active', act === (actionFilter === 'viewed' ? 'views' : actionFilter));
    }
  });

  const titleEl = document.getElementById('collections-title');
  if (titleEl) {
    const label = {
      saved: '🔖 Saved Repositories',
      starred: '⭐ Starred Repositories',
      viewed: '👁️ Recently Viewed'
    }[actionFilter] || 'Repositories';
    titleEl.textContent = label;
  }

  const itemsContainer = document.getElementById('collections-items');
  if (!itemsContainer) return;

  // Deduplicate interactions for the selected action by repository full_name (keep most recent)
  const filtered = currentInteractions.filter(i => i.action === actionFilter);
  const unique = [];
  const seen = new Set();
  for (const item of filtered) {
    if (!seen.has(item.repo)) {
      seen.add(item.repo);
      unique.push(item);
    }
  }

  if (unique.length === 0) {
    const emptyMsg = {
      saved: 'No saved repositories yet. Click "🔖 Save" on search results to bookmark them.',
      starred: 'No starred repositories yet. Click "⭐ Star" on search results to add them to your stars.',
      viewed: 'No viewed repositories yet. Click "🔍 View Repo" on search results to start exploring.'
    }[actionFilter] || 'No items found.';

    itemsContainer.innerHTML = `<p style="color:#8b949e;font-size:11px;padding:8px 4px;line-height:1.4">${emptyMsg}</p>`;
    return;
  }

  itemsContainer.innerHTML = unique.map(item => {
    const date = new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `
      <div class="collection-card-wrapper" style="position:relative; display:block; width: 100%;">
        <a class="collection-card" href="https://github.com/${item.repo}" target="_blank">
          <div class="collection-info">
            <span class="collection-name">${item.repo}</span>
            <span class="collection-meta">${item.query ? `from search: "${item.query}"` : `Interacted on ${date}`}</span>
          </div>
          <button class="collection-action-btn" data-repo="${item.repo}" data-action="${actionFilter}" title="Remove">✕</button>
        </a>
      </div>`;
  }).join('');

  // Attach click listeners to the remove buttons
  itemsContainer.querySelectorAll('.collection-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const repo = btn.dataset.repo;
      const action = btn.dataset.action;
      removeCollectionItem(repo, action);
    });
  });
}

async function removeCollectionItem(repo, action) {
  // Remove all entries for this repo and action
  currentInteractions = currentInteractions.filter(i => !(i.repo === repo && i.action === action));
  await chrome.storage.local.set({ rg_interactions: currentInteractions });

  // Update counts
  updateStatsCounts();

  // Re-render
  renderCollections(action);
}

function updateStatsCounts() {
  const views   = currentInteractions.filter(i => i.action === 'viewed').length;
  const saved   = currentInteractions.filter(i => i.action === 'saved').length;
  const starred = currentInteractions.filter(i => i.action === 'starred').length;
  document.getElementById('stat-views').textContent   = views;
  document.getElementById('stat-saved').textContent   = saved;
  document.getElementById('stat-starred').textContent = starred;
}
