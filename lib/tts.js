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

  const BCP47 = {
    German: 'de-DE', Spanish: 'es-ES', French: 'fr-FR', Italian: 'it-IT',
    Portuguese: 'pt-BR', Dutch: 'nl-NL', Japanese: 'ja-JP', Korean: 'ko-KR',
    'Mandarin Chinese': 'zh-CN', Hindi: 'hi-IN'
  };

  const audioCache = new Map();
  let currentAudio = null;

  let voiceCache = [];
  function loadVoices() {
    voiceCache = window.speechSynthesis?.getVoices() || [];
  }
  loadVoices();
  if (window.speechSynthesis) {
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
  }

  function pickBestVoice(langTag) {
    const prefix = langTag.split('-')[0];
    const candidates = voiceCache.filter(
      v => v.lang === langTag || v.lang.startsWith(prefix)
    );
    const google = candidates.find(v => v.name.includes('Google'));
    if (google) return google;
    const cloud = candidates.find(v => !v.localService);
    if (cloud) return cloud;
    return candidates[0] || null;
  }

  function speakPhraseBrowser(text, language) {
    if (!text || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const tag = BCP47[language] || 'de-DE';
    utterance.lang = tag;
    utterance.rate = 0.82;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voice = pickBestVoice(tag);
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  }

  LingoLayer.speakPhrase = async function (text, language, apiKey) {
    if (!text) return;

    if (!apiKey) {
      speakPhraseBrowser(text, language);
      return;
    }

    const cacheKey = `${language}:${text}`;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }

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
