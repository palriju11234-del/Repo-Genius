/**
 * RepoGenius Chrome Extension — Service Worker (background.js)
 *
 * Responsibilities:
 *  - Open popup on first install for onboarding
 *  - Listen for tab URL changes on GitHub to notify content scripts
 *  - Handle cross-context messaging
 */

const BACKEND_URL = 'http://127.0.0.1:8000';

// ── Install Event ─────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Mark as first run so popup shows onboarding wizard
    await chrome.storage.local.set({ rg_first_run: true, rg_profile: null });
    console.log('[RepoGenius] Extension installed — opening onboarding');

    // Open popup by creating a window (we can't programmatically open popup)
    // Instead, open a new tab pointing to the popup HTML
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') + '?onboarding=true' });
  }
});

// ── Tab Update Listener ───────────────────────────────────────────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url || !tab.url.includes('github.com/search')) return;

  // Notify content script that the page has loaded (handles SPA navigation)
  chrome.tabs.sendMessage(tabId, {
    type: 'RG_PAGE_LOADED',
    url: tab.url,
  }).catch(() => {
    // Content script not yet injected — this is expected on first load
  });
});

// ── Message Handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RG_GET_PROFILE') {
    chrome.storage.local.get(['rg_profile', 'rg_first_run', 'rg_interactions']).then((data) => {
      sendResponse({ profile: data.rg_profile, firstRun: data.rg_first_run, interactions: data.rg_interactions || [] });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'RG_SAVE_PROFILE') {
    chrome.storage.local.set({ rg_profile: message.profile, rg_first_run: false }).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === 'RG_TRACK_INTERACTION') {
    // Save interaction locally
    chrome.storage.local.get(['rg_interactions']).then((data) => {
      const interactions = data.rg_interactions || [];
      interactions.unshift({
        repo: message.repo,
        action: message.action,
        query: message.query,
        timestamp: Date.now(),
      });
      // Keep only last 100 interactions
      const trimmed = interactions.slice(0, 100);
      chrome.storage.local.set({ rg_interactions: trimmed });

      // Also POST to backend (fire and forget)
      fetch(`${BACKEND_URL}/api/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: message.repo, action: message.action, query: message.query }),
      }).catch(() => { /* backend may be offline, that's ok */ });
    });
    sendResponse({ ok: true });
    return true;
  }
});
