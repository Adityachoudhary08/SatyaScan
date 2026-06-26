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

  const basePrompt = `You are a fact verification engine. You MUST analyze ONLY the evidence provided in the user message.
NEVER invent facts. NEVER fabricate sources. NEVER use knowledge outside the supplied evidence.

VERDICT RULES — apply strictly:

TRUE — Multiple trusted sources confirm the claim.
FALSE — Trusted sources directly contradict the claim.
MISLEADING — Claim contains partial truth but omits important context.
PARTIALLY_TRUE — Some parts of the claim are confirmed, others are not or are contradicted.
UNVERIFIED — Insufficient evidence to determine truth. Use when evidence is weak, unrelated, or absent.

If evidence is insufficient, verdict MUST be UNVERIFIED. Never guess.

CONFIDENCE (integer 0-100):
- Multiple trusted sources align → 85-100
- One trusted source aligns → 70-84
- Weaker or mixed sources → 40-69
- UNVERIFIED → 0-30

For each source you cite, set supportsClaim: true if it supports the claim, false if it contradicts.

Respond ONLY with valid JSON:
{
  "verdict": "TRUE" | "FALSE" | "MISLEADING" | "PARTIALLY_TRUE" | "UNVERIFIED",
  "confidence": 80,
  "summary": "one-sentence verdict summary",
  "reasoning": "2-4 sentences citing specific evidence by title/publisher",
  "sources": [{ "title": "...", "url": "...", "publisher": "...", "publishedAt": "...", "supportsClaim": true }],
  "supportingSources": [],
  "contradictingSources": []
}

The "verdict" field MUST be exactly one of: TRUE, FALSE, MISLEADING, PARTIALLY_TRUE, UNVERIFIED (English enum only).`;

  if (normalized === "en") {
    return `${basePrompt}

The "summary" and "reasoning" fields MUST be in English only.`;
  }

  return `${basePrompt}

${instruction}

The "summary" and "reasoning" fields MUST be entirely in ${fullName}. Do NOT use English in those fields.`;
};

export const buildImageForensicsPrompt = (language) => {
  const normalized = normalizeLanguage(language);
  const fullName = getFullLanguageName(normalized);
  const instruction = createLanguageInstruction(normalized);

  const basePrompt = `You are a forensic image authenticity analyst. Perform comprehensive visual forensics ONLY on the provided image.

You will also receive structured EXIF metadata findings from a separate metadata analyzer. Use them together with visual analysis.

ANALYZE:

Visual forensics:
- Lighting consistency, shadow consistency, reflection consistency
- Object geometry, human anatomy, facial symmetry
- Finger/hand anomalies, teeth/eye/hair/skin texture issues
- Background distortions, object warping

AI generation detection:
- Texture artifacts, diffusion model patterns, synthetic noise
- Over-smoothed surfaces, unrealistic details, generative artifacts

Deepfake detection:
- Face replacement, facial blending, skin boundary issues
- Eye/mouth region anomalies

Manipulation detection:
- Copy-move tampering, object insertion/removal, splicing, clone artifacts

RULES:
- Return REAL probabilities 0-100 based on observed evidence. NEVER default to 50.
- If you cannot assess a signal, use a low value (0-15) with explanation — never guess 50.
- Verdict MUST be one of: AUTHENTIC, LIKELY_AUTHENTIC, AI_GENERATED, LIKELY_AI_GENERATED, DEEPFAKE, MANIPULATED, INCONCLUSIVE
- reasoning must be an array of specific bullet-point findings (not generic statements)

Respond ONLY with valid JSON:
{
  "verdict": "LIKELY_AI_GENERATED",
  "confidence": 87,
  "aiGeneratedProbability": 82,
  "deepfakeProbability": 12,
  "manipulationProbability": 18,
  "lightingConsistency": "consistent" | "inconsistent" | "unclear",
  "shadowConsistency": "consistent" | "inconsistent" | "unclear",
  "reflectionConsistency": "consistent" | "inconsistent" | "unclear",
  "anatomyIssues": ["extra fingers on left hand"],
  "visualInconsistencies": ["inconsistent reflections in window"],
  "aiArtifacts": ["diffusion-like skin smoothing"],
  "deepfakeIndicators": [],
  "manipulationIndicators": [],
  "reasoning": ["Metadata stripped", "Unrealistic finger structure", "Diffusion-like texture artifacts"],
  "explanation": "2-4 sentence summary of the overall assessment"
}`;

  if (normalized === "en") {
    return `${basePrompt}

All text fields (reasoning items, explanation, indicator arrays) MUST be in English only.`;
  }

  return `${basePrompt}

${instruction}

All text fields (reasoning items, explanation, indicator arrays) MUST be in ${fullName} only.`;
};

/** @deprecated use buildImageForensicsPrompt */
export const buildImageAnalysisPrompt = buildImageForensicsPrompt;

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
  buildImageForensicsPrompt,
  buildImageAnalysisPrompt,
  buildAIDetectionPrompt,
  buildLanguageDetectionPrompt,
  extractAndParseJSON,
};
