import { createWorker } from "tesseract.js";

export const extractTextFromImage = async (filePath) => {
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(filePath);
    return text.trim();
  } finally {
    await worker.terminate();
  }
};
