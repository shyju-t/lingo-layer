(function () {
  'use strict';

  const STORAGE_KEY = 'lingolayer_settings';

  const DEFAULTS = {
    provider: 'featherless',
    apiKey: '',
    model: '',
    language: 'German',
    level: 'B1',
    activeSites: ['reddit'],
    enabled: true,
    providerKeys: {},
    providerModels: {},
    providerEndpoints: {},
    endpointUrl: ''
  };

  const MODEL_HINTS = {
    featherless: 'Qwen/Qwen2.5-7B-Instruct',
    openai: 'gpt-4o-mini',
    claude: 'claude-sonnet-4-20250514',
    local: 'llama3.2'
  };

  const KEY_HINTS = {
    featherless: 'fl-...',
    openai: 'sk-...',
    claude: 'sk-ant-...',
    local: 'optional – leave blank if none'
  };

  const ENDPOINT_HINTS = {
    local: 'http://localhost:11434/v1/chat/completions'
  };

  const $ = (sel) => document.querySelector(sel);

  let currentSettings = null;

  const els = {
    form: $('#settings-form'),
    provider: $('#provider'),
    apiKey: $('#api-key'),
    toggleKey: $('#toggle-key'),
    model: $('#model'),
    endpointField: $('#endpoint-field'),
    endpointUrl: $('#endpoint-url'),
    language: $('#language'),
    level: $('#level'),
    activeSite: $('#active-site'),
    elevenlabsKey: $('#elevenlabs-key'),
    voiceEnabled: $('#voice-enabled'),
    enabled: $('#enabled'),
    status: $('#status')
  };

  function showStatus(msg, type) {
    els.status.textContent = msg;
    els.status.className = `status ${type}`;
    setTimeout(() => {
      els.status.className = 'status hidden';
    }, 2500);
  }

  function toggleEndpointField(provider) {
    els.endpointField.style.display = provider === 'local' ? '' : 'none';
  }

  function stashCurrentProvider() {
    if (!currentSettings) return;
    const prev = currentSettings.provider;
    const key = els.apiKey.value.trim();
    const model = els.model.value.trim();
    const endpoint = els.endpointUrl.value.trim();
    if (!currentSettings.providerKeys) currentSettings.providerKeys = {};
    if (!currentSettings.providerModels) currentSettings.providerModels = {};
    if (!currentSettings.providerEndpoints) currentSettings.providerEndpoints = {};
    if (key) currentSettings.providerKeys[prev] = key;
    if (model) currentSettings.providerModels[prev] = model;
    if (endpoint) currentSettings.providerEndpoints[prev] = endpoint;
  }

  function loadProviderFields(provider) {
    const keys = currentSettings?.providerKeys || {};
    const models = currentSettings?.providerModels || {};
    const endpoints = currentSettings?.providerEndpoints || {};
    els.apiKey.value = keys[provider] || '';
    els.model.value = models[provider] || '';
    els.endpointUrl.value = endpoints[provider] || '';
    els.model.placeholder = MODEL_HINTS[provider] || 'model name';
    els.apiKey.placeholder = KEY_HINTS[provider] || 'API key';
    els.endpointUrl.placeholder = ENDPOINT_HINTS[provider] || 'http://localhost:11434/v1/chat/completions';
    toggleEndpointField(provider);
  }

  async function loadSettings() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    currentSettings = { ...DEFAULTS, ...(result[STORAGE_KEY] || {}) };

    if (!currentSettings.providerKeys) currentSettings.providerKeys = {};
    if (!currentSettings.providerModels) currentSettings.providerModels = {};
    if (!currentSettings.providerEndpoints) currentSettings.providerEndpoints = {};

    // Migrate old single-key format
    if (currentSettings.apiKey && !currentSettings.providerKeys[currentSettings.provider]) {
      currentSettings.providerKeys[currentSettings.provider] = currentSettings.apiKey;
    }
    if (currentSettings.model && !currentSettings.providerModels[currentSettings.provider]) {
      currentSettings.providerModels[currentSettings.provider] = currentSettings.model;
    }
    if (currentSettings.endpointUrl && !currentSettings.providerEndpoints[currentSettings.provider]) {
      currentSettings.providerEndpoints[currentSettings.provider] = currentSettings.endpointUrl;
    }

    els.provider.value = currentSettings.provider;
    els.language.value = currentSettings.language;
    els.level.value = currentSettings.level;
    els.elevenlabsKey.value = currentSettings.elevenlabsKey || '';
    els.voiceEnabled.checked = currentSettings.voiceEnabled || false;
    els.enabled.checked = currentSettings.enabled;

    if (currentSettings.activeSites?.length) {
      els.activeSite.value = currentSettings.activeSites[0];
    }

    loadProviderFields(currentSettings.provider);
  }

  async function saveSettings(e) {
    e.preventDefault();

    const provider = els.provider.value;
    const apiKey = els.apiKey.value.trim();
    const model = els.model.value.trim() || MODEL_HINTS[provider] || '';
    const endpointUrl = els.endpointUrl.value.trim();

    if (provider !== 'local' && !apiKey) {
      showStatus('Please enter an API key.', 'error');
      return;
    }

    if (provider === 'local' && !endpointUrl) {
      showStatus('Please enter an endpoint URL.', 'error');
      return;
    }

    const providerKeys = { ...(currentSettings?.providerKeys || {}) };
    const providerModels = { ...(currentSettings?.providerModels || {}) };
    const providerEndpoints = { ...(currentSettings?.providerEndpoints || {}) };
    if (apiKey) providerKeys[provider] = apiKey;
    providerModels[provider] = model;
    if (endpointUrl) providerEndpoints[provider] = endpointUrl;

    const settings = {
      provider,
      apiKey,
      model,
      endpointUrl,
      language: els.language.value,
      level: els.level.value,
      activeSites: [els.activeSite.value],
      elevenlabsKey: els.elevenlabsKey.value.trim(),
      voiceEnabled: els.voiceEnabled.checked,
      enabled: els.enabled.checked,
      providerKeys,
      providerModels,
      providerEndpoints
    };

    currentSettings = settings;
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
    showStatus('Settings saved!', 'success');
  }

  els.provider.addEventListener('change', () => {
    stashCurrentProvider();
    const newProvider = els.provider.value;
    if (currentSettings) currentSettings.provider = newProvider;
    loadProviderFields(newProvider);
  });

  els.toggleKey.addEventListener('click', () => {
    const input = els.apiKey;
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  els.form.addEventListener('submit', saveSettings);

  loadSettings();
})();
