var LingoLayer = window.LingoLayer || {};

const LANGUAGE_TIPS = {
  German: 'Articles MUST match gender AND grammatical case (Nominative, Accusative, Dative, Genitive). Prepositions govern specific cases (e.g. "zu" + Dative, "in" + Dative for location, "in" + Accusative for direction).',
  Spanish: 'Gendered nouns must match articles (el/la/los/las). Use correct verb conjugation for person/tense. Distinguish ser vs. estar. Use subjunctive where appropriate.',
  French: 'Gendered nouns must match articles (le/la/les/un/une). Apply liaison and elision rules. Use correct verb conjugation and tense agreement. Use partitive articles (du/de la/des).',
  Italian: 'Gendered nouns must match articles (il/lo/la/i/gli/le). Conjugate verbs correctly. Combine prepositions with articles (al, del, nel). Watch double consonants.',
  Portuguese: 'Gendered nouns must match articles (o/a/os/as). Conjugate verbs including personal infinitive. Distinguish ser vs. estar. Apply contractions (no, na, do, da).',
  Dutch: 'Use correct de/het articles. Apply V2 verb placement in main clauses, verb-final in subclauses. Handle separable verbs correctly.',
  Japanese: 'Use appropriate politeness level. Apply correct particles (は, が, を, に, で, へ). Match verb endings to formality.',
  Korean: 'Use appropriate politeness level. Apply correct particles (은/는, 이/가, 을/를). Match verb conjugation endings to formality.',
  'Mandarin Chinese': 'Use correct measure words (classifiers). Mark tones in pinyin. Apply grammar particles (了, 的, 吗) correctly.',
  Hindi: 'Match gendered nouns with correct verb agreement. Use correct postpositions (में, पर, से, को). Conjugate verbs matching gender and number.'
};

const FEW_SHOT_EXAMPLES = {
  German: `
EXAMPLE:
Input: "I walked to the store to buy some bread."
Output:
{
  "meta": { "language": "German", "level": "B1", "topic": "Shopping" },
  "replacements": [
    {
      "range": [13, 22], "original": "the store",
      "replacement": "dem Laden", "context_phrase": "zu dem Laden",
      "grammar": { "gender": "Masculine", "case": "Dative", "reason": "Dative required after preposition 'zu'." },
      "pronunciation": "dehm LAH-den"
    },
    {
      "range": [30, 40], "original": "some bread",
      "replacement": "etwas Brot", "context_phrase": "kaufen etwas Brot",
      "grammar": { "gender": "Neuter", "case": "Accusative", "reason": "Direct object of 'kaufen'." },
      "pronunciation": "ET-vahs broht"
    }
  ]
}`,
  Spanish: `
EXAMPLE:
Input: "She goes to the library every morning."
Output:
{
  "meta": { "language": "Spanish", "level": "B1", "topic": "Daily routine" },
  "replacements": [
    {
      "range": [4, 8], "original": "goes",
      "replacement": "va", "context_phrase": "Ella va a",
      "grammar": { "gender": "N/A", "case": "N/A", "reason": "3rd person singular present of 'ir'." },
      "pronunciation": "bah"
    },
    {
      "range": [16, 23], "original": "library",
      "replacement": "biblioteca", "context_phrase": "a la biblioteca",
      "grammar": { "gender": "Feminine", "case": "N/A", "reason": "Feminine noun, uses article 'la'." },
      "pronunciation": "bee-blee-oh-TEH-kah"
    }
  ]
}`,
  French: `
EXAMPLE:
Input: "We ate at the restaurant with our friends."
Output:
{
  "meta": { "language": "French", "level": "B1", "topic": "Dining" },
  "replacements": [
    {
      "range": [10, 24], "original": "the restaurant",
      "replacement": "le restaurant", "context_phrase": "au restaurant",
      "grammar": { "gender": "Masculine", "case": "N/A", "reason": "Masculine noun; 'at the' contracts to 'au'." },
      "pronunciation": "luh reh-stoh-RAHN"
    },
    {
      "range": [34, 41], "original": "friends",
      "replacement": "amis", "context_phrase": "avec nos amis",
      "grammar": { "gender": "Masculine", "case": "N/A", "reason": "Masculine plural; 'nos' for 'our'." },
      "pronunciation": "ah-MEE"
    }
  ]
}`
};

LingoLayer.buildSystemPrompt = function (level, language) {
  language = language || 'German';
  const langTips = LANGUAGE_TIPS[language] || `Ensure all ${language} replacements are grammatically correct in context.`;
  const example = FEW_SHOT_EXAMPLES[language] || FEW_SHOT_EXAMPLES.German;

  const levelGuide = level === 'A1' ? 'basic nouns, greetings, colors, numbers, simple present-tense verbs'
    : level === 'A2' ? 'common verbs, everyday phrases, simple sentences, basic adjectives'
    : level === 'B1' ? 'compound phrases, opinions, connectors (because, although, however), conversational idioms'
    : 'idiomatic expressions, subjunctive/conditional forms, nuanced vocabulary, complex connectors';

  return `You are the ${language} LingoLayer Engine. Transform English text into a "Sandwich Learning" experience by replacing 3-8 English segments with ${language} translations perfectly integrated into the sentence.

LEVEL (${level}): Focus on ${levelGuide}.

LINGUISTIC RULES:
1. GRAMMAR: ${langTips}
2. CONJUGATION: If you translate a verb, conjugate it correctly for the English subject (e.g. "He eats" → 3rd person singular).
3. "original" must be the EXACT English substring selected for replacement.
4. "context_phrase" must show how the ${language} word reads within the surrounding English.
5. "pronunciation" must be a simple phonetic guide for English speakers.
6. Do NOT select overlapping text segments.
${example}

OUTPUT: Return ONLY a raw JSON object. No markdown, no backticks, no commentary.
{
  "meta": { "language": "${language}", "level": "${level}", "topic": "string" },
  "replacements": [
    {
      "range": [0, 0],
      "original": "string",
      "replacement": "string",
      "context_phrase": "string",
      "grammar": { "gender": "string", "case": "string", "reason": "string" },
      "pronunciation": "string"
    }
  ]
}`;
};

LingoLayer.buildUserMessage = function (text) {
  return `INPUT TEXT: """${text}"""

Analyze the text above. Select 3-8 English phrases appropriate for the learner level, translate them, and return the JSON replacements.`;
};

window.LingoLayer = LingoLayer;
