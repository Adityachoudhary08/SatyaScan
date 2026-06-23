// Fallback responses for GenAI API failures
// These are used when API calls fail after 2 retries

export const fallbackExtractClaims = [
  { claim: "The content appears to make factual assertions that require verification" },
  { claim: "Key statements in the text should be cross-referenced with reliable sources" },
  { claim: "The accuracy of the presented information needs independent confirmation" },
];

export const fallbackDetectAndTranslate = {
  language: "en",
  translatedText: "Unable to detect language due to API failure",
};

export const fallbackCompareClaimWithSources = {
  verdict: "Unverified",
  reasoning: "Unable to verify claim due to API failure - manual fact-checking recommended",
};

export const fallbackDetectAIContent = {
  aiLikelihood: 50,
  reasoning: "Unable to analyze AI content due to API failure - using neutral estimate",
};

// Get fallback based on function name
export const getFallback = (functionName) => {
  const fallbacks = {
    extractClaims: fallbackExtractClaims,
    detectAndTranslate: fallbackDetectAndTranslate,
    compareClaimWithSources: fallbackCompareClaimWithSources,
    detectAIContent: fallbackDetectAIContent,
  };
  return fallbacks[functionName];
};
