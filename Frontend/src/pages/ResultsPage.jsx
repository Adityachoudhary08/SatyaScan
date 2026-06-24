import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import ShareModal from '../components/ShareModal';
import { useTranslation } from '../context/LanguageContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTrustColor(score) {
  if (score >= 70) return '#14B8A6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function getVerdictColor(verdict) {
  const map = {
    Supported: '#14B8A6', True: '#14B8A6',
    Contradicted: '#ef4444', False: '#ef4444', Misleading: '#f97316',
    Unverified: '#6b7280',
  };
  return map[verdict] || '#6b7280';
}

function getConfidenceColor(verdict, conf) {
  if (verdict === 'Supported') return conf >= 75 ? '#14B8A6' : '#5eead4';
  if (verdict === 'Contradicted') return conf >= 75 ? '#ef4444' : '#fca5a5';
  return conf <= 20 ? '#374151' : '#6b7280';
}

// Inline shield logo with teal
function ShieldLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="sgResults" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#5eead4" />
        </linearGradient>
      </defs>
      <path d="M50 6 L88 22 L88 54 C88 72 70 88 50 95 C30 88 12 72 12 54 L12 22 Z"
        fill="url(#sgResults)" opacity="0.15" stroke="url(#sgResults)" strokeWidth="2.5" />
      <text x="50" y="66" textAnchor="middle" fontSize="44" fontWeight="800"
        fontFamily="Inter,Arial,sans-serif" fill="url(#sgResults)">S</text>
    </svg>
  );
}

// ─── Trust Score Gauge ────────────────────────────────────────────────────────

function TrustGauge({ score, t }) {
  const color = getTrustColor(score);
  const label = score >= 70
    ? t('results.trustLabel.trusted')
    : score >= 40
    ? t('results.trustLabel.questionable')
    : t('results.trustLabel.lowTrust');

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-[#D1D5DB]/60 uppercase tracking-widest mb-4 font-semibold">{t('results.trustScore')}</p>
      <div className="relative w-44 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%"
            startAngle={90} endAngle={-270} data={[{ value: score }]}>
            <RadialBar background={{ fill: '#1A1A1A' }} dataKey="value"
              cornerRadius={6} fill={color} max={100} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-white">{score}</span>
          <span className="text-xs text-[#D1D5DB]/40 mt-1">/ 100</span>
        </div>
      </div>
      <span className="mt-3 text-sm font-bold" style={{ color }}>{label}</span>
      <p className="text-xs text-[#D1D5DB]/40 mt-1 text-center max-w-[140px]">
        {t('results.securityModules')}
      </p>
    </div>
  );
}

// ─── Verification Vectors ─────────────────────────────────────────────────────

function VerificationVectors({ aiLikelihood, aiScore, sourceCredibility, trustScore, t }) {
  const vectors = [
    { name: t('results.accuracy'), value: Math.round(trustScore), color: '#14B8A6' },
    { name: t('results.aiProbability'), value: aiLikelihood, color: aiLikelihood > 60 ? '#ef4444' : '#5eead4' },
    { name: t('results.sourceTrust'), value: Math.round(sourceCredibility), color: '#14B8A6' },
    { name: t('results.evidenceStrength'), value: Math.round(aiScore ?? (100 - aiLikelihood)), color: '#f59e0b' },
  ];
  return (
    <div className="flex-1">
      <p className="text-xs text-[#D1D5DB]/60 uppercase tracking-widest mb-5 font-semibold">{t('results.vectors')}</p>
      <div className="space-y-3">
        {vectors.map((v) => (
          <div key={v.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#D1D5DB]">{v.name}</span>
              <span className="font-bold text-white">{v.value}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#0B0B0B] rounded-full">
              <motion.div
                className="h-1.5 rounded-full"
                style={{ background: v.color }}
                initial={{ width: 0 }}
                animate={{ width: `${v.value}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Origin Analysis ──────────────────────────────────────────────────────────

function OriginAnalysis({ aiLikelihood, aiReasoning, t }) {
  const isHuman = aiLikelihood < 45;
  const isMixed = aiLikelihood >= 45 && aiLikelihood < 70;
  const color = isHuman ? '#14B8A6' : isMixed ? '#f59e0b' : '#ef4444';
  const label = isHuman ? t('results.likelyHuman') : isMixed ? t('results.likelyMixed') : t('results.likelyAI');

  return (
    <div className="bg-[#1A1A1A] border border-[#14B8A6]/20 rounded-xl p-5 flex-1">
      <p className="text-xs text-[#D1D5DB]/60 uppercase tracking-widest mb-4 font-semibold">{t('results.originAnalysis')}</p>
      <div className="mb-4">
        <span className="text-4xl font-black" style={{ color }}>{aiLikelihood}%</span>
        <span className="ml-3 text-sm font-semibold" style={{ color }}>{label}</span>
      </div>
      <p className="text-sm text-[#D1D5DB] leading-relaxed">
        {aiReasoning || 'Analysis of sentence structure and linguistic entropy patterns.'}
      </p>
      <div className="mt-4">
        <p className="text-xs text-[#D1D5DB]/40 uppercase tracking-wider mb-2">{t('results.neuralConfidence')}</p>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}
              className="h-2 flex-1 rounded-sm"
              style={{ background: i < Math.round(aiLikelihood / 10) ? color : '#2A2A2A' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Claim Card ───────────────────────────────────────────────────────────────

function ClaimCard({ claim, index, t }) {
  const [open, setOpen] = useState(false);
  const color = getVerdictColor(claim.verdict);
  const hasConf = typeof claim.confidence === 'number';
  const confColor = hasConf ? getConfidenceColor(claim.verdict, claim.confidence) : color;

  const getConfidenceLabel = (conf) => {
    if (conf >= 90) return t('results.veryHigh');
    if (conf >= 75) return t('results.high');
    if (conf >= 50) return t('results.moderate');
    if (conf >= 20) return t('results.low');
    return t('results.veryLow');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="border border-[#2A2A2A] rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-[#1A1A1A] transition-colors"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="mt-0.5 text-base shrink-0" style={{ color }}>
            {claim.verdict === 'Supported' ? '✅' : claim.verdict === 'Contradicted' ? '❌' : '❓'}
          </span>
          <span className="text-[#D1D5DB] text-sm leading-relaxed">"{claim.text}"</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full block"
              style={{ background: color + '20', color }}>
              {claim.verdict}
            </span>
            {hasConf && (
              <span className="text-xs font-mono mt-0.5 block" style={{ color: confColor }}>
                {claim.confidence}%
              </span>
            )}
          </div>
          <span className="text-[#D1D5DB]/30 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#2A2A2A] bg-[#0B0B0B]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#2A2A2A]">
                {/* Rationale */}
                <div className="p-4">
                  <p className="text-xs text-[#D1D5DB]/40 uppercase tracking-widest mb-2 font-semibold">{t('results.rationale')}</p>

                  {/* Confidence bar */}
                  {hasConf && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#D1D5DB]/50">{t('results.confidence')}</span>
                        <span className="font-bold" style={{ color: confColor }}>
                          {claim.confidence}% — {getConfidenceLabel(claim.confidence)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#2A2A2A] rounded-full">
                        <motion.div className="h-1.5 rounded-full"
                          style={{ background: confColor, width: `${claim.confidence}%` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${claim.confidence}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  )}

                  {(claim.sourceCount > 0 || claim.trustedSourceCount > 0) && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {claim.sourceCount > 0 && (
                        <span className="text-xs bg-[#1A1A1A] border border-[#2A2A2A] text-[#D1D5DB]/60 px-2 py-0.5 rounded-full">
                          📄 {claim.sourceCount} {t('results.sources')}{claim.sourceCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {claim.trustedSourceCount > 0 && (
                        <span className="text-xs bg-[#14B8A6]/10 border border-[#14B8A6]/30 text-[#14B8A6] px-2 py-0.5 rounded-full">
                          ✓ {claim.trustedSourceCount} {t('results.trusted')}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-[#D1D5DB] leading-relaxed">
                    {claim.reasoning || '—'}
                  </p>
                </div>

                {/* Peer verification / sources */}
                <div className="p-4">
                  <p className="text-xs text-[#D1D5DB]/40 uppercase tracking-widest mb-2 font-semibold">
                    {t('results.peerVerification')}
                  </p>
                  {claim.sources?.length > 0 ? (
                    <ul className="space-y-2">
                      {claim.sources.slice(0, 5).map((src, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          {src.trusted && (
                            <span className="text-[#14B8A6] shrink-0 mt-0.5">✓</span>
                          )}
                          <div className="min-w-0">
                            <a href={src.url || src} target="_blank" rel="noopener noreferrer"
                              className="text-[#14B8A6] hover:underline font-medium truncate block">
                              {src.title || src.url || src}
                            </a>
                            {src.source && <span className="text-[#D1D5DB]/30">— {src.source}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#D1D5DB]/30 text-xs">{t('results.noSources')}</p>
                  )}
                  {claim.sources?.length > 0 && (
                    <p className="text-[#D1D5DB]/30 text-xs mt-3">
                      {t('results.validationNodes')} {claim.sources.length} {t('results.validationNode')}{claim.sources.length !== 1 ? 's' : ''}{t('results.validationNodes2')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Source Trust Cards ───────────────────────────────────────────────────────

function SourceTrustCard({ name, trust, icon }) {
  const color = trust >= 90 ? '#14B8A6' : trust >= 70 ? '#5eead4' : '#f59e0b';
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="font-bold text-white text-sm">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1 w-24 bg-[#0B0B0B] rounded-full">
          <div className="h-1 rounded-full" style={{ width: `${trust}%`, background: color }} />
        </div>
        <span className="text-xs font-bold" style={{ color }}>{trust}%</span>
        <a href="#" className="text-[#D1D5DB]/20 hover:text-[#14B8A6] text-xs">↗</a>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);

  const result = location.state?.result;

  if (!result) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center text-center px-4">
        <ShieldLogo size={48} />
        <p className="text-[#D1D5DB] mt-4 mb-4">{t('results.noResult')}</p>
        <Link to="/analyze" className="ss-btn-primary text-sm px-5 py-2">← {t('results.backAnalyze')}</Link>
      </div>
    );
  }

  const {
    inputType, trustScore, aiLikelihood, aiScore, aiReasoning,
    sourceCredibility, language, detectedLanguage, responseLanguage,
    claims = [], checkId, apiWorking,
  } = result;

  const supported = claims.filter(c => ['Supported', 'True'].includes(c.verdict)).length;
  const contradicted = claims.filter(c => ['Contradicted', 'False', 'Misleading'].includes(c.verdict)).length;
  const unverified = claims.length - supported - contradicted;

  // Pick top 2 trusted sources across all claims for the source trust panel
  const allSources = claims.flatMap(c => c.sources || []);
  const topSources = [...new Map(allSources.filter(s => s.trusted).map(s => [s.source, s])).values()].slice(0, 2);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <ShieldLogo size={24} />
          <span className="font-bold text-base tracking-tight">
            <span className="text-[#14B8A6]">Satya</span>Scan
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Search bar */}
          <div className="hidden sm:flex items-center border border-[#2A2A2A] rounded-lg px-3 py-1.5 bg-[#1A1A1A] gap-2 text-sm text-[#D1D5DB]/40">
            <span>🔍</span>
            <span>{t('results.search')}</span>
          </div>
          {/* Nav links */}
          <div className="flex items-center gap-4 text-sm text-[#D1D5DB]/60">
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors">{t('nav.dashboard')}</button>
            <button onClick={() => navigate('/analyze')} className="hover:text-white transition-colors text-[#14B8A6] border-b border-[#14B8A6] pb-0.5">
              {t('results.newAnalysis')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">

        {/* API warning */}
        {apiWorking === false && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-amber-900/20 border border-amber-600/30 rounded-xl px-5 py-4">
            <p className="text-amber-300 text-sm font-semibold">⚠️ {t('results.apiWarningTitle')}</p>
            <p className="text-amber-400/70 text-xs mt-1">{t('results.apiWarningDesc')}</p>
          </motion.div>
        )}

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">{t('results.title')}</h1>
            <div className="flex gap-2 mt-2 flex-wrap">
              {inputType && (
                <span className="text-xs border border-[#2A2A2A] text-[#D1D5DB]/60 px-2 py-1 rounded-full">
                  {inputType === 'text' ? '📝' : inputType === 'url' ? '🔗' : '🖼️'} {inputType} analysis
                </span>
              )}
              {detectedLanguage && detectedLanguage !== 'unknown' && (
                <span className="text-xs border border-[#14B8A6]/30 text-[#14B8A6] bg-[#14B8A6]/10 px-2 py-1 rounded-full">
                  🌍 {t('results.detected')}: {detectedLanguage.toUpperCase()}
                </span>
              )}
              {responseLanguage && responseLanguage !== 'unknown' && (
                <span className="text-xs border border-[#5eead4]/30 text-[#5eead4] bg-[#5eead4]/10 px-2 py-1 rounded-full">
                  💬 {t('results.response')}: {responseLanguage.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/analyze')}
              className="ss-btn-secondary text-sm px-4 py-2">
              ← {t('results.newAnalysis')}
            </button>
            {checkId && (
              <button onClick={() => setShowShare(true)}
                className="ss-btn-primary text-sm px-4 py-2">
                {t('results.sharePdf')}
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Row 1: Trust Gauge + Vectors + Origin ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Trust gauge */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="ss-card flex flex-col items-center justify-center">
            <TrustGauge score={trustScore} t={t} />
          </motion.div>

          {/* Verification vectors */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
            className="ss-card">
            <VerificationVectors
              aiLikelihood={aiLikelihood} aiScore={aiScore}
              sourceCredibility={sourceCredibility} trustScore={trustScore} t={t}
            />
          </motion.div>

          {/* Origin analysis */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <OriginAnalysis aiLikelihood={aiLikelihood} aiReasoning={aiReasoning} t={t} />
          </motion.div>
        </div>

        {/* ── Evidence Verification ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <span className="text-[#14B8A6]">📋</span> {t('results.evidenceVerification')}
            </h2>
            <div className="flex gap-2">
              {supported > 0 && (
                <span className="text-xs bg-[#14B8A6]/10 border border-[#14B8A6]/30 text-[#14B8A6] px-2 py-1 rounded-full font-bold">
                  {supported} {t('results.supported')}
                </span>
              )}
              {contradicted > 0 && (
                <span className="text-xs bg-red-900/30 border border-red-800 text-red-400 px-2 py-1 rounded-full font-bold">
                  {contradicted} {t('results.disputed')}
                </span>
              )}
              {unverified > 0 && (
                <span className="text-xs bg-[#1A1A1A] border border-[#2A2A2A] text-[#D1D5DB]/50 px-2 py-1 rounded-full">
                  {unverified} {t('results.unverified')}
                </span>
              )}
            </div>
          </div>

          {claims.length === 0 ? (
            <div className="text-[#D1D5DB]/40 text-sm text-center py-10 border border-[#2A2A2A] rounded-xl">
              {t('results.noClaims')}
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((claim, i) => <ClaimCard key={i} claim={claim} index={i} t={t} />)}
            </div>
          )}
        </motion.div>

        {/* ── Source Trust Panel ── */}
        {topSources.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topSources.map((src, i) => (
                <SourceTrustCard
                  key={i}
                  name={src.source || 'Trusted Source'}
                  trust={src.source?.toLowerCase().includes('bbc') ? 98 : src.source?.toLowerCase().includes('reuters') ? 99 : 90}
                  icon={src.source?.toLowerCase().includes('bbc') ? '📺' : '🌐'}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        {checkId && (
          <p className="text-[#D1D5DB]/30 text-xs text-center pt-2">
            {t('results.checkId')}: <code className="text-[#D1D5DB]/50">{checkId}</code>
            {' · '}
            <a href={`/report/${checkId}`} target="_blank" rel="noopener noreferrer"
              className="text-[#14B8A6] hover:underline">{t('results.publicReport')}</a>
          </p>
        )}
      </div>

      {/* Footer bar */}
      <div className="border-t border-[#2A2A2A] px-8 py-5 flex items-center justify-between mt-4">
        <div>
          <p className="font-bold text-sm"><span className="text-[#14B8A6]">Satya</span>Scan AI</p>
          <p className="text-[#D1D5DB]/40 text-xs">{t('landing.footer.rights')}</p>
        </div>
        <div className="flex gap-5 text-xs text-[#D1D5DB]/40">
          {[t('landing.footer.about'), t('landing.footer.features'), t('landing.footer.github'), t('landing.footer.contact')].map((l) => (
            <a key={l} href="#" className="hover:text-[#14B8A6] transition-colors">{l}</a>
          ))}
        </div>
      </div>

      {showShare && checkId && (
        <ShareModal checkId={checkId} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
