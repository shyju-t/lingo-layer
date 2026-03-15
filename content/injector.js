var LingoLayer = window.LingoLayer || {};

(function () {
  'use strict';

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function positionTooltip(bridge, tip) {
    const rect = bridge.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();

    let top = rect.top - tipRect.height - 8;
    let left = rect.left + (rect.width - tipRect.width) / 2;

    if (top < 4) top = rect.bottom + 8;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));

    tip.style.top = `${top + window.scrollY}px`;
    tip.style.left = `${left + window.scrollX}px`;
    tip.classList.add('ll-tooltip-visible');
  }

  function showTooltip(bridge) {
    if (bridge._llTip) return;

    const d = bridge.dataset;
    const tip = document.createElement('div');
    tip.className = 'll-tooltip';
    tip.innerHTML = `
      <div class="ll-tip-header">
        <span class="ll-tip-de">${esc(d.replacement)}</span>
        <span class="ll-tip-pron">${esc(d.pronunciation || '')}</span>
      </div>
      <div class="ll-tip-original">${esc(d.original)}</div>
      ${d.context ? `<div class="ll-tip-context">"${esc(d.context)}"</div>` : ''}
      <div class="ll-tip-grammar">
        ${d.gender && d.gender !== 'N/A' ? `<span class="ll-tag">${esc(d.gender)}</span>` : ''}
        ${d.case && d.case !== 'N/A' ? `<span class="ll-tag">${esc(d.case)}</span>` : ''}
      </div>
      ${d.reason ? `<div class="ll-tip-reason">${esc(d.reason)}</div>` : ''}
    `;

    document.body.appendChild(tip);
    bridge._llTip = tip;
    requestAnimationFrame(() => positionTooltip(bridge, tip));
  }

  function hideTooltip(bridge) {
    if (bridge._llTip) {
      bridge._llTip.remove();
      bridge._llTip = null;
    }
  }

  const SPEAKER_SVG = '<svg class="ll-speak-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';

  function createSpeakButton(replacement) {
    const btn = document.createElement('span');
    btn.className = 'll-speak-btn';
    btn.innerHTML = SPEAKER_SVG;
    btn.title = 'Pronounce';

    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      btn.classList.add('ll-speak-loading');

      try {
        const result = await chrome.storage.local.get('lingolayer_settings');
        const settings = result.lingolayer_settings || {};
        if (!settings.elevenlabsKey) {
          console.warn('[LingoLayer] No ElevenLabs API key set.');
          return;
        }
        await LingoLayer.speakPhrase(replacement, settings.language || 'German', settings.elevenlabsKey);
      } catch (err) {
        console.error('[LingoLayer] TTS error:', err);
      } finally {
        btn.classList.remove('ll-speak-loading');
      }
    });

    return btn;
  }

  function createBridgeElement(rep, voiceEnabled) {
    const bridge = document.createElement('span');
    bridge.className = 'de-bridge';
    bridge.setAttribute('tabindex', '0');
    bridge.setAttribute('role', 'button');
    bridge.setAttribute('aria-label',
      `${rep.replacement}. Original: ${rep.original}`);
    bridge.textContent = rep.replacement;
    bridge.dataset.original = rep.original;
    bridge.dataset.replacement = rep.replacement;
    bridge.dataset.pronunciation = rep.pronunciation || '';
    bridge.dataset.context = rep.context_phrase || '';
    bridge.dataset.gender = rep.grammar?.gender || '';
    bridge.dataset.case = rep.grammar?.case || '';
    bridge.dataset.reason = rep.grammar?.reason || '';

    if (voiceEnabled) {
      bridge.appendChild(createSpeakButton(rep.replacement));
    }

    bridge.addEventListener('mouseenter', () => showTooltip(bridge));
    bridge.addEventListener('mouseleave', () => hideTooltip(bridge));
    bridge.addEventListener('focus', () => showTooltip(bridge));
    bridge.addEventListener('blur', () => hideTooltip(bridge));
    return bridge;
  }

  /**
   * Collect all text nodes under a container.
   */
  function getTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  /**
   * Search-based replacement: find `original` text in the DOM text nodes
   * and wrap the match with a de-bridge element. Much more reliable than
   * character-offset based replacement.
   */
  function replaceInTextNodes(container, rep, voiceEnabled) {
    const needle = rep.original;
    const textNodes = getTextNodes(container);

    for (const tNode of textNodes) {
      if (tNode.parentElement?.classList?.contains('de-bridge')) continue;

      const idx = tNode.textContent.indexOf(needle);
      if (idx === -1) continue;

      const afterNeedle = tNode.splitText(idx + needle.length);
      const needleNode = tNode.splitText(idx);

      const bridge = createBridgeElement(rep, voiceEnabled);
      needleNode.parentNode.replaceChild(bridge, needleNode);

      return true;
    }
    return false;
  }

  /**
   * Apply replacements using text search (ignoring unreliable offsets).
   * Process in reverse order of appearance to avoid invalidating earlier matches.
   */
  LingoLayer.injectReplacements = function (container, replacements, voiceEnabled) {
    if (!replacements.length) return 0;

    let count = 0;

    const seen = new Set();
    const unique = replacements.filter(r => {
      if (seen.has(r.original)) return false;
      seen.add(r.original);
      return true;
    });

    unique.sort((a, b) => b.original.length - a.original.length);

    for (const rep of unique) {
      if (!rep.original || !rep.replacement) continue;
      const ok = replaceInTextNodes(container, rep, voiceEnabled);
      if (ok) {
        count++;
      } else {
        console.warn('[LingoLayer] Could not find text to replace:', rep.original);
      }
    }

    return count;
  };

  // Keep extractTextMap for any other use
  LingoLayer.extractTextMap = function (container) {
    const nodes = getTextNodes(container);
    return { text: nodes.map(n => n.textContent).join(''), nodes };
  };
})();

window.LingoLayer = LingoLayer;
