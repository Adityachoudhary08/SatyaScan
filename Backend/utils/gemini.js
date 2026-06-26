import { GoogleGenerativeAI } from "@google/generative-ai";
import { getFallback } from "./fallbacks.js";
import { buildVerdictPrompt, buildImageForensicsPrompt } from "./multilingual.js";
import { normalizeLanguage } from "./languageUtils.js";

const MODEL_NAME = "gemini-2.0-flash";

const VALID_VERDICTS = [
  "TRUE",
  "FALSE",
  "MISLEADING",
  "PARTIALLY_TRUE",
  "UNVERIFIED",
];

const getApiKey = () => process.env.GEMINI_API_KEY || null;

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

const callGemini = async (systemPrompt, userContent, functionName, options = {}) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "No Gemini API key found. Set GEMINI_API_KEY in .env."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: options.json ? "application/json" : undefined,
    },
  });

  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(userContent);
      const text = result.response.text();
      if (!text) throw new Error("Gemini returned empty response");
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

const normalizeVerdict = (verdict) => {
  if (!verdict) return "UNVERIFIED";
  const normalized = String(verdict)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/PARTIALLYTRUE/g, "PARTIALLY_TRUE");

  if (normalized === "TRUE" || normalized === "SUPPORTED") return "TRUE";
  if (normalized === "FALSE" || normalized === "CONTRADICTED") return "FALSE";
  if (VALID_VERDICTS.includes(normalized)) return normalized;
  return "UNVERIFIED";
};

const clampConfidence = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
};

export const analyzeClaimWithEvidence = async (claim, sources, responseLanguage = "en") => {
  if (!claim?.trim()) throw new Error("Claim is required");

  const language = normalizeLanguage(responseLanguage);
  const system = buildVerdictPrompt(language);

  const evidencePayload = sources.map((source, index) => ({
    id: index + 1,
    title: source.title,
    url: source.url,
    publisher: source.publisher || source.source || "Unknown",
    publishedAt: source.publishedAt || null,
    snippet: source.snippet || "",
    trusted: Boolean(source.trusted),
    type: source.type || "news",
  }));

  try {
    const raw = await callGemini(
      system,
      JSON.stringify({ claim, evidence: evidencePayload }, null, 2),
      "analyzeClaimWithEvidence",
      { json: true }
    );

    const parsed = parseJson(raw, "claim verification");

    const verdict = normalizeVerdict(parsed.verdict);
    const confidence = clampConfidence(parsed.confidence);
    const summary = typeof parsed.summary === "string" ? parsed.summary : "";
    const reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning : summary;

    const sourceUrlSet = new Set(sources.map((s) => s.url));
    const annotateSources = (items = []) =>
      (Array.isArray(items) ? items : [])
        .filter((item) => item?.url && sourceUrlSet.has(item.url))
        .map((item) => ({
          title: item.title || "Untitled",
          url: item.url,
          publisher: item.publisher || getPublisherFromUrl(item.url),
          publishedAt: item.publishedAt || null,
          supportsClaim: Boolean(item.supportsClaim),
        }));

    const annotatedFromGemini = annotateSources(parsed.sources);
    const supportingSources = annotateSources(parsed.supportingSources);
    const contradictingSources = annotateSources(parsed.contradictingSources);

    const enrichedSources = sources.map((source) => {
      const match =
        annotatedFromGemini.find((s) => s.url === source.url) ||
        supportingSources.find((s) => s.url === source.url) ||
        contradictingSources.find((s) => s.url === source.url);

      return {
        title: source.title,
        url: source.url,
        publisher: source.publisher || source.source || getPublisherFromUrl(source.url),
        publishedAt: source.publishedAt || null,
        snippet: source.snippet || "",
        supportsClaim: match ? match.supportsClaim : null,
        trusted: Boolean(source.trusted),
        type: source.type || "news",
      };
    });

    return {
      verdict,
      confidence,
      summary: summary || reasoning,
      reasoning,
      evidenceCount: sources.length,
      sources: enrichedSources,
      supportingSources: supportingSources.length
        ? supportingSources
        : enrichedSources.filter((s) => s.supportsClaim === true),
      contradictingSources: contradictingSources.length
        ? contradictingSources
        : enrichedSources.filter((s) => s.supportsClaim === false),
    };
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] analyzeClaimWithEvidence failed: ${err.message}`
    );
    return {
      ...getFallback("analyzeClaimWithEvidence"),
      evidenceCount: sources.length,
      sources: sources.map((source) => ({
        title: source.title,
        url: source.url,
        publisher: source.publisher || source.source || getPublisherFromUrl(source.url),
        publishedAt: source.publishedAt || null,
        snippet: source.snippet || "",
        supportsClaim: null,
        trusted: Boolean(source.trusted),
        type: source.type || "news",
      })),
      supportingSources: [],
      contradictingSources: [],
    };
  }
};

const getPublisherFromUrl = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
  }
};

const clampScoreStrict = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
};

export const analyzeImageForensics = async (imageBuffer, mimeType, metadata, responseLanguage = "en") => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { status: "error", message: "Image analysis failed" };
  }

  const language = normalizeLanguage(responseLanguage);
  const system = buildImageForensicsPrompt(language);
  const base64 = imageBuffer.toString("base64");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: system,
    generationConfig: { temperature: 0.15, responseMimeType: "application/json" },
  });

  const metadataContext = JSON.stringify(
    {
      metadataFindings: metadata.findings || [],
      metadataIntegrity: metadata.metadataIntegrity,
      aiSoftwareSignatures: metadata.aiSoftwareSignatures || [],
      cameraModel: metadata.cameraModel,
      creationSoftware: metadata.creationSoftware,
      editingSoftware: metadata.editingSoftware,
      timestampAnomalies: metadata.timestampAnomalies || [],
      metadataStripped: metadata.metadataStripped,
    },
    null,
    2
  );

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: base64,
        },
      },
      {
        text: `Perform full visual forensics on this image.\n\nMetadata analysis results:\n${metadataContext}`,
      },
    ]);

    const parsed = parseJson(result.response.text(), "image forensics");

    const aiGeneratedProbability = clampScoreStrict(parsed.aiGeneratedProbability);
    const deepfakeProbability = clampScoreStrict(parsed.deepfakeProbability);
    const manipulationProbability = clampScoreStrict(parsed.manipulationProbability);

    if (
      aiGeneratedProbability === null ||
      deepfakeProbability === null ||
      manipulationProbability === null
    ) {
      return { status: "error", message: "Image analysis failed" };
    }

    const confidence = clampScoreStrict(parsed.confidence);
    if (confidence === null) {
      return { status: "error", message: "Image analysis failed" };
    }

    return {
      status: "success",
      verdict: parsed.verdict || null,
      confidence,
      aiGeneratedProbability,
      deepfakeProbability,
      manipulationProbability,
      lightingConsistency: parsed.lightingConsistency || null,
      shadowConsistency: parsed.shadowConsistency || null,
      reflectionConsistency: parsed.reflectionConsistency || null,
      anatomyIssues: Array.isArray(parsed.anatomyIssues) ? parsed.anatomyIssues : [],
      visualInconsistencies: Array.isArray(parsed.visualInconsistencies) ? parsed.visualInconsistencies : [],
      aiArtifacts: Array.isArray(parsed.aiArtifacts) ? parsed.aiArtifacts : [],
      deepfakeIndicators: Array.isArray(parsed.deepfakeIndicators) ? parsed.deepfakeIndicators : [],
      manipulationIndicators: Array.isArray(parsed.manipulationIndicators) ? parsed.manipulationIndicators : [],
      reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : [],
      explanation: typeof parsed.explanation === "string" ? parsed.explanation : "",
    };
  } catch (err) {
    console.error(`[${new Date().toISOString()}] analyzeImageForensics failed: ${err.message}`);
    return { status: "error", message: "Image analysis failed" };
  }
};

/** @deprecated */
export const analyzeImageContent = analyzeImageForensics;

export default { analyzeClaimWithEvidence, analyzeImageForensics, analyzeImageContent };
