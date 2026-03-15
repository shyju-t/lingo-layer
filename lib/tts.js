var LingoLayer = window.LingoLayer || {};

(function () {
  'use strict';

  const TTS_ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-speech';
  const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';
  const MODEL_ID = 'eleven_multilingual_v2';
  const OUTPUT_FORMAT = 'mp3_22050_32';

  const LANG_CODES = {
    German: 'de', Spanish: 'es', French: 'fr', Italian: 'it',
    Portuguese: 'pt', Dutch: 'nl', Japanese: 'ja', Korean: 'ko',
    'Mandarin Chinese': 'zh', Hindi: 'hi'
  };

  // In-memory cache: text -> audio blob URL
  const audioCache = new Map();

  // Currently playing audio
  let currentAudio = null;

  LingoLayer.speakPhrase = async function (text, language, apiKey) {
    if (!apiKey || !text) return;

    const cacheKey = `${language}:${text}`;

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }

    // Check cache first
    if (audioCache.has(cacheKey)) {
      const audio = new Audio(audioCache.get(cacheKey));
      currentAudio = audio;
      await audio.play();
      return;
    }

    const langCode = LANG_CODES[language] || 'de';
    const url = `${TTS_ENDPOINT}/${DEFAULT_VOICE_ID}?output_format=${OUTPUT_FORMAT}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        language_code: langCode
      })
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      throw new Error(`ElevenLabs error ${response.status}: ${err.slice(0, 150)}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    audioCache.set(cacheKey, blobUrl);

    const audio = new Audio(blobUrl);
    currentAudio = audio;
    await audio.play();
  };
})();

window.LingoLayer = LingoLayer;
