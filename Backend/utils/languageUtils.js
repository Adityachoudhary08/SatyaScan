// Language utilities for multilingual support
// Supports: English, Hindi, Punjabi, Bengali, Tamil, Telugu, Marathi, Gujarati, Urdu

const LANGUAGE_MAP = {
  en: { name: "English", nativeName: "English", code: "en" },
  hi: { name: "Hindi", nativeName: "हिंदी", code: "hi" },
  pa: { name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", code: "pa" },
  bn: { name: "Bengali", nativeName: "বাংলা", code: "bn" },
  ta: { name: "Tamil", nativeName: "தமிழ்", code: "ta" },
  te: { name: "Telugu", nativeName: "తెలుగు", code: "te" },
  mr: { name: "Marathi", nativeName: "मराठी", code: "mr" },
  gu: { name: "Gujarati", nativeName: "ગુજરાતી", code: "gu" },
  ur: { name: "Urdu", nativeName: "اردو", code: "ur" },
};

const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_MAP);

/**
 * Get all supported languages with metadata
 * @returns {Object} Language map with codes as keys
 */
export const getLanguageMap = () => LANGUAGE_MAP;

/**
 * Get array of supported language codes
 * @returns {string[]} Array of language codes
 */
export const getSupportedLanguages = () => SUPPORTED_LANGUAGES;

/**
 * Check if a language code is valid
 * @param {string} code - ISO 639-1 language code
 * @returns {boolean} True if valid
 */
export const isValidLanguage = (code) => {
  if (!code || typeof code !== "string") return false;
  return SUPPORTED_LANGUAGES.includes(code.toLowerCase());
};

/**
 * Normalize language code to standard format
 * @param {string} code - Language code (any case)
 * @returns {string} Normalized code (lowercase) or 'en' if invalid
 */
export const normalizeLanguage = (code) => {
  if (!code || typeof code !== "string") return "en";
  const normalized = code.toLowerCase().trim();
  return isValidLanguage(normalized) ? normalized : "en";
};

/**
 * Get human-readable language name
 * @param {string} code - Language code
 * @returns {string} Language name (native or English)
 */
export const getLanguageName = (code) => {
  const normalized = normalizeLanguage(code);
  return LANGUAGE_MAP[normalized]?.nativeName || "English";
};

/**
 * Get language name in English
 * @param {string} code - Language code
 * @returns {string} English name
 */
export const getLanguageNameInEnglish = (code) => {
  const normalized = normalizeLanguage(code);
  return LANGUAGE_MAP[normalized]?.name || "English";
};

/**
 * Determine the response language based on user preference and detection
 * @param {string} userSelection - User-selected language ('auto' or language code)
 * @param {string} detectedLanguage - Language auto-detected from input
 * @returns {string} Final response language code
 */
export const getResponseLanguage = (userSelection, detectedLanguage) => {
  // If user selected "auto", use detected language
  if (!userSelection || userSelection === "auto") {
    const normalized = normalizeLanguage(detectedLanguage);
    return normalized;
  }

  // Otherwise use user selection
  return normalizeLanguage(userSelection);
};

/**
 * UI language drives all AI output language — never infer from input text.
 * Only English and Hindi are supported for verification output.
 */
export const getUiResponseLanguage = (uiLanguage) => {
  const normalized = (uiLanguage || "en").toLowerCase().trim();
  return normalized === "hi" ? "hi" : "en";
};

/**
 * Map language code to language name for Mistral prompts
 * @param {string} code - Language code
 * @returns {string} Full language name
 */
export const getFullLanguageName = (code) => {
  const normalized = normalizeLanguage(code);
  const fullNames = {
    en: "English",
    hi: "Hindi",
    pa: "Punjabi",
    bn: "Bengali",
    ta: "Tamil",
    te: "Telugu",
    mr: "Marathi",
    gu: "Gujarati",
    ur: "Urdu",
  };
  return fullNames[normalized] || "English";
};

/**
 * Get verdict translations for common terms
 * @param {string} verdict - Verdict in English
 * @param {string} language - Target language code
 * @returns {string} Translated verdict
 */
export const translateVerdict = (verdict, language) => {
  const normalized = normalizeLanguage(language);

  const translations = {
    Supported: {
      en: "Supported",
      hi: "समर्थित",
      pa: "ਸਮਰ୍ଥିତ",
      bn: "সমর্থিত",
      ta: "ஆதரிக்கப்பட்ட",
      te: "సమర్థించిన",
      mr: "समर्थित",
      gu: "સમર્થિત",
      ur: "تصدیق شدہ",
    },
    Contradicted: {
      en: "Contradicted",
      hi: "विरोधित",
      pa: "ਵਿਰੋਧੀ",
      bn: "খণ্ডিত",
      ta: "முரண்படுத்தப்பட்ட",
      te: "విరుద్ధమైన",
      mr: "विरोधित",
      gu: "વિરોધાભાસી",
      ur: "متنازع فیہ",
    },
    Unverified: {
      en: "Unverified",
      hi: "अपुष्ट",
      pa: "ਅਪ੍ਰਮਾਣਿਤ",
      bn: "অপ্রমাণিত",
      ta: "சரிபார்க்கப்படாத",
      te: "ధృవీకృతం కాని",
      mr: "अपुष्ट",
      gu: "અપ્રમાણિત",
      ur: "غیر تصدیق شدہ",
    },
  };

  return translations[verdict]?.[normalized] || verdict;
};

/**
 * Create a language instruction string for AI prompts
 * @param {string} language - Target language code
 * @returns {string} Instruction text for AI model
 */
export const createLanguageInstruction = (language) => {
  const normalized = normalizeLanguage(language);
  const fullName = getFullLanguageName(normalized);

  if (normalized === "en") {
    return "Respond ONLY in English. Do not use any other language.";
  }

  return `CRITICAL: Respond ONLY in ${fullName} language. Do not use English or any other language. All output must be in ${fullName}.`;
};

export default {
  LANGUAGE_MAP,
  SUPPORTED_LANGUAGES,
  getLanguageMap,
  getSupportedLanguages,
  isValidLanguage,
  normalizeLanguage,
  getLanguageName,
  getLanguageNameInEnglish,
  getResponseLanguage,
  getFullLanguageName,
  translateVerdict,
  getUiResponseLanguage,
  createLanguageInstruction,
};
