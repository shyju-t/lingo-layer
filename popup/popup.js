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

  const PROVIDER_MODELS = {
    featherless: [
      { value: 'Qwen/Qwen3-8B', label: 'Qwen 3 8B' },
      { value: 'Qwen/Qwen3-32B', label: 'Qwen 3 32B' },
      { value: 'Qwen/Qwen2.5-7B-Instruct', label: 'Qwen 2.5 7B Instruct' },
      { value: 'Qwen/Qwen2.5-32B-Instruct', label: 'Qwen 2.5 32B Instruct' },
      { value: 'meta-llama/Llama-3.1-8B-Instruct', label: 'Llama 3.1 8B' },
      { value: 'mistralai/Mistral-7B-Instruct-v0.2', label: 'Mistral 7B v0.2' }
    ],
    openai: [
      { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano (fastest)' },
      { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
      { value: 'gpt-4.1', label: 'GPT-4.1' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'o4-mini', label: 'o4-mini (reasoning)' },
      { value: 'o3-mini', label: 'o3-mini (reasoning)' }
    ],
    claude: [
      { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (fastest)' },
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
      { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' }
    ],
    gemini: [
      { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (fastest)' },
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' }
    ],
    local: []
  };

  const KEY_HINTS = {
    featherless: 'fl-...',
    openai: 'sk-...',
    claude: 'sk-ant-...',
    gemini: 'AIza...',
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

  function populateModelDropdown(provider, selectedModel) {
    const models = PROVIDER_MODELS[provider] || [];
    els.model.innerHTML = '';

    if (provider === 'local') {
      const opt = document.createElement('option');
      opt.value = selectedModel || '';
      opt.textContent = selectedModel || 'Enter model name';
      els.model.appendChild(opt);
      els.model.setAttribute('contenteditable', 'false');
      return;
    }

    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.value;
      opt.textContent = m.label;
      els.model.appendChild(opt);
    });

    if (selectedModel && !models.some(m => m.value === selectedModel)) {
      const custom = document.createElement('option');
      custom.value = selectedModel;
      custom.textContent = selectedModel;
      els.model.insertBefore(custom, els.model.firstChild);
    }

    if (selectedModel) {
      els.model.value = selectedModel;
    }
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
    els.endpointUrl.value = endpoints[provider] || '';
    els.apiKey.placeholder = KEY_HINTS[provider] || 'API key';
    els.endpointUrl.placeholder = ENDPOINT_HINTS[provider] || 'http://localhost:11434/v1/chat/completions';
    populateModelDropdown(provider, models[provider] || '');
    toggleEndpointField(provider);
  }

  async function loadSettings() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    currentSettings = { ...DEFAULTS, ...(result[STORAGE_KEY] || {}) };

    if (!currentSettings.providerKeys) currentSettings.providerKeys = {};
    if (!currentSettings.providerModels) currentSettings.providerModels = {};
    if (!currentSettings.providerEndpoints) currentSettings.providerEndpoints = {};

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
    const models = PROVIDER_MODELS[provider] || [];
    const model = els.model.value.trim() || (models[0]?.value) || '';
    const endpointUrl = els.endpointUrl.value.trim();

    if (provider !== 'local' && !apiKey) {
      showStatus('Please enter an API key.', 'error');
      return;
    }

    if (provider === 'local' && !endpointUrl) {
      showStatus('Please enter an endpoint URL.', 'error');
      return;
    }

    if (provider === 'local') {
      try {
        const granted = await chrome.permissions.request({
          origins: ['http://localhost/*', 'http://127.0.0.1/*']
        });
        if (!granted) {
          showStatus('Localhost permission required for local provider.', 'error');
          return;
        }
      } catch (_) {}
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

  const voiceToggleLabel = $('#voice-toggle-label');
  if (voiceToggleLabel) {
    voiceToggleLabel.addEventListener('click', (e) => e.stopPropagation());
  }

  els.form.addEventListener('submit', saveSettings);

  loadSettings();
})();
