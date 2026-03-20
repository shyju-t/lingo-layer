# Privacy Policy for LingoLayer

**Last updated:** March 20, 2026

## Overview

LingoLayer is a browser extension that helps users learn languages by injecting contextual translations into web pages. This privacy policy explains what data LingoLayer accesses and how it is handled.

## Data Collection

LingoLayer does **not** collect, store, or transmit any personal data to any server owned or operated by the developer. There is no backend, no analytics, no tracking, and no cookies.

## Data Stored Locally

The following data is stored **locally on your device** using Chrome's `chrome.storage.local` API:

- **User preferences:** Selected language, CEFR level, active site, voice toggle, and chosen provider/model.
- **API keys:** Any API keys you enter (for Featherless.ai, OpenAI, Anthropic, Google Gemini, or ElevenLabs) are stored locally in your browser and are never transmitted to any third party other than the respective API provider you configured.

This data never leaves your browser and is not accessible to the developer or any third party.

## Network Requests

LingoLayer makes network requests **only** to the API provider you have selected and configured:

| Provider | Endpoint |
|---|---|
| Featherless.ai | `https://api.featherless.ai/` |
| OpenAI | `https://api.openai.com/` |
| Claude (Anthropic) | `https://api.anthropic.com/` |
| Gemini (Google) | `https://generativelanguage.googleapis.com/` |
| ElevenLabs (voice) | `https://api.elevenlabs.io/` |
| Local / Custom | Your self-hosted server (e.g. `http://localhost`) |

These requests are made directly from your browser to the chosen provider. The extension sends page text content to the selected AI provider for translation processing. No data is routed through any intermediary server.

## Web Page Content

LingoLayer reads text content from web pages you visit on supported sites (currently Reddit) to identify phrases suitable for translation. This text is:

- Processed locally in your browser to extract relevant content
- Sent directly to your chosen AI provider for translation
- Never stored, logged, or transmitted to the developer

## Third-Party Services

When you provide an API key for a third-party service (OpenAI, Anthropic, Google, Featherless.ai, or ElevenLabs), your use of that service is governed by that provider's own privacy policy and terms of service. LingoLayer has no control over how these providers handle data.

## Permissions Justification

- **`storage`**: Required to save your preferences and API keys locally.
- **`activeTab`**: Required to read and modify page content for phrase injection.
- **`host_permissions`**: Required to make API calls to the configured AI and TTS providers, and to access supported websites (Reddit) for content script injection.

## Children's Privacy

LingoLayer does not knowingly collect any data from children under 13.

## Changes to This Policy

If this privacy policy is updated, the changes will be reflected in this document with an updated date.

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/shyju-t/lingo-layer).
