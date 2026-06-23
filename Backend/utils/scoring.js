const TRUSTED_DOMAINS = {
  "bbc.com": 92,
  "bbc.co.uk": 92,
  "reuters.com": 95,
  "ndtv.com": 90,
  "thehindu.com": 91,
  "apnews.com": 94,
  "ap.org": 94,
  "nytimes.com": 91,
  "theguardian.com": 90,
  "washingtonpost.com": 90,
  "economist.com": 91,
  "npr.org": 91,
  "pbs.org": 90,
};

const DEFAULT_CREDIBILITY = 40;

const CLAIM_WEIGHTS = {
  Supported: 1,
  Unverified: 0.5,
  Contradicted: 0,
};

const getClaimWeight = (verdict) => {
  return CLAIM_WEIGHTS[verdict] ?? 0;
};

export const calculateTrustScore = (claims, aiLikelihood, sourceCredibility) => {
  if (!Array.isArray(claims) || claims.length === 0) {
    throw new Error("At least one claim is required to calculate trust score");
  }

  if (
    typeof aiLikelihood !== "number" ||
    aiLikelihood < 0 ||
    aiLikelihood > 100
  ) {
    throw new Error("aiLikelihood must be a number between 0 and 100");
  }

  if (
    typeof sourceCredibility !== "number" ||
    sourceCredibility < 0 ||
    sourceCredibility > 100
  ) {
    throw new Error("sourceCredibility must be a number between 0 and 100");
  }

  const totalWeight = claims.reduce(
    (sum, claim) => sum + getClaimWeight(claim.verdict),
    0
  );
  const factualAccuracy = (totalWeight / claims.length) * 100;
  const aiScore = 100 - aiLikelihood;
  const sourceScore = sourceCredibility;

  const trustScore = Math.round(
    factualAccuracy * 0.5 + aiScore * 0.25 + sourceScore * 0.25
  );

  return {
    factualAccuracy: Math.round(factualAccuracy),
    aiScore: Math.round(aiScore),
    sourceScore: Math.round(sourceScore),
    trustScore,
  };
};

const extractDomain = (url) => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.replace(/^www\./, "");
  } catch {
    throw new Error("Invalid URL provided for domain credibility check");
  }
};

const matchTrustedDomain = (domain) => {
  if (TRUSTED_DOMAINS[domain] !== undefined) {
    return TRUSTED_DOMAINS[domain];
  }

  for (const [trustedDomain, score] of Object.entries(TRUSTED_DOMAINS)) {
    if (domain === trustedDomain || domain.endsWith(`.${trustedDomain}`)) {
      return score;
    }
  }

  return null;
};

export const getDomainCredibility = (url) => {
  const domain = extractDomain(url);
  const trustedScore = matchTrustedDomain(domain);

  return trustedScore ?? DEFAULT_CREDIBILITY;
};
