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

// Multilingual fallback responses
export const fallbackMultilingual = {
  hi: {
    extractClaims: [
      { claim: "सामग्री में तथ्यात्मक दावे हैं जिनकी सत्यापन की आवश्यकता है" },
      { claim: "पाठ में मुख्य कथनों को विश्वसनीय स्रोतों के साथ क्रॉस-संदर्भ किया जाना चाहिए" },
      { claim: "प्रस्तुत की गई जानकारी की सटीकता को स्वतंत्र रूप से सत्यापित करने की आवश्यकता है" },
    ],
    detectAndTranslate: {
      language: "hi",
      translatedText: "API विफलता के कारण भाषा का पता नहीं लगाया जा सका",
    },
    compareClaimWithSources: {
      verdict: "अपुष्ट",
      reasoning: "API विफलता के कारण दावे की पुष्टि नहीं कर सकते - मैनुअल तथ्य-जांच की सिफारिश की जाती है",
    },
    detectAIContent: {
      aiLikelihood: 50,
      reasoning: "API विफलता के कारण AI सामग्री का विश्लेषण नहीं कर सकते - तटस्थ अनुमान का उपयोग किया जा रहा है",
    },
  },
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

// Get multilingual fallback
export const getMultilingualFallback = (functionName, language) => {
  if (!language || language === "en") {
    return getFallback(functionName);
  }

  const langFallbacks = fallbackMultilingual[language];
  if (!langFallbacks) {
    return getFallback(functionName);
  }

  return langFallbacks[functionName];
};
