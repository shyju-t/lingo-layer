# LingoLayer: Contextual Immersion

> **"Stop ignoring your Duolingo owl. Start doomscrolling your way to fluency."**

Built in 3 hours for the [AI-Hackathon.space](https://ai-hackathon.space/) 2026.

---

## The Vision

Traditional language extensions are broken -- especially for German. Static word replacement ignores the complex grammar of German cases (Nominative vs. Dative). **LingoLayer** is a "Logic-at-the-Edge" extension that performs **Context-Aware Semantic Injection** entirely within your browser.

No backend. No data harvesting. Just raw AI-powered learning delivered where you already read.

## Features

- **Client-Side Intelligence:** Everything runs locally in the extension. Your API keys and reading habits never leave your machine.
- **BYOK (Bring Your Own Key):** Use your own API credentials from **Featherless.ai**, **OpenAI**, **Claude (Anthropic)**, or point to a **local/self-hosted LLM** (Ollama, LM Studio, vLLM, llama.cpp -- anything OpenAI-compatible).
- **10 Target Languages:** German, Spanish, French, Italian, Portuguese, Dutch, Japanese, Korean, Mandarin Chinese, and Hindi -- with grammar-aware prompts tailored to each language.
- **Grammar-Perfect Injection:** The engine analyzes the full sentence context to ensure replacements are grammatically correct (e.g., German articles matching case, Spanish ser/estar, Japanese particles).
- **Few-Shot Prompted:** The LLM receives concrete translation examples for each language, ensuring consistent and accurate output.
- **Voice Pronunciation:** Optional ElevenLabs integration lets you hear any replaced phrase spoken aloud. Click the speaker icon on any phrase -- audio is cached so repeated plays cost nothing.
- **Flexible Activation Targets:** Use the **"Active On"** dropdown to choose where the extension should trigger.
  - *Current MVP Support:* **Reddit** (targeted at post body content).
- **CEFR Level Selector:** Choose between **A1 (Beginner)** to **B2 (Upper Intermediate)**. The AI selectively identifies phrases that challenge you without overwhelming you.
- **Collapsible Settings UI:** The popup groups settings into collapsible sections (Learning, LLM Provider, Voice) so you can focus on what matters.
- **Per-Provider Credential Memory:** Switching between LLM providers preserves your API keys, models, and endpoints -- nothing is lost.

## Setup & Configuration

1. **Install:** Load the extension as unpacked in Chrome (see below).
2. **Learning:** Pick your target language and CEFR level -- this section is open by default.
3. **LLM Provider:** Expand the provider section and choose one:
   - **Featherless.ai** (default) -- enter your API key. Default model: `Qwen/Qwen2.5-7B-Instruct`.
   - **OpenAI** -- enter your API key. Default model: `gpt-4o-mini`.
   - **Claude (Anthropic)** -- enter your API key. Default model: `claude-sonnet-4-20250514`.
   - **Local / Custom** -- enter your endpoint URL (e.g. `http://localhost:11434/v1/chat/completions` for Ollama). API key is optional. Enter the model name your server expects.
4. **Voice (optional):** Expand the Voice section, enter an ElevenLabs API key, and toggle "Voice Pronunciation" on to hear phrases spoken aloud.
5. **Save** and refresh your page to start learning.

## Installation

1. Clone this repo:
   ```bash
   git clone https://github.com/AISorcererShyju/lingo-layer.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer Mode** (top right toggle).
4. Click **Load unpacked** and select the `lingo-layer` project folder.
5. Set up your provider and API key in the extension popup to begin.

## Using a Local LLM

LingoLayer works with any locally hosted model that exposes an OpenAI-compatible `/v1/chat/completions` endpoint.

| Server | Endpoint URL |
|---|---|
| Ollama | `http://localhost:11434/v1/chat/completions` |
| LM Studio | `http://localhost:1234/v1/chat/completions` |
| vLLM | `http://localhost:8000/v1/chat/completions` |
| llama.cpp | `http://localhost:8080/v1/chat/completions` |

Select **Local / Custom** as the provider, paste the endpoint URL, enter the model name your server expects, and save. No API key is required for most local setups.

## Tech Stack

- **Manifest V3** Chrome Extension
- **Vanilla JavaScript** (ES6+) -- zero dependencies
- **CSS3 Glassmorphism** for a modern, transparent UI
- **Multi-Provider LLM Support** -- Featherless.ai, OpenAI, Claude (Anthropic), and Local/Custom
- **ElevenLabs TTS** -- optional voice pronunciation with in-memory caching
- **Few-Shot Prompt Engineering** -- language-specific examples for accurate grammar

## How It Works

1. Content script detects the main post body on supported sites using a Selector Registry.
2. The full post text is sent to the LLM with a strict JSON-mode system prompt containing few-shot examples and grammar rules specific to the selected language.
3. LLM returns replacements with the original English phrase, translation, grammar metadata, and pronunciation guide.
4. The injection engine performs text-search-based DOM replacement (no fragile character offsets).
5. Replaced phrases are styled inline with hover tooltips showing the original text, grammar case/gender, and pronunciation.
6. If voice is enabled, a speaker icon appears on hover -- click to hear the phrase via ElevenLabs TTS.

## Architecture

```
popup (settings UI -- collapsible groups)
  |
  +--> chrome.storage.local (per-provider credential memory)
         |
         +--> content script
                |
                +--> Selector Registry (find post body)
                +--> LLM Client (Featherless / OpenAI / Claude / Local)
                +--> Injector (text-search DOM replacement)
                +--> de-bridge spans (hover tooltips)
                +--> TTS Client (ElevenLabs, on-click, cached)
```

## Project Structure

```
lingo-layer/
├── manifest.json              # Manifest V3 config
├── popup/
│   ├── popup.html             # Collapsible settings groups
│   ├── popup.js               # Per-provider settings read/write
│   └── popup.css              # Glassmorphism dark UI
├── content/
│   ├── content.js             # Page orchestrator (single LLM call per page)
│   ├── injector.js            # Text-search DOM replacement + speaker buttons
│   └── content.css            # Tooltip, shimmer, toast, speaker styles
├── background/
│   └── service-worker.js      # Install defaults, badge count
├── lib/
│   ├── selectors.js           # Reddit selector registry + shadow DOM piercing
│   ├── prompt.js              # Few-shot system prompts per language
│   ├── llm-client.js          # Multi-provider API client with timing logs
│   └── tts.js                 # ElevenLabs TTS with blob caching
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── .gitignore
└── README.md
```

---

*Built with coffee and 2026-era LLMs.*
