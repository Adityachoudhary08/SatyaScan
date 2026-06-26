import { analyzeImageForensics } from "./gemini.js";
import { analyzeImageMetadata } from "./imageMetadata.js";

const VALID_VERDICTS = new Set([
  "AUTHENTIC",
  "LIKELY_AUTHENTIC",
  "AI_GENERATED",
  "LIKELY_AI_GENERATED",
  "DEEPFAKE",
  "MANIPULATED",
  "INCONCLUSIVE",
]);

const clampScore = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const normalizeVerdict = (verdict) => {
  if (!verdict) return null;
  const normalized = String(verdict)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/LIKELYAI_GENERATED/g, "LIKELY_AI_GENERATED")
    .replace(/LIKELY-AI-GENERATED/g, "LIKELY_AI_GENERATED");

  if (normalized === "LIKELY_AUTHENTIC") return "LIKELY_AUTHENTIC";
  if (VALID_VERDICTS.has(normalized)) return normalized;
  return null;
};

const deriveVerdictFromScores = (scores, metadata) => {
  const { aiGeneratedProbability, deepfakeProbability, manipulationProbability } = scores;

  if (deepfakeProbability >= 75) return "DEEPFAKE";
  if (aiGeneratedProbability >= 80) return "AI_GENERATED";
  if (manipulationProbability >= 70) return "MANIPULATED";
  if (aiGeneratedProbability >= 55 || metadata.aiSoftwareSignatures?.length > 0) {
    return "LIKELY_AI_GENERATED";
  }
  if (
    aiGeneratedProbability <= 25 &&
    deepfakeProbability <= 25 &&
    manipulationProbability <= 25 &&
    metadata.metadataIntegrity === "intact"
  ) {
    return "AUTHENTIC";
  }
  if (
    aiGeneratedProbability <= 40 &&
    deepfakeProbability <= 35 &&
    manipulationProbability <= 35
  ) {
    return "LIKELY_AUTHENTIC";
  }
  return "INCONCLUSIVE";
};

const computeConfidence = (verdict, scores, metadata, geminiConfidence) => {
  if (typeof geminiConfidence === "number" && !Number.isNaN(geminiConfidence)) {
    return clampScore(geminiConfidence);
  }

  const { aiGeneratedProbability, deepfakeProbability, manipulationProbability } = scores;
  const signalStrength = Math.max(
    aiGeneratedProbability,
    deepfakeProbability,
    manipulationProbability
  );

  if (["AUTHENTIC", "LIKELY_AUTHENTIC"].includes(verdict)) {
    const authenticity = 100 - Math.max(aiGeneratedProbability, deepfakeProbability, manipulationProbability);
    const metadataBonus = metadata.metadataIntegrity === "intact" ? 10 : 0;
    return clampScore(authenticity + metadataBonus);
  }

  let base = signalStrength;
  if (metadata.aiSoftwareSignatures?.length > 0) base = Math.min(100, base + 12);
  if (metadata.metadataStripped) base = Math.min(100, base + 8);
  return clampScore(base);
};

const computeTrustScore = (verdict, confidence) => {
  if (["AUTHENTIC", "LIKELY_AUTHENTIC"].includes(verdict)) return confidence;
  return Math.max(0, 100 - confidence);
};

export const runImageAuthenticityPipeline = async (imageBuffer, mimeType, uiLanguage = "en") => {
  try {
    const metadata = await analyzeImageMetadata(imageBuffer);
    const forensics = await analyzeImageForensics(imageBuffer, mimeType, metadata, uiLanguage);

    if (!forensics || forensics.status === "error") {
      return {
        status: "error",
        message: forensics?.message || "Image analysis failed",
      };
    }

    const aiGeneratedProbability = clampScore(forensics.aiGeneratedProbability);
    const deepfakeProbability = clampScore(forensics.deepfakeProbability);
    const manipulationProbability = clampScore(forensics.manipulationProbability);

    if (
      aiGeneratedProbability === null ||
      deepfakeProbability === null ||
      manipulationProbability === null
    ) {
      return { status: "error", message: "Image analysis failed" };
    }

    const scores = { aiGeneratedProbability, deepfakeProbability, manipulationProbability };

    let verdict = normalizeVerdict(forensics.verdict);
    if (!verdict) {
      verdict = deriveVerdictFromScores(scores, metadata);
    }

    const confidence = computeConfidence(verdict, scores, metadata, forensics.confidence);
    if (confidence === null) {
      return { status: "error", message: "Image analysis failed" };
    }

    const reasoning = [
      ...(Array.isArray(forensics.reasoning) ? forensics.reasoning : []),
      ...(metadata.findings || []),
    ].filter(Boolean);

    const uniqueReasoning = [...new Set(reasoning)];

    return {
      status: "success",
      analysisMode: "image_authenticity",
      verdict,
      confidence,
      aiGeneratedProbability,
      deepfakeProbability,
      manipulationProbability,
      metadataIntegrity: metadata.metadataIntegrity,
      metadata,
      visualForensics: {
        lightingConsistency: forensics.lightingConsistency ?? null,
        shadowConsistency: forensics.shadowConsistency ?? null,
        reflectionConsistency: forensics.reflectionConsistency ?? null,
        anatomyIssues: forensics.anatomyIssues || [],
        visualInconsistencies: forensics.visualInconsistencies || [],
        aiArtifacts: forensics.aiArtifacts || [],
        manipulationIndicators: forensics.manipulationIndicators || [],
        deepfakeIndicators: forensics.deepfakeIndicators || [],
      },
      reasoning: uniqueReasoning,
      explanation: forensics.explanation || uniqueReasoning.join(". "),
      trustScore: computeTrustScore(verdict, confidence),
    };
  } catch (error) {
    console.error(`[imageAuthenticity] Pipeline failed: ${error.message}`);
    return { status: "error", message: "Image analysis failed" };
  }
};

export default { runImageAuthenticityPipeline };
