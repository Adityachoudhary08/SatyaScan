import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
} from 'recharts';
import ShareModal from '../components/ShareModal';
import { useTranslation } from '../context/LanguageContext';

function getTrustColor(score) {
  if (score >= 70) return '#14B8A6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function getVerdictColor(verdict) {
  const map = {
    TRUE: '#14B8A6', True: '#14B8A6', Supported: '#14B8A6',
    FALSE: '#ef4444', False: '#ef4444', Contradicted: '#ef4444',
    MISLEADING: '#f97316', Misleading: '#f97316',
    PARTIALLY_TRUE: '#f59e0b', 'PARTIALLY TRUE': '#f59e0b',
    UNVERIFIED: '#6b7280', Unverified: '#6b7280',
    AUTHENTIC: '#14B8A6',
    LIKELY_AUTHENTIC: '#5eead4',
    AI_GENERATED: '#ef4444',
    LIKELY_AI_GENERATED: '#f97316',
    DEEPFAKE: '#dc2626',
    MANIPULATED: '#eab308',
    INCONCLUSIVE: '#6b7280',
  };
  return map[verdict] || '#6b7280';
}

function formatTextVerdict(verdict, t) {
  const labels = {
    TRUE: t('results.verdictTrue'),
    FALSE: t('results.verdictFalse'),
    MISLEADING: t('results.verdictMisleading'),
    PARTIALLY_TRUE: t('results.verdictPartiallyTrue'),
    UNVERIFIED: t('results.verdictUnverified'),
  };
  return labels[verdict] || verdict;
}

function formatImageVerdict(verdict, t) {
  const labels = {
    AUTHENTIC: t('results.imageVerdictAuthentic'),
    LIKELY_AUTHENTIC: t('results.imageVerdictLikelyAuthentic'),
    AI_GENERATED: t('results.imageVerdictAiGenerated'),
    LIKELY_AI_GENERATED: t('results.imageVerdictLikelyAiGenerated'),
    DEEPFAKE: t('results.imageVerdictDeepfake'),
    MANIPULATED: t('results.imageVerdictManipulated'),
    INCONCLUSIVE: t('results.imageVerdictInconclusive'),
  };
  return labels[verdict] || verdict?.replace(/_/g, ' ');
}

function getTextVerdictIcon(verdict) {
  if (['TRUE', 'True', 'Supported'].includes(verdict)) return '✅';
  if (['FALSE', 'False', 'Contradicted'].includes(verdict)) return '❌';
  if (['MISLEADING', 'Misleading'].includes(verdict)) return '⚠️';
  if (['PARTIALLY_TRUE', 'PARTIALLY TRUE'].includes(verdict)) return '🟡';
  return '❓';
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

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

function ScoreBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#D1D5DB]">{label}</span>
        <span className="font-bold text-white">{value}%</span>
      </div>
      <div className="w-full h-2 bg-[#0B0B0B] rounded-full">
        <motion.div
          className="h-2 rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
}

function TrustGauge({ score, label, t }) {
  const color = getTrustColor(score);
  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-[#D1D5DB]/60 uppercase tracking-widest mb-4 font-semibold">{label}</p>
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
    </div>
  );
}

function FindingsList({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs text-[#D1D5DB]/40 uppercase tracking-widest mb-2 font-semibold">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-[#D1D5DB] flex items-start gap-2">
            <span className="text-[#14B8A6] shrink-0 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImageAuthenticityResults({ result, t, checkId, showShare, setShowShare, navigate }) {
  const { imageAnalysis, uiLanguage, trustScore, apiWorking } = result;

  if (imageAnalysis?.status === 'error') {
    return (
      <div className="ss-card text-center py-16">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="text-red-400 font-semibold">{t('results.imageAnalysisFailed')}</p>
        <p className="text-[#D1D5DB]/50 text-sm mt-2">{imageAnalysis.message}</p>
        <button onClick={() => navigate('/analyze')} className="ss-btn-primary text-sm px-5 py-2 mt-6">
          ← {t('results.newAnalysis')}
        </button>
      </div>
    );
  }

  const ia = imageAnalysis;
  const verdictColor = getVerdictColor(ia.verdict);
  const metadataLabel =
    ia.metadataIntegrity === 'intact'
      ? t('results.metadataIntact')
      : ia.metadataIntegrity === 'suspicious'
      ? t('results.metadataSuspicious')
      : t('results.metadataStripped');

  const metadataColor =
    ia.metadataIntegrity === 'intact' ? '#14B8A6' : ia.metadataIntegrity === 'suspicious' ? '#f59e0b' : '#ef4444';

  const vf = ia.visualForensics || {};

  return (
    <>
      {apiWorking === false && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-amber-900/20 border border-amber-600/30 rounded-xl px-5 py-4">
          <p className="text-amber-300 text-sm font-semibold">⚠️ {t('results.apiWarningTitle')}</p>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{t('results.imageResultsTitle')}</h1>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-xs border border-[#2A2A2A] text-[#D1D5DB]/60 px-2 py-1 rounded-full">🖼️ image</span>
            {uiLanguage && (
              <span className="text-xs border border-[#5eead4]/30 text-[#5eead4] bg-[#5eead4]/10 px-2 py-1 rounded-full">
                💬 {t('results.response')}: {uiLanguage.toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/analyze')} className="ss-btn-secondary text-sm px-4 py-2">
            ← {t('results.newAnalysis')}
          </button>
          {checkId && (
            <button onClick={() => setShowShare(true)} className="ss-btn-primary text-sm px-4 py-2">
              {t('results.sharePdf')}
            </button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="ss-card flex flex-col items-center justify-center">
          <TrustGauge score={trustScore ?? ia.trustScore ?? 0} label={t('results.authenticityScore')} t={t} />
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="ss-card lg:col-span-2 space-y-4">
          <p className="text-xs text-[#D1D5DB]/60 uppercase tracking-widest font-semibold">{t('results.finalVerdict')}</p>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-3xl font-black px-4 py-2 rounded-xl"
              style={{ color: verdictColor, background: verdictColor + '18' }}>
              {formatImageVerdict(ia.verdict, t)}
            </span>
            <span className="text-lg font-bold text-[#D1D5DB]">
              {ia.confidence}% {t('results.confidence')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <ScoreBar label={t('results.aiGenerated')} value={ia.aiGeneratedProbability} color="#ef4444" />
            <ScoreBar label={t('results.deepfake')} value={ia.deepfakeProbability} color="#dc2626" />
            <ScoreBar label={t('results.manipulationProbability')} value={ia.manipulationProbability} color="#f59e0b" />
            <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3">
              <p className="text-xs text-[#D1D5DB]/40 uppercase tracking-wider">{t('results.metadataIntegrity')}</p>
              <p className="text-lg font-bold mt-1" style={{ color: metadataColor }}>{metadataLabel}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ss-card space-y-5">
        <h2 className="text-base font-bold flex items-center gap-2">
          <span className="text-[#14B8A6]">🔍</span> {t('results.detailedExplanation')}
        </h2>
        <p className="text-sm text-[#D1D5DB] leading-relaxed">{ia.explanation}</p>

        {ia.reasoning?.length > 0 && (
          <FindingsList title={t('results.forensicFindings')} items={ia.reasoning} />
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ss-card space-y-4">
          <h2 className="text-base font-bold">{t('results.metadataAnalysis')}</h2>
          {ia.metadata?.cameraModel && (
            <p className="text-sm text-[#D1D5DB]"><span className="text-[#D1D5DB]/50">Camera:</span> {ia.metadata.cameraModel}</p>
          )}
          {ia.metadata?.creationSoftware && (
            <p className="text-sm text-[#D1D5DB]"><span className="text-[#D1D5DB]/50">Software:</span> {ia.metadata.creationSoftware}</p>
          )}
          {ia.metadata?.aiSoftwareSignatures?.length > 0 && (
            <FindingsList title="AI Software" items={ia.metadata.aiSoftwareSignatures} />
          )}
          <FindingsList title={t('results.metadataAnalysis')} items={ia.metadata?.findings} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ss-card space-y-4">
          <h2 className="text-base font-bold">{t('results.visualForensics')}</h2>
          <FindingsList title={t('results.visualInconsistencies')} items={vf.visualInconsistencies} />
          <FindingsList title={t('results.aiArtifacts')} items={vf.aiArtifacts} />
          <FindingsList title={t('results.deepfakeIndicators')} items={vf.deepfakeIndicators} />
          <FindingsList title={t('results.manipulationIndicators')} items={vf.manipulationIndicators} />
          <FindingsList title="Anatomy Issues" items={vf.anatomyIssues} />
        </motion.div>
      </div>

      {checkId && (
        <p className="text-[#D1D5DB]/30 text-xs text-center pt-2">
          {t('results.checkId')}: <code className="text-[#D1D5DB]/50">{checkId}</code>
        </p>
      )}

      {showShare && checkId && (
        <ShareModal checkId={checkId} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}

function VerificationVectors({ trustScore, sourceCredibility, confidence, evidenceCount, t }) {
  const evidenceCoverage = Math.min(100, (evidenceCount || 0) * 10);
  const vectors = [
    { name: t('results.accuracy'), value: Math.round(trustScore), color: '#14B8A6' },
    { name: t('results.evidenceCoverage'), value: evidenceCoverage, color: '#5eead4' },
    { name: t('results.sourceTrust'), value: Math.round(sourceCredibility), color: '#14B8A6' },
    { name: t('results.confidenceScore'), value: Math.round(confidence || 0), color: '#f59e0b' },
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
              <motion.div className="h-1.5 rounded-full" style={{ background: v.color }}
                initial={{ width: 0 }} animate={{ width: `${v.value}%` }} transition={{ duration: 1 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerdictSummary({ verdict, confidence, summary, reasoning, t }) {
  const color = getVerdictColor(verdict);
  return (
    <div className="bg-[#1A1A1A] border border-[#14B8A6]/20 rounded-xl p-5 flex-1">
      <p className="text-xs text-[#D1D5DB]/60 uppercase tracking-widest mb-4 font-semibold">{t('results.verdictSummary')}</p>
      <div className="mb-4">
        <span className="text-3xl font-black px-3 py-1 rounded-lg inline-block" style={{ color, background: color + '18' }}>
          {formatTextVerdict(verdict, t)}
        </span>
        {typeof confidence === 'number' && (
          <span className="ml-3 text-sm font-semibold text-[#D1D5DB]/70">{confidence}% {t('results.confidence')}</span>
        )}
      </div>
      {summary && <p className="text-sm text-white font-medium leading-relaxed mb-2">{summary}</p>}
      <p className="text-sm text-[#D1D5DB] leading-relaxed">{reasoning || '—'}</p>
    </div>
  );
}

function SourceCard({ source, t }) {
  const supportColor = source.supportsClaim === true ? '#14B8A6' : source.supportsClaim === false ? '#ef4444' : '#6b7280';
  const supportLabel = source.supportsClaim === true ? t('results.supportsClaim')
    : source.supportsClaim === false ? t('results.contradictsClaim') : t('results.unverified');
  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer"
      className="block bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#14B8A6]/40 rounded-lg p-3 transition-colors">
      <p className="text-sm font-semibold text-[#14B8A6] line-clamp-2">{source.title || source.url}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#D1D5DB]/50">
        {source.publisher && <span>{t('results.publisher')}: {source.publisher || source.source}</span>}
        {source.publishedAt && <span>{t('results.published')}: {formatDate(source.publishedAt)}</span>}
      </div>
      <span className="inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ background: supportColor + '20', color: supportColor }}>{supportLabel}</span>
    </a>
  );
}

function ClaimCard({ claim, index, t }) {
  const [open, setOpen] = useState(false);
  const color = getVerdictColor(claim.verdict);
  const hasConf = typeof claim.confidence === 'number';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
      className="border border-[#2A2A2A] rounded-xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-[#1A1A1A] transition-colors">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="mt-0.5 text-base shrink-0">{getTextVerdictIcon(claim.verdict)}</span>
          <span className="text-[#D1D5DB] text-sm leading-relaxed">"{claim.text}"</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: color + '20', color }}>
            {formatTextVerdict(claim.verdict, t)}
          </span>
          <span className="text-[#D1D5DB]/30 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-[#2A2A2A] bg-[#0B0B0B] grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#2A2A2A]">
              <div className="p-4">
                {claim.summary && <p className="text-sm text-white font-medium mb-2">{claim.summary}</p>}
                {hasConf && <p className="text-xs mb-2" style={{ color }}>{claim.confidence}% {t('results.confidence')}</p>}
                <p className="text-sm text-[#D1D5DB]">{claim.reasoning || '—'}</p>
              </div>
              <div className="p-4 space-y-2">
                {claim.sources?.length > 0
                  ? claim.sources.slice(0, 6).map((src, i) => <SourceCard key={i} source={src} t={t} />)
                  : <p className="text-[#D1D5DB]/30 text-xs">{t('results.noSources')}</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TextFactCheckResults({ result, t, checkId, showShare, setShowShare, navigate }) {
  const {
    inputType, trustScore, sourceCredibility, uiLanguage, claims = [], apiWorking,
    verdict, confidence, summary, reasoning, evidenceCount,
  } = result;

  const displayVerdict = claims.length === 1 ? claims[0].verdict : verdict;
  const displayConfidence = claims.length === 1 ? claims[0].confidence : confidence;
  const displaySummary = claims.length === 1 ? claims[0].summary : summary;
  const displayReasoning = claims.length === 1 ? claims[0].reasoning : reasoning;

  const trueCount = claims.filter(c => c.verdict === 'TRUE').length;
  const falseCount = claims.filter(c => c.verdict === 'FALSE').length;
  const misleadingCount = claims.filter(c => c.verdict === 'MISLEADING').length;
  const partialCount = claims.filter(c => c.verdict === 'PARTIALLY_TRUE').length;
  const unverifiedCount = claims.filter(c => c.verdict === 'UNVERIFIED').length;

  return (
    <>
      {apiWorking === false && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-amber-900/20 border border-amber-600/30 rounded-xl px-5 py-4">
          <p className="text-amber-300 text-sm font-semibold">⚠️ {t('results.apiWarningTitle')}</p>
          <p className="text-amber-400/70 text-xs mt-1">{t('results.apiWarningDesc')}</p>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{t('results.title')}</h1>
          <div className="flex gap-2 mt-2 flex-wrap">
            {inputType && (
              <span className="text-xs border border-[#2A2A2A] text-[#D1D5DB]/60 px-2 py-1 rounded-full">
                {inputType === 'text' ? '📝' : '🔗'} {inputType}
              </span>
            )}
            {uiLanguage && (
              <span className="text-xs border border-[#5eead4]/30 text-[#5eead4] bg-[#5eead4]/10 px-2 py-1 rounded-full">
                💬 {t('results.response')}: {uiLanguage.toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/analyze')} className="ss-btn-secondary text-sm px-4 py-2">← {t('results.newAnalysis')}</button>
          {checkId && (
            <button onClick={() => setShowShare(true)} className="ss-btn-primary text-sm px-4 py-2">{t('results.sharePdf')}</button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="ss-card flex flex-col items-center justify-center">
          <TrustGauge score={trustScore} label={t('results.trustScore')} t={t} />
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="ss-card">
          <VerificationVectors trustScore={trustScore} sourceCredibility={sourceCredibility}
            confidence={displayConfidence} evidenceCount={evidenceCount} t={t} />
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <VerdictSummary verdict={displayVerdict || 'UNVERIFIED'} confidence={displayConfidence}
            summary={displaySummary} reasoning={displayReasoning} t={t} />
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base font-bold flex items-center gap-2">
            <span className="text-[#14B8A6]">📋</span> {t('results.evidenceVerification')}
          </h2>
          <div className="flex gap-2 flex-wrap">
            {trueCount > 0 && <span className="text-xs bg-[#14B8A6]/10 border border-[#14B8A6]/30 text-[#14B8A6] px-2 py-1 rounded-full font-bold">{trueCount} {t('results.trueCount')}</span>}
            {falseCount > 0 && <span className="text-xs bg-red-900/30 border border-red-800 text-red-400 px-2 py-1 rounded-full font-bold">{falseCount} {t('results.falseCount')}</span>}
            {misleadingCount > 0 && <span className="text-xs bg-orange-900/30 border border-orange-800 text-orange-400 px-2 py-1 rounded-full font-bold">{misleadingCount} {t('results.misleadingCount')}</span>}
            {partialCount > 0 && <span className="text-xs bg-amber-900/30 border border-amber-700 text-amber-400 px-2 py-1 rounded-full font-bold">{partialCount} {t('results.partialCount')}</span>}
            {unverifiedCount > 0 && <span className="text-xs bg-[#1A1A1A] border border-[#2A2A2A] text-[#D1D5DB]/50 px-2 py-1 rounded-full">{unverifiedCount} {t('results.unverified')}</span>}
          </div>
        </div>
        {claims.length === 0 ? (
          <div className="text-[#D1D5DB]/40 text-sm text-center py-10 border border-[#2A2A2A] rounded-xl">{t('results.noClaims')}</div>
        ) : (
          <div className="space-y-3">{claims.map((claim, i) => <ClaimCard key={i} claim={claim} index={i} t={t} />)}</div>
        )}
      </motion.div>

      {checkId && (
        <p className="text-[#D1D5DB]/30 text-xs text-center pt-2">
          {t('results.checkId')}: <code className="text-[#D1D5DB]/50">{checkId}</code>
          {' · '}
          <a href={`/report/${checkId}`} target="_blank" rel="noopener noreferrer" className="text-[#14B8A6] hover:underline">{t('results.publicReport')}</a>
        </p>
      )}

      {showShare && checkId && <ShareModal checkId={checkId} onClose={() => setShowShare(false)} />}
    </>
  );
}

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

  const isImageMode = result.inputType === 'image' || result.analysisMode === 'image_authenticity';
  const { checkId } = result;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="flex items-center justify-between px-8 py-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <ShieldLogo size={24} />
          <span className="font-bold text-base tracking-tight"><span className="text-[#14B8A6]">Satya</span>Scan</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-[#D1D5DB]/60">
          <button onClick={() => navigate('/')} className="hover:text-white transition-colors">{t('nav.dashboard')}</button>
          <button onClick={() => navigate('/analyze')} className="hover:text-white transition-colors text-[#14B8A6] border-b border-[#14B8A6] pb-0.5">{t('results.newAnalysis')}</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        {isImageMode ? (
          <ImageAuthenticityResults result={result} t={t} checkId={checkId}
            showShare={showShare} setShowShare={setShowShare} navigate={navigate} />
        ) : (
          <TextFactCheckResults result={result} t={t} checkId={checkId}
            showShare={showShare} setShowShare={setShowShare} navigate={navigate} />
        )}
      </div>
    </div>
  );
}
