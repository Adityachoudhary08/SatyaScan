import { Mistral } from "@mistralai/mistralai";
import { getFallback } from "./fallbacks.js";
import {
  buildExtractClaimsPrompt,
  buildLanguageDetectionPrompt,
} from "./multilingual.js";
import { normalizeLanguage } from "./languageUtils.js";

// Model to use — mistral-small-latest is fast, capable, and on the free tier
const MODEL_NAME = "mistral-small-latest";

// Returns the Mistral API key.
// Set MISTRAL_API_KEY in .env — get a free key at https://console.mistral.ai/api-keys/
const getApiKey = () => {
  const key = process.env.MISTRAL_API_KEY;
  if (key) {
    console.log("[genai] Using MISTRAL_API_KEY");
    return key;
  }
  return null;
};

// ── Core Mistral caller with retry ────────────────────────────────────────────

const callMistral = async (systemPrompt, userContent, functionName) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      "No Mistral API key found. Set MISTRAL_API_KEY in .env.\n" +
      "Get a free key from: https://console.mistral.ai/api-keys/"
    );
  }

  const client = new Mistral({ apiKey });
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await client.chat.complete({
        model: MODEL_NAME,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      });

      const text = response.choices?.[0]?.message?.content;
      if (!text) throw new Error("Mistral returned empty response");
      return text;
    } catch (err) {
      lastError = err;
      console.error(
        `[${new Date().toISOString()}] ${functionName} attempt ${attempt}/3 failed: ${err.message}`
      );
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }

  throw lastError;
};

// ── JSON helpers ──────────────────────────────────────────────────────────────

const stripFences = (text) => {
  let s = text.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "");
  }
  return s.trim();
};

const parseJson = (text, ctx) => {
  try {
    return JSON.parse(stripFences(text));
  } catch (e) {
    throw new Error(`Failed to parse ${ctx} response as JSON: ${e.message}`);
  }
};

// ── Exported functions ────────────────────────────────────────────────────────

export const extractClaims = async (text, responseLanguage = "en") => {
  if (!text?.trim()) throw new Error("Text is required");

  const language = normalizeLanguage(responseLanguage);
  const system = buildExtractClaimsPrompt(language);

  try {
    const raw = await callMistral(system, text, "extractClaims");
    const parsed = parseJson(raw, "claim extraction");
    if (!Array.isArray(parsed)) throw new Error("Must be JSON array");
    for (const item of parsed) {
      if (!item?.claim || typeof item.claim !== "string")
        throw new Error('Each item must have a "claim" string field');
    }
    return parsed;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] extractClaims failed: ${err.message}`);
    return getFallback("extractClaims");
  }
};

export const detectAndTranslate = async (text) => {
  if (!text?.trim()) throw new Error("Text is required");

  const system = buildLanguageDetectionPrompt();

  try {
    const raw = await callMistral(system, text, "detectAndTranslate");
    const parsed = parseJson(raw, "language detection");
    if (!parsed?.language || !parsed?.translatedText)
      throw new Error("Missing language or translatedText");
    return { language: parsed.language.toLowerCase(), translatedText: parsed.translatedText };
  } catch (err) {
    console.error(`[${new Date().toISOString()}] detectAndTranslate failed: ${err.message}`);
    return getFallback("detectAndTranslate");
  }
};

export const compareClaimWithSources = async (claim, sources, responseLanguage = "en") => {
  const { analyzeClaimWithEvidence } = await import("./gemini.js");
  return analyzeClaimWithEvidence(claim, sources, responseLanguage);
};

// Legacy — not used for text claims; image analysis uses analyzeImageContent in gemini.js
export const detectAIContent = async () => {
  return null;
};
