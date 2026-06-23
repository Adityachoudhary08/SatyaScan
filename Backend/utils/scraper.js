import axios from "axios";
import * as cheerio from "cheerio";

const ARTICLE_SELECTORS = [
  "article p",
  ".post-content p",
  ".article-body p",
];

const extractParagraphText = ($, selector) => {
  const paragraphs = [];
  $(selector).each((_index, element) => {
    const text = $(element).text().replace(/\s+/g, " ").trim();
    if (text) paragraphs.push(text);
  });
  return paragraphs;
};

export const scrapeArticleFromUrl = async (url) => {
  if (!url?.trim()) {
    throw new Error("URL is required");
  }

  const response = await axios.get(url.trim(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; TruthLens/1.0; +https://truthlens.app)",
      Accept: "text/html,application/xhtml+xml",
    },
    timeout: 15000,
    maxRedirects: 5,
  });

  const $ = cheerio.load(response.data);
  let paragraphs = [];

  for (const selector of ARTICLE_SELECTORS) {
    paragraphs = extractParagraphText($, selector);
    if (paragraphs.length > 0) break;
  }

  if (paragraphs.length === 0) {
    paragraphs = extractParagraphText($, "p");
  }

  if (paragraphs.length === 0) {
    throw new Error("No readable article text found at the given URL");
  }

  return paragraphs.join("\n\n");
};
