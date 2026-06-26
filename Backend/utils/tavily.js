const TAVILY_API_URL = "https://api.tavily.com/search";

const TRUSTED_DOMAINS = [
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "bbc.co.uk",
  "indianexpress.com",
  "thehindu.com",
  "gov.in",
  "nic.in",
  "who.int",
  "nasa.gov",
  "un.org",
  "npr.org",
  "pbs.org",
  "snopes.com",
  "politifact.com",
  "factcheck.org",
  "fullfact.org",
  "wikipedia.org",
  "britannica.com",
  "nature.com",
  "sciencedirect.com",
  "pubmed.ncbi.nlm.nih.gov",
];

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have",
  "in", "is", "it", "its", "of", "on", "or", "that", "the", "this", "to", "was",
  "were", "will", "with",
]);

const getHostname = (url) => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
};

export const isTrustedDomain = (url) => {
  const hostname = getHostname(url);
  return TRUSTED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
};

const tokenize = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));

const inferSubject = (claim) => {
  const match = claim
    .replace(/\s+/g, " ")
    .trim()
    .match(/^(.+?)\s+(is|are|was|were|has|have|had|made|located|completed|won|claims?|says?)\b/i);

  if (!match) return null;
  const subject = match[1].replace(/^(the|a|an)\s+/i, "").trim();
  if (!subject || subject.split(" ").length > 6) return null;
  return subject;
};

export const buildSearchQueries = (claim) => {
  const trimmed = claim.trim();
  const keywords = [...new Set(tokenize(trimmed))].slice(0, 6);
  const subject = inferSubject(trimmed);

  const queries = [trimmed];

  if (keywords.length >= 2) {
    queries.push(keywords.join(" "));
  }

  if (subject && subject.toLowerCase() !== trimmed.toLowerCase()) {
    queries.push(`${subject} fact check`);
  }

  const shortened = trimmed.length > 120 ? `${trimmed.slice(0, 120)}...` : null;
  if (shortened && shortened !== trimmed) {
    queries.push(shortened);
  }

  return [...new Set(queries.map((q) => q.trim()).filter(Boolean))].slice(0, 4);
};

const fetchTavilyQuery = async (query, apiKey) => {
  const response = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: 10,
      include_answer: false,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Tavily error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return (data.results || []).map((result) => ({
    title: result.title || "Untitled",
    url: result.url,
    publisher: getHostname(result.url) || "Unknown",
    snippet: result.content || "",
    publishedAt: result.published_date || null,
    score: result.score ?? 0,
    type: "news",
  }));
};

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

const prioritizeSources = (sources) =>
  dedupeSources(sources)
    .map((source) => ({
      ...source,
      trusted: isTrustedDomain(source.url),
    }))
    .sort((a, b) => {
      if (a.trusted !== b.trusted) return a.trusted ? -1 : 1;
      return (b.score ?? 0) - (a.score ?? 0);
    });

export const fetchTavilySources = async (claim, maxResults = 20) => {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn("TAVILY_API_KEY is not configured; skipping Tavily lookup");
    return [];
  }

  const queries = buildSearchQueries(claim);
  const results = await Promise.allSettled(
    queries.map((query) => fetchTavilyQuery(query, apiKey))
  );

  const combined = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      combined.push(...result.value);
    } else {
      console.warn(`Tavily query failed: ${result.reason?.message}`);
    }
  }

  return prioritizeSources(combined).slice(0, maxResults);
};

export default { fetchTavilySources, buildSearchQueries, isTrustedDomain };
