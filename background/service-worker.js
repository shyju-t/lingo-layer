const STORAGE_KEY = 'lingolayer_settings';

const DEFAULTS = {
  provider: 'featherless',
  apiKey: '',
  model: 'Qwen/Qwen2.5-72B-Instruct',
  language: 'German',
  level: 'B1',
  activeSites: ['reddit'],
  enabled: true
};

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const existing = await chrome.storage.local.get(STORAGE_KEY);
    if (!existing[STORAGE_KEY]) {
      await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULTS });
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'lingolayer_count' && sender.tab) {
    const count = message.count;
    const text = count > 0 ? String(count) : '';
    chrome.action.setBadgeText({ tabId: sender.tab.id, text });
    chrome.action.setBadgeBackgroundColor({
      tabId: sender.tab.id,
      color: '#7c4dff'
    });
  }
});
