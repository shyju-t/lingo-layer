var LingoLayer = window.LingoLayer || {};

(function () {
  'use strict';

  const STORAGE_KEY = 'lingolayer_settings';
  const ts = () => LingoLayer.ts();
  const LOG = (...args) => console.log(`[LingoLayer ${ts()}]`, ...args);
  const WARN = (...args) => console.warn(`[LingoLayer ${ts()}]`, ...args);
  const ERR = (...args) => console.error(`[LingoLayer ${ts()}]`, ...args);

  let settings = null;
  let processed = false;

  LOG('Content script loaded on', window.location.href);

  // ── Toast notification ──────────────────────────────────

  function showToast(message, type = 'success') {
    const existing = document.querySelector('.ll-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `ll-toast ll-toast-${type}`;
    toast.innerHTML = `
      <span class="ll-toast-icon">${type === 'success' ? '\u2713' : '!'}</span>
      <span>${escapeHtml(message)}</span>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('ll-toast-visible'));
    setTimeout(() => {
      toast.classList.remove('ll-toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Counter badge ───────────────────────────────────────

  function showCounter(count) {
    let el = document.querySelector('.ll-counter');
    if (!el) {
      el = document.createElement('div');
      el.className = 'll-counter';
      el.innerHTML = `
        <span class="ll-counter-logo">LL</span>
        <span><span class="ll-counter-num">0</span> German phrases</span>
      `;
      document.body.appendChild(el);
    }
    el.querySelector('.ll-counter-num').textContent = count;
  }

  // ── Find the main post content element ─────────────────

  function findPostBody() {
    const selectors = [
      'shreddit-post [slot="text-body"]',
      '[data-testid="post-container"] [slot="text-body"]',
      '[data-click-id="text"]',
      '.Post .RichTextJSON-root',
      'div.md',
      '[slot="text-body"]'
    ];

    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el) {
          const text = (el.innerText || el.textContent || '').trim();
          if (text.length >= 60) {
            LOG('Found post body via selector:', sel, '(' + text.length + ' chars)');
            return el;
          }
        }
      } catch (_) {}
    }

    // Fallback: find the largest <p> or <article> in the main area
    const candidates = [...document.querySelectorAll('p, article, [role="article"]')];
    candidates.sort((a, b) => (b.innerText?.length || 0) - (a.innerText?.length || 0));
    for (const el of candidates) {
      if (el.closest('nav, header, aside')) continue;
      const text = (el.innerText || '').trim();
      if (text.length >= 60) {
        LOG('Found post body via heuristic fallback (' + text.length + ' chars)');
        return el;
      }
    }

    return null;
  }

  // ── Main processing: one call per page ─────────────────

  async function processPage() {
    if (processed) return;
    if (!settings?.enabled || !settings?.apiKey) {
      LOG('Extension disabled or no API key.');
      return;
    }

    const siteConfig = LingoLayer.getSiteConfig();
    if (!siteConfig || !settings.activeSites?.includes(siteConfig.id)) {
      LOG('Site not active:', window.location.hostname);
      return;
    }

    const postBody = findPostBody();
    if (!postBody) {
      LOG('No post body found on this page.');
      return;
    }

    if (postBody.hasAttribute('data-lingolayer')) return;

    processed = true;
    postBody.setAttribute('data-lingolayer', 'loading');

    const text = (postBody.innerText || postBody.textContent || '').trim();
    LOG('Processing post body:', text.length, 'chars');

    try {
      const result = await LingoLayer.callLLM(text, settings);
      LOG('LLM returned', result.replacements.length, 'replacements');

      const voiceOn = !!settings.voiceEnabled;
      const count = LingoLayer.injectReplacements(postBody, result.replacements, voiceOn);
      LOG('Successfully injected', count, 'replacements');

      postBody.setAttribute('data-lingolayer', 'done');

      if (count > 0) {
        showCounter(count);
        showToast(`Injected ${count} German phrases!`, 'success');
        chrome.runtime.sendMessage({
          type: 'lingolayer_count',
          count
        }).catch(() => {});
      } else {
        WARN('No replacements could be injected (offset mismatches).');
        postBody.setAttribute('data-lingolayer', 'error');
      }

    } catch (err) {
      ERR('Processing error:', err);
      postBody.setAttribute('data-lingolayer', 'error');
      showToast(err.message || 'Failed to process text', 'error');
      processed = false; // allow retry
    }
  }

  // ── Wait for post content to appear (SPA) ──────────────

  function waitForPostAndProcess() {
    const body = findPostBody();
    if (body && !body.hasAttribute('data-lingolayer')) {
      processPage();
      return;
    }

    // Reddit is an SPA; the post body might not be in the DOM yet.
    // Watch for it to appear, but stop after 15 seconds.
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (attempts > 30) {
        clearInterval(interval);
        LOG('Gave up waiting for post body after 15s.');
        return;
      }
      const el = findPostBody();
      if (el && !el.hasAttribute('data-lingolayer')) {
        clearInterval(interval);
        processPage();
      }
    }, 500);
  }

  // ── Handle SPA navigation (URL changes) ────────────────

  let lastUrl = location.href;

  function onNavigation() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      processed = false;
      LOG('SPA navigation detected:', lastUrl);
      waitForPostAndProcess();
    }
  }

  // Poll for URL changes (pushState doesn't fire events content scripts can hear)
  setInterval(onNavigation, 1000);

  // ── Initialization ────────────────────────────────────

  async function init() {
    LOG('Initializing...');
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      settings = result[STORAGE_KEY];
      LOG('Settings:', settings ? {
        provider: settings.provider,
        model: settings.model,
        level: settings.level,
        enabled: settings.enabled,
        hasKey: !!settings.apiKey,
        activeSites: settings.activeSites
      } : '(none)');

      if (!settings?.apiKey) {
        LOG('No API key. Open the LingoLayer popup to configure.');
        return;
      }

      waitForPostAndProcess();

    } catch (err) {
      ERR('Init error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  chrome.storage.onChanged.addListener((changes) => {
    if (changes[STORAGE_KEY]) {
      settings = changes[STORAGE_KEY].newValue;
      LOG('Settings updated.');
      if (settings?.enabled && settings?.apiKey && !processed) {
        waitForPostAndProcess();
      }
    }
  });
})();
