export const fallbackExtractClaims = [
  { claim: "The content appears to make factual assertions that require verification" },
];

export const fallbackDetectAndTranslate = {
  language: "en",
  translatedText: "Unable to detect language due to API failure",
};

export const fallbackAnalyzeClaimWithEvidence = {
  verdict: "UNVERIFIED",
  confidence: 0,
  summary: "Unable to verify claim due to analysis failure",
  reasoning: "Verification unavailable — manual fact-checking recommended",
};

export const fallbackAnalyzeImageContent = {
  status: "error",
  message: "Image analysis failed",
};

export const getFallback = (functionName) => {
  const fallbacks = {
    extractClaims: fallbackExtractClaims,
    detectAndTranslate: fallbackDetectAndTranslate,
    analyzeClaimWithEvidence: fallbackAnalyzeClaimWithEvidence,
    analyzeImageContent: fallbackAnalyzeImageContent,
    compareClaimWithSources: fallbackAnalyzeClaimWithEvidence,
  };
  return fallbacks[functionName];
};

export default {
  fallbackExtractClaims,
  fallbackDetectAndTranslate,
  fallbackAnalyzeClaimWithEvidence,
  fallbackAnalyzeImageContent,
  getFallback,
};
