import fs from "fs/promises";
import Check from "../models/Check.js";
import { verifyClaim } from "./factCheckController.js";
import { detectAndTranslate, extractClaims } from "../utils/genai.js";
import { runImageAuthenticityPipeline } from "../utils/imageAuthenticity.js";
import { scrapeArticleFromUrl } from "../utils/scraper.js";
import {
  calculateTrustScore,
  deriveOverallVerdict,
  getDomainCredibility,
} from "../utils/scoring.js";
import { generateHash, getFromCache, setCache } from "../utils/cache.js";
import {
  normalizeLanguage,
  getUiResponseLanguage,
} from "../utils/languageUtils.js";

const ANALYSIS_TIMEOUT_MS = 90_000;
const DEFAULT_SOURCE_CREDIBILITY = 60;

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Analysis timed out after 90 seconds")),
        ms
      );
    }),
  ]);

const safeStep = async (label, fn, fallback) => {
  try {
    return await fn();
  } catch (error) {
    console.error(`${label} failed:`, error.message);
    return fallback;
  }
};

const cleanupUploadedFile = async (file) => {
  if (!file?.path) return;
  await fs.unlink(file.path).catch((error) => {
    console.warn(`Failed to delete uploaded image: ${error.message}`);
  });
};

const runImageAnalysis = async (req) => {
  const uiLanguage = getUiResponseLanguage(req.body.uiLanguage);

  if (!req.file?.path) {
    throw new Error("Image file is required for type 'image'");
  }

  const imageBuffer = await fs.readFile(req.file.path);
  const mimeType = req.file.mimetype;

  try {
    const imageAnalysis = await runImageAuthenticityPipeline(
      imageBuffer,
      mimeType,
      uiLanguage
    );

    const apiWorking = imageAnalysis.status === "success";
    const trustScore =
      imageAnalysis.status === "success" ? imageAnalysis.trustScore : 0;

    let checkId = null;
    try {
      const check = await Check.create({
        userId: req.user?._id ?? null,
        inputType: "image",
        originalText: "[image]",
        language: uiLanguage,
        detectedLanguage: "unknown",
        responseLanguage: uiLanguage,
        uiLanguage,
        claims: [],
        imageAnalysis,
        sourceScore: 0,
        trustScore,
      });
      checkId = check._id;
    } catch (dbError) {
      console.warn(`[DB] Failed to save image check: ${dbError.message}`);
    }

    return {
      inputType: "image",
      analysisMode: "image_authenticity",
      uiLanguage,
      responseLanguage: uiLanguage,
      imageAnalysis,
      claims: [],
      trustScore,
      checkId,
      apiWorking,
    };
  } finally {
    await cleanupUploadedFile(req.file);
  }
};

const runTextAnalysis = async (req) => {
  const type = req.body.type;
  const content = req.body.content;
  const uiLanguage = getUiResponseLanguage(req.body.uiLanguage);
  const inputUrl = type === "url" ? content?.trim() : null;

  let rawText;
  if (type === "text") {
    if (!content?.trim()) throw new Error("Content is required for type 'text'");
    rawText = content.trim();
  } else {
    if (!content?.trim()) throw new Error("Content URL is required for type 'url'");
    rawText = await scrapeArticleFromUrl(content.trim());
  }

  if (!rawText) {
    throw new Error("No text could be extracted from the provided input");
  }

  let apiWorking = true;

  const { language: detectedLanguage, translatedText } = await safeStep(
    "detectAndTranslate",
    () => detectAndTranslate(rawText),
    { language: "unknown", translatedText: rawText }
  );

  const normalizedDetected = normalizeLanguage(detectedLanguage);
  const responseLanguage = uiLanguage;

  const extractedClaims = await safeStep(
    "extractClaims",
    () => extractClaims(translatedText, "en"),
    []
  );

  const claimsToVerify =
    extractedClaims.length > 0
      ? extractedClaims
      : translatedText.trim().split(/\s+/).length >= 4
        ? [{ claim: translatedText.trim() }]
        : [];

  const verifiedClaims = await Promise.all(
    claimsToVerify.map(async (item) => {
      const claimText = item.claim;
      return safeStep(
        `verifyClaim("${claimText}")`,
        () => verifyClaim(claimText, responseLanguage),
        {
          claim: claimText,
          verdict: "UNVERIFIED",
          confidence: 0,
          summary: "Verification unavailable due to an upstream error",
          reasoning: "Verification unavailable due to an upstream error",
          sources: [],
          evidenceCount: 0,
          supportingSources: [],
          contradictingSources: [],
        }
      );
    })
  );

  const sourceCredibility = inputUrl
    ? await safeStep(
        "getDomainCredibility",
        () => getDomainCredibility(inputUrl),
        DEFAULT_SOURCE_CREDIBILITY
      )
    : DEFAULT_SOURCE_CREDIBILITY;

  let trustScore = DEFAULT_SOURCE_CREDIBILITY;
  if (verifiedClaims.length > 0) {
    trustScore = calculateTrustScore(verifiedClaims, sourceCredibility).trustScore;
  }

  const overall = deriveOverallVerdict(verifiedClaims);
  const primaryClaim = verifiedClaims[0];

  const claimsForResponse = verifiedClaims.map(
    ({
      claim,
      verdict,
      confidence,
      summary,
      reasoning,
      sources,
      evidenceCount,
      supportingSources,
      contradictingSources,
      sourceCount,
      trustedSourceCount,
    }) => ({
      text: claim,
      verdict,
      confidence,
      summary,
      reasoning,
      sources,
      evidenceCount,
      supportingSources,
      contradictingSources,
      sourceCount,
      trustedSourceCount,
    })
  );

  const evidenceCount = verifiedClaims.flatMap((c) => c.sources || []).length;

  let checkId = null;
  try {
    const check = await Check.create({
      userId: req.user?._id ?? null,
      inputType: type,
      originalText: rawText,
      language: normalizedDetected,
      detectedLanguage: normalizedDetected,
      responseLanguage,
      uiLanguage,
      claims: verifiedClaims.map(({ claim, verdict, sources }) => ({
        text: claim,
        verdict,
        sources: sources.map((source) => source.url),
      })),
      sourceScore: sourceCredibility,
      trustScore,
    });
    checkId = check._id;
  } catch (dbError) {
    console.warn(`[DB] Failed to save check result: ${dbError.message}`);
  }

  return {
    inputType: type,
    analysisMode: "fact_verification",
    detectedLanguage: normalizedDetected,
    responseLanguage,
    uiLanguage,
    language: normalizedDetected,
    verdict: primaryClaim?.verdict ?? overall.verdict,
    confidence: primaryClaim?.confidence ?? overall.confidence,
    summary: primaryClaim?.summary ?? "",
    reasoning: primaryClaim?.reasoning ?? "",
    evidenceCount,
    supportingSources: primaryClaim?.supportingSources ?? [],
    contradictingSources: primaryClaim?.contradictingSources ?? [],
    claims: claimsForResponse,
    sourceCredibility,
    trustScore,
    checkId,
    apiWorking,
  };
};

const runAnalysis = async (req) => {
  const type = req.body.type;
  if (type === "image") {
    return runImageAnalysis(req);
  }
  return runTextAnalysis(req);
};

export const analyze = async (req, res) => {
  try {
    const type = req.body.type;

    if (!type || !["text", "url", "image"].includes(type)) {
      return res.status(400).json({
        message: 'Invalid or missing type. Must be "text", "url", or "image"',
      });
    }

    const content = req.body.content || "";
    const uiLanguage = getUiResponseLanguage(req.body.uiLanguage);

    let cacheKey;
    if (type === "image" && req.file?.path) {
      const fileBuffer = await fs.readFile(req.file.path);
      cacheKey = generateHash(`image:${fileBuffer.toString("base64").slice(0, 4096)}:${uiLanguage}`);
    } else {
      cacheKey = generateHash(`${type}:${content}:${uiLanguage}`);
    }

    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      if (type === "image") await cleanupUploadedFile(req.file);
      console.log(`[${new Date().toISOString()}] Cache hit for analyze request`);
      return res.status(200).json(cachedResult);
    }

    console.log(`[${new Date().toISOString()}] Cache miss for analyze request, running analysis`);

    const result = await withTimeout(runAnalysis(req), ANALYSIS_TIMEOUT_MS);

    setCache(cacheKey, result);
    console.log(`[${new Date().toISOString()}] Analysis result cached`);

    res.status(200).json(result);
  } catch (error) {
    await cleanupUploadedFile(req.file);
    console.error(`[${new Date().toISOString()}] Analyze request failed:`, error.message);

    if (error.message.includes("timed out")) {
      return res.status(504).json({ message: error.message });
    }

    res.status(500).json({
      message: error.message || "Analysis failed",
    });
  }
};
