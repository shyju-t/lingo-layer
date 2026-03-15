var LingoLayer = window.LingoLayer || {};

LingoLayer.ts = function () {
  const d = new Date();
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
};

LingoLayer.SITE_SELECTORS = {
  reddit: {
    match: /reddit\.com/,
    contentSelectors: [
      // New Reddit (2025-2026) - shreddit web components
      'shreddit-post [slot="text-body"]',
      'shreddit-post .md',
      'shreddit-post .text-neutral-content',
      '[data-testid="post-container"] [slot="text-body"]',
      // Post detail page selectors
      '[data-testid="post-content"]',
      '[id^="post-rtjson-content"]',
      '[id^="t3_"] .md',
      // Generic fallbacks
      '.RichTextJSON-root',
      '[data-click-id="text"]',
      'div.md',
      // Comment-like areas on post pages
      '.Post .RichTextJSON-root',
      // Very broad fallback - paragraphs inside main content
      'main [slot="text-body"]',
      '[slot="text-body"]'
    ],
    minTextLength: 80
  }
};

LingoLayer.getSiteConfig = function () {
  const hostname = window.location.hostname;
  for (const [key, config] of Object.entries(LingoLayer.SITE_SELECTORS)) {
    if (config.match.test(hostname)) {
      return { id: key, ...config };
    }
  }
  return null;
};

/**
 * Recursively search through Shadow DOM roots to find matching elements.
 */
LingoLayer.queryShadowAll = function (root, selector) {
  const results = [];

  try {
    const found = root.querySelectorAll(selector);
    for (const el of found) results.push(el);
  } catch (_) {}

  const allEls = root.querySelectorAll('*');
  for (const el of allEls) {
    if (el.shadowRoot) {
      const shadowResults = LingoLayer.queryShadowAll(el.shadowRoot, selector);
      results.push(...shadowResults);
    }
  }

  return results;
};

LingoLayer.findContentElements = function (siteConfig) {
  if (!siteConfig) return [];

  const seen = new Set();
  const elements = [];

  for (const selector of siteConfig.contentSelectors) {
    try {
      // First try normal DOM
      const nodes = document.querySelectorAll(selector);
      for (const node of nodes) {
        if (seen.has(node) || node.hasAttribute('data-lingolayer')) continue;
        const text = node.innerText || node.textContent || '';
        if (text.trim().length < siteConfig.minTextLength) continue;
        seen.add(node);
        elements.push(node);
      }

      // Then try piercing shadow DOM
      const shadowNodes = LingoLayer.queryShadowAll(document, selector);
      for (const node of shadowNodes) {
        if (seen.has(node) || node.hasAttribute('data-lingolayer')) continue;
        const text = node.innerText || node.textContent || '';
        if (text.trim().length < siteConfig.minTextLength) continue;
        seen.add(node);
        elements.push(node);
      }
    } catch (_) {
      /* invalid selector, skip */
    }
  }

  console.log(`[LingoLayer] Found ${elements.length} content elements using ${siteConfig.contentSelectors.length} selectors`);

  // If nothing matched, try a heuristic: find large text blocks on the page
  if (elements.length === 0) {
    console.log('[LingoLayer] No selectors matched, trying heuristic fallback...');
    const candidates = document.querySelectorAll('p, article, [role="article"]');
    for (const node of candidates) {
      if (seen.has(node) || node.hasAttribute('data-lingolayer')) continue;
      const text = node.innerText || node.textContent || '';
      if (text.trim().length < siteConfig.minTextLength) continue;
      // Skip navigation, headers, sidebars
      if (node.closest('nav, header, aside, [role="navigation"], [role="banner"]')) continue;
      seen.add(node);
      elements.push(node);
    }
    console.log(`[LingoLayer] Heuristic found ${elements.length} elements`);
  }

  return elements;
};

window.LingoLayer = LingoLayer;
