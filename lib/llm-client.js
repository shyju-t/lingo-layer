var LingoLayer = window.LingoLayer || {};

const PROVIDER_ENDPOINTS = {
  featherless: 'https://api.featherless.ai/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models'
};

const DEFAULT_MODELS = {
  featherless: 'Qwen/Qwen3-8B',
  openai: 'gpt-4.1-nano',
  claude: 'claude-haiku-4-5-20251001',
  gemini: 'gemini-2.5-flash-lite',
  local: 'llama3.2'
};

// ── Claude-specific request/response handling ─────────────

function buildClaudeRequest(systemPrompt, userMessage, settings) {
  return {
    url: PROVIDER_ENDPOINTS.claude,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: {
      model: settings.model || DEFAULT_MODELS.claude,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3
    }
  };
}

function parseClaudeResponse(data) {
  const content = data.content?.[0]?.text;
  const usage = data.usage || {};
  return {
    content,
    model: data.model,
    usage: {
      prompt_tokens: usage.input_tokens,
      completion_tokens: usage.output_tokens,
      total_tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0)
    },
    finishReason: data.stop_reason
  };
}

// ── Gemini-specific request/response handling ─────────────

function buildGeminiRequest(systemPrompt, userMessage, settings) {
  const model = settings.model || DEFAULT_MODELS.gemini;
  const url = `${PROVIDER_ENDPOINTS.gemini}/${model}:generateContent?key=${settings.apiKey}`;
  return {
    url,
    headers: { 'Content-Type': 'application/json' },
    body: {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json'
      }
    }
  };
}

function parseGeminiResponse(data) {
  const candidate = data.candidates?.[0];
  const content = candidate?.content?.parts?.[0]?.text;
  const usage = data.usageMetadata || {};
  return {
    content,
    model: data.modelVersion || 'gemini',
    usage: {
      prompt_tokens: usage.promptTokenCount,
      completion_tokens: usage.candidatesTokenCount,
      total_tokens: usage.totalTokenCount
    },
    finishReason: candidate?.finishReason
  };
}

// ── OpenAI-compatible request/response handling ───────────

function buildOpenAIRequest(systemPrompt, userMessage, settings) {
  const isLocal = settings.provider === 'local';
  const endpoint = isLocal
    ? (settings.endpointUrl || 'http://localhost:11434/v1/chat/completions')
    : (PROVIDER_ENDPOINTS[settings.provider] || PROVIDER_ENDPOINTS.featherless);

  const headers = { 'Content-Type': 'application/json' };
  if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }
  if (!isLocal) {
    headers['HTTP-Referer'] = 'https://github.com/lingolayer';
    headers['X-Title'] = 'LingoLayer';
  }

  const body = {
    model: settings.model || DEFAULT_MODELS[settings.provider] || DEFAULT_MODELS.featherless,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.3,
    max_tokens: 1024
  };

  if (!isLocal) {
    body.response_format = { type: 'json_object' };
  }

  return { url: endpoint, headers, body };
}

function parseOpenAIResponse(data) {
  const usage = data.usage || {};
  return {
    content: data.choices?.[0]?.message?.content,
    model: data.model,
    usage: {
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens
    },
    finishReason: data.choices?.[0]?.finish_reason
  };
}

// ── Main LLM call ─────────────────────────────────────────

LingoLayer.callLLM = async function (text, settings, retries = 1) {
  const LOG = (...args) => console.log(`[LingoLayer:LLM ${LingoLayer.ts()}]`, ...args);

  const systemPrompt = LingoLayer.buildSystemPrompt(settings.level, settings.language);
  const userMessage = LingoLayer.buildUserMessage(text);

  const provider = settings.provider;
  let req;
  if (provider === 'claude') {
    req = buildClaudeRequest(systemPrompt, userMessage, settings);
  } else if (provider === 'gemini') {
    req = buildGeminiRequest(systemPrompt, userMessage, settings);
  } else {
    req = buildOpenAIRequest(systemPrompt, userMessage, settings);
  }

  LOG('Request:', {
    provider,
    endpoint: req.url.replace(/key=[^&]+/, 'key=***'),
    model: req.body.model || settings.model || DEFAULT_MODELS[provider],
    inputChars: text.length
  });

  const t0 = performance.now();

  const response = await fetch(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify(req.body)
  });

  const tHeaders = performance.now();

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
    LOG(`Error response in ${elapsed}s:`, response.status);
    throw new Error(`LLM API error ${response.status}: ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();

  const tDone = performance.now();
  const headersMs = (tHeaders - t0).toFixed(0);
  const bodyMs = (tDone - tHeaders).toFixed(0);
  const totalSec = ((tDone - t0) / 1000).toFixed(2);

  let parsed;
  if (provider === 'claude') {
    parsed = parseClaudeResponse(data);
  } else if (provider === 'gemini') {
    parsed = parseGeminiResponse(data);
  } else {
    parsed = parseOpenAIResponse(data);
  }

  LOG(`Response in ${totalSec}s (TTFB: ${headersMs}ms, body: ${bodyMs}ms)`, {
    status: response.status,
    model: parsed.model,
    promptTokens: parsed.usage.prompt_tokens,
    completionTokens: parsed.usage.completion_tokens,
    totalTokens: parsed.usage.total_tokens,
    finishReason: parsed.finishReason
  });

  if (!parsed.content) {
    throw new Error('Empty response from LLM');
  }

  try {
    const result = LingoLayer.parseResponse(parsed.content);
    LOG('Parsed', result.replacements.length, 'replacements. Topic:', result.meta?.topic);
    return result;
  } catch (parseErr) {
    if (retries > 0) {
      console.warn(`[LingoLayer:LLM ${LingoLayer.ts()}] Parse failed, retrying...`, parseErr.message);
      return LingoLayer.callLLM(text, settings, retries - 1);
    }
    throw parseErr;
  }
};

LingoLayer.parseResponse = function (raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  const parsed = JSON.parse(cleaned);

  if (!parsed.replacements || !Array.isArray(parsed.replacements)) {
    throw new Error('Invalid response: missing replacements array');
  }

  const valid = parsed.replacements.filter(r => {
    return (
      Array.isArray(r.range) &&
      r.range.length === 2 &&
      typeof r.range[0] === 'number' &&
      typeof r.range[1] === 'number' &&
      r.range[0] < r.range[1] &&
      typeof r.original === 'string' &&
      typeof r.replacement === 'string'
    );
  });

  valid.sort((a, b) => a.range[0] - b.range[0]);

  const filtered = [];
  let lastEnd = -1;
  for (const r of valid) {
    if (r.range[0] >= lastEnd) {
      filtered.push(r);
      lastEnd = r.range[1];
    }
  }

  return {
    meta: parsed.meta || { language: 'German', level: 'B1', topic: '' },
    replacements: filtered
  };
};

window.LingoLayer = LingoLayer;
