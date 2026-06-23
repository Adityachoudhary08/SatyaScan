// Multilingual prompt builder and enforcer
// Ensures Mistral AI outputs in the correct language

import { getFullLanguageName, createLanguageInstruction, normalizeLanguage } from "./languageUtils.js";

/**
 * Build a multilingual prompt with language enforcement
 * @param {string} baseSystemPrompt - Original system prompt (in English)
 * @param {string} targetLanguage - Target language code
 * @returns {string} Modified prompt with language enforcement
 */
export const buildMultilingualPrompt = (baseSystemPrompt, targetLanguage) => {
  const normalized = normalizeLanguage(targetLanguage);

  // If English, return base prompt as-is
  if (normalized === "en") {
    return baseSystemPrompt;
  }

  const fullName = getFullLanguageName(normalized);
  const languageInstruction = createLanguageInstruction(normalized);

  // Add language enforcement to system prompt
  return `${baseSystemPrompt}

────────────────────────────────────────────

${languageInstruction}

All JSON fields must contain output in ${fullName}.
Do NOT translate the JSON keys themselves, only the values.

────────────────────────────────────────────`;
};

/**
 * Build extraction prompts in target language
 * @param {string} language - Target language code
 * @returns {string} Prompt in target language
 */
export const buildExtractClaimsPrompt = (language) => {
  const normalized = normalizeLanguage(language);
  const fullName = getFullLanguageName(normalized);
  const instruction = createLanguageInstruction(normalized);

  const basePrompt = `You extract factual claims from articles for fact-checking.
Identify 1 to 7 distinct, specific, checkable factual claims. If the input is a single checkable factual sentence, return it as one claim.
Each must be a standalone statement verifiable against external sources.
Do NOT include opinions, predictions, questions, commands, or vague statements.
Respond ONLY with a valid JSON array, no other text:
[{ "claim": "..." }]`;

  if (normalized === "en") {
    return basePrompt;
  }

  return `${basePrompt}

${instruction}
All claims must be in ${fullName}.

Example output format (with ${fullName} claims):
[{ "claim": "claim in ${fullName}" }, { "claim": "another claim in ${fullName}" }]`;
};

/**
 * Build verdict prompt in target language
 * @param {string} language - Target language code
 * @returns {string} Prompt for fact-checking verdict
 */
export const buildVerdictPrompt = (language) => {
  const normalized = normalizeLanguage(language);
  const fullName = getFullLanguageName(normalized);
  const instruction = createLanguageInstruction(normalized);

  const basePrompt = `You are a fact-checking assistant with access to the supplied sources below. Use them as your primary evidence.

VERDICT RULES — apply in this order:

────────────────────────────────────────────
"Supported"
────────────────────────────────────────────
A supplied source directly and clearly confirms that the claim is true.

────────────────────────────────────────────
"Contradicted"
────────────────────────────────────────────
Use "Contradicted" when EITHER condition is met using supplied sources:

  1. DIRECT contradiction:
     A source explicitly states the opposite of the claim.
     Example: Claim = "India won the 2022 FIFA World Cup"
              Source: "Argentina won the 2022 FIFA World Cup" → Contradicted

  2. LOGICAL contradiction:
     A source provides authoritative facts that make the claim factually impossible,
     even if it does not use the exact same words.
     Example: Claim = "The Moon is made of cheese."
              Source: "The Moon is composed primarily of silicate rock and metal." → Contradicted

  Key test: Could a reasonable person conclude from the source's facts alone
  that the claim is false? If yes, use Contradicted.

────────────────────────────────────────────
"Unverified"
────────────────────────────────────────────
Use ONLY when supplied sources have no meaningful bearing on the claim:
  - No sources supplied
  - Sources discuss a related but different topic and cannot confirm or deny the claim
  - Sources are too vague or general to draw any conclusion

────────────────────────────────────────────
CONFIDENCE SCORING (integer 0-100):
────────────────────────────────────────────
Supported:
  - Multiple trusted sources support → 90-100
  - One trusted source supports → 75-89
  - Only lower-credibility sources support → 55-74

Contradicted:
  - Multiple trusted sources contradict → 90-100
  - One trusted source contradicts → 75-89
  - Only lower-credibility sources contradict → 55-74

Unverified:
  - No sources supplied at all → 0-20
  - Sources exist but weak/unrelated → 20-50

Keep reasoning to 1-3 sentences. State which source led to your verdict.
Respond ONLY with valid JSON, no other text:
{ "verdict": "Supported" | "Contradicted" | "Unverified", "confidence": 80, "reasoning": "..." }`;

  if (normalized === "en") {
    return basePrompt;
  }

  return `${basePrompt}

${instruction}

The "verdict" field must be in ${fullName}:
- Use the ${fullName} word for "Supported" verdict
- Use the ${fullName} word for "Contradicted" verdict  
- Use the ${fullName} word for "Unverified" verdict

The "reasoning" field must be entirely in ${fullName}, 1-3 sentences max.`;
};

/**
 * Build AI detection prompt in target language
 * @param {string} language - Target language code
 * @returns {string} Prompt for AI content detection
 */
export const buildAIDetectionPrompt = (language) => {
  const normalized = normalizeLanguage(language);
  const fullName = getFullLanguageName(normalized);
  const instruction = createLanguageInstruction(normalized);

  const basePrompt = `Analyze text for patterns associated with AI-generated writing.
Look for: repetitiveness, generic/vague language, uniform sentence structure, formulaic transitions, lack of personal voice.
Note: this is a heuristic estimate, not definitive.
Respond ONLY with valid JSON, no other text:
{ "aiLikelihood": 75, "reasoning": "short plain-English explanation" }
aiLikelihood must be an integer 0-100. 0 = very likely human, 100 = very likely AI.`;

  if (normalized === "en") {
    return basePrompt;
  }

  return `${basePrompt}

${instruction}

The "reasoning" field must be in ${fullName}, written in 1-2 sentences.`;
};

/**
 * Build language detection prompt (always English, but helper for consistency)
 * @returns {string} Language detection prompt
 */
export const buildLanguageDetectionPrompt = () => {
  return `Detect the language of the text and translate to English if needed.
Rules:
- Detect the ISO 639-1 language code (e.g. "en", "hi", "es").
- If already English, set translatedText to the original text unchanged.
- If not English, provide an accurate English translation.
- Supported languages: en, hi, pa, bn, ta, te, mr, gu, ur
- For unknown languages, best-effort translation to English.
Respond ONLY with valid JSON, no other text:
{ "language": "hi", "translatedText": "..." }`;
};

/**
 * Extract JSON from text that may contain markdown code blocks
 * @param {string} text - Text potentially containing JSON
 * @param {string} context - Context for error messages
 * @returns {Object} Parsed JSON object
 */
export const extractAndParseJSON = (text, context) => {
  let cleaned = text.trim();

  // Remove markdown code blocks if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/, "");
  }

  try {
    return JSON.parse(cleaned.trim());
  } catch (e) {
    throw new Error(
      `Failed to parse ${context} response as JSON: ${e.message}\nReceived: ${cleaned.substring(0, 100)}`
    );
  }
};

export default {
  buildMultilingualPrompt,
  buildExtractClaimsPrompt,
  buildVerdictPrompt,
  buildAIDetectionPrompt,
  buildLanguageDetectionPrompt,
  extractAndParseJSON,
};
