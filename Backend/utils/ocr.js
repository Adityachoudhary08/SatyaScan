import { createWorker } from "tesseract.js";
import { normalizeLanguage } from "./languageUtils.js";

// Map supported languages to Tesseract language codes
const LANGUAGE_TO_TESSERACT = {
  en: "eng",
  hi: "hin",
  pa: "pan",
  bn: "ben",
  ta: "tam",
  te: "tel",
  mr: "mar",
  gu: "guj",
  ur: "urd",
};

export const extractTextFromImage = async (filePath, language = "en") => {
  const normalized = normalizeLanguage(language);
  const tesseractLang = LANGUAGE_TO_TESSERACT[normalized] || "eng";

  const worker = await createWorker(tesseractLang);
  try {
    const {
      data: { text },
    } = await worker.recognize(filePath);
    return text.trim();
  } finally {
    await worker.terminate();
  }
};
