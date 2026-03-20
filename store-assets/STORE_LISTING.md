# Chrome Web Store Listing Content

Copy-paste the sections below into the Chrome Web Store Developer Dashboard when publishing.

---

## Name

LingoLayer

## Summary (132 chars max)

Learn German, Spanish, French and 7 more languages while browsing. AI-powered contextual translation with grammar tooltips and voice.

## Category

Education

## Language

English

## Detailed Description

LingoLayer: Contextual Immersion — Doomscroll your way to fluency.

LingoLayer is a Chrome extension that helps you learn languages by injecting grammatically correct translations directly into the web pages you already read. No separate apps, no flashcards — just natural immersion while you browse.

HOW IT WORKS

LingoLayer reads the text on supported pages (currently Reddit), sends it to an AI provider of your choice, and replaces select English phrases with translations in your target language. Each replaced phrase includes a hover tooltip showing the original English, grammar details (gender, case, conjugation), and a phonetic pronunciation guide.

FEATURES

• 10 Languages: German, Spanish, French, Italian, Portuguese, Dutch, Japanese, Korean, Mandarin Chinese, and Hindi — each with grammar-aware prompts and few-shot examples.

• 5 AI Providers: Choose from Featherless.ai, OpenAI, Claude (Anthropic), Gemini (Google), or connect your own local server (Ollama, LM Studio, vLLM, llama.cpp).

• Model Selector: Each provider offers a curated dropdown of models sorted by speed. Pick the right balance of speed and quality for your needs.

• CEFR Levels: Select your proficiency level from A1 (Beginner) to B2 (Upper Intermediate). The AI adapts phrase difficulty to match your level.

• Voice Pronunciation: Click the speaker icon on any translated phrase to hear it spoken aloud. Uses ElevenLabs for premium voices, or the browser's built-in speech synthesis for free — no API key needed.

• Grammar Tooltips: Hover over any translated phrase to see the original English, grammatical gender, case, conjugation reason, and context.

• Bring Your Own Key (BYOK): Your API keys are stored locally in your browser and are never sent to any server except the provider you choose. No backend, no data collection.

• Per-Provider Memory: Switch between providers without losing your API keys, model selections, or endpoint URLs.

• Collapsible Settings: The popup UI groups settings into clean, collapsible sections — Learning, Provider, and Voice.

PRIVACY

LingoLayer does not collect, store, or transmit any personal data. API keys are stored locally on your device. All API calls go directly from your browser to your chosen provider. No analytics, no tracking, no cookies.

SUPPORTED PROVIDERS AND MODELS

Featherless.ai: Qwen 3 8B/32B, Qwen 2.5 7B/32B, Llama 3.1 8B, Mistral 7B
OpenAI: GPT-4.1 Nano/Mini/Full, GPT-4o Mini/Full, o4-mini, o3-mini
Claude (Anthropic): Haiku 4.5, Sonnet 4.6, Sonnet 4, Opus 4.6
Gemini (Google): 2.5 Flash Lite, 2.5 Flash, 2.5 Pro, 2.0 Flash
Local/Custom: Any OpenAI-compatible server on localhost

GETTING STARTED

1. Install LingoLayer from the Chrome Web Store.
2. Click the extension icon and select your target language and CEFR level.
3. Expand the Provider section, pick a provider, select a model, and enter your API key.
4. Optionally enable Voice and enter an ElevenLabs API key (or leave blank for free browser voices).
5. Save settings and navigate to a Reddit post — translations appear automatically.

Built for the AI-Hackathon.space 2026.

---

## Privacy Practices Questionnaire Answers

**Does your extension collect user data?**
No.

**Does your extension use remote code?**
No. All logic is self-contained in the extension package.

**What permissions does your extension use and why?**
- `storage`: To save user preferences and API keys locally.
- `activeTab`: To read and modify page content for phrase injection on supported sites.
- `host_permissions` (API providers): To make API calls to the AI and voice providers the user has configured.
- `host_permissions` (Reddit): To inject content scripts on supported sites.
- `optional_host_permissions` (localhost): To enable connection to locally hosted AI servers when the user selects the Local/Custom provider.

**Does your extension handle personal or sensitive user data?**
The extension stores user-provided API keys locally using chrome.storage.local. These keys are only sent to the respective API provider the user has configured. No personal data is collected, transmitted to the developer, or shared with third parties.

**Privacy policy URL:**
https://github.com/shyju-t/lingo-layer/blob/main/PRIVACY.md
