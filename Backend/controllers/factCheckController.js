import { analyzeClaimWithEvidence } from "../utils/gemini.js";
import { fetchTavilySources, isTrustedDomain } from "../utils/tavily.js";
import { normalizeLanguage } from "../utils/languageUtils.js";

const FACT_CHECK_API_URL =
  "https://factchecktools.googleapis.com/v1alpha1/claims:search";

const MAX_SOURCES = 20;
const MIN_SOURCES_FOR_VERDICT = 1;

const dedupeSources = (sources) => {
  const seen = new Set();
  return sources.filter((source) => {
    if (!source?.url) return false;
    const key = source.url.split("#")[0].split("?")[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fetchFactCheckSources = async (claim) => {
  const apiKey = process.env.FACT_CHECK_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({ query: claim, key: apiKey });
    const response = await fetch(`${FACT_CHECK_API_URL}?${params.toString()}`);
    if (!response.ok) return [];

    const data = await response.json();
    const sources = [];

    for (const item of data.claims || []) {
      for (const review of item.claimReview || []) {
        if (!review.url) continue;
        sources.push({
          title: review.title || item.text || claim,
          url: review.url,
          publisher: review.publisher?.name || "Fact Check",
          snippet: [item.text, review.textualRating].filter(Boolean).join(" Verdict: "),
          publishedAt: review.reviewDate || null,
          type: "fact-check",
          trusted: true,
        });
      }
    }

    return sources;
  } catch (error) {
    console.warn(`Fact Check API request failed: ${error.message}`);
    return [];
  }
};

const mergeSources = (tavilySources, factCheckSources) => {
  const combined = dedupeSources([...factCheckSources, ...tavilySources]);
  return combined
    .map((source) => ({
      ...source,
      trusted: Boolean(source.trusted ?? isTrustedDomain(source.url)),
    }))
    .sort((a, b) => {
      if (a.trusted !== b.trusted) return a.trusted ? -1 : 1;
      return (b.score ?? 0) - (a.score ?? 0);
    })
    .slice(0, MAX_SOURCES);
};

export const verifyClaim = async (claim, responseLanguage = "en") => {
  if (!claim?.trim()) {
    throw new Error("Claim is required");
  }

  const trimmedClaim = claim.trim();
  const language = normalizeLanguage(responseLanguage);

  const [tavilySources, factCheckSources] = await Promise.all([
    fetchTavilySources(trimmedClaim, MAX_SOURCES),
    fetchFactCheckSources(trimmedClaim),
  ]);

  const sources = mergeSources(tavilySources, factCheckSources);

  if (sources.length < MIN_SOURCES_FOR_VERDICT) {
    return {
      claim: trimmedClaim,
      verdict: "UNVERIFIED",
      confidence: 0,
      summary:
        language === "hi"
          ? "इस दावे के लिए पर्याप्त विश्वसनीय स्रोत नहीं मिले।"
          : "Insufficient trustworthy evidence was found for this claim.",
      reasoning:
        language === "hi"
          ? "वेब खोज से कोई प्रासंगिक स्रोत नहीं मिला। स्वतंत्र तथ्य-जांच की सिफारिश की जाती है।"
          : "No relevant sources were retrieved from web search. Independent fact-checking is recommended.",
      sources: [],
      evidenceCount: 0,
      supportingSources: [],
      contradictingSources: [],
      sourceCount: 0,
      trustedSourceCount: 0,
    };
  }

  const analysis = await analyzeClaimWithEvidence(trimmedClaim, sources, language);
  const trustedSourceCount = sources.filter((s) => s.trusted).length;

  return {
    claim: trimmedClaim,
    verdict: analysis.verdict,
    confidence: analysis.confidence,
    summary: analysis.summary,
    reasoning: analysis.reasoning,
    sources: analysis.sources,
    evidenceCount: analysis.evidenceCount,
    supportingSources: analysis.supportingSources,
    contradictingSources: analysis.contradictingSources,
    sourceCount: sources.length,
    trustedSourceCount,
  };
};
