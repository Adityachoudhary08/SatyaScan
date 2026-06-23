import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useTranslation, useLanguage } from '../context/LanguageContext';

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.5, delay: i * 0.12, ease: 'easeOut' },
  }),
};

// ── Animated section wrapper ───────────────────────────────────────────────────
function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} className={className}>
      {children}
    </motion.div>
  );
}

// Inline shield logo with teal
function ShieldLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="slgLanding" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#5eead4" />
        </linearGradient>
      </defs>
      <path d="M50 6 L88 22 L88 54 C88 72 70 88 50 95 C30 88 12 72 12 54 L12 22 Z"
        fill="url(#slgLanding)" opacity="0.15" stroke="url(#slgLanding)" strokeWidth="2.5" />
      <text x="50" y="66" textAnchor="middle" fontSize="44" fontWeight="800"
        fontFamily="Inter,Arial,sans-serif" fill="url(#slgLanding)">S</text>
    </svg>
  );
}

const FEATURE_ICONS = ['🔍', '🤖', '✅', '🌐'];
const STEP_NUMS = ['01', '02', '03', '04'];
const STATS_DATA = [
  { value: '1M+', key: 'claims', color: 'from-[#14B8A6] to-[#5eead4]' },
  { value: '50k+', key: 'sources', color: 'from-emerald-400 to-green-400' },
  { value: '<2s', key: 'speed', color: 'from-amber-400 to-yellow-400' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { uiLang, setUiLang } = useLanguage();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate('/analyze', { state: { prefill: searchValue } });
  };

  const goAnalyze = () => navigate('/analyze');

  const FEATURES = [
    { icon: FEATURE_ICONS[0], title: t('landing.features.f1Title'), desc: t('landing.features.f1Desc') },
    { icon: FEATURE_ICONS[1], title: t('landing.features.f2Title'), desc: t('landing.features.f2Desc') },
    { icon: FEATURE_ICONS[2], title: t('landing.features.f3Title'), desc: t('landing.features.f3Desc') },
    { icon: FEATURE_ICONS[3], title: t('landing.features.f4Title'), desc: t('landing.features.f4Desc') },
  ];

  const STEPS = [
    { step: STEP_NUMS[0], title: t('landing.steps.s1Title'), desc: t('landing.steps.s1Desc') },
    { step: STEP_NUMS[1], title: t('landing.steps.s2Title'), desc: t('landing.steps.s2Desc') },
    { step: STEP_NUMS[2], title: t('landing.steps.s3Title'), desc: t('landing.steps.s3Desc') },
    { step: STEP_NUMS[3], title: t('landing.steps.s4Title'), desc: t('landing.steps.s4Desc') },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">

      {/* ── Navbar ── */}
      <nav className="nav-blur fixed top-0 left-0 right-0 z-50 px-6 py-3 flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <span className="font-bold text-xl tracking-tight cursor-pointer flex items-center gap-2.5" onClick={() => navigate('/')}>
            <ShieldLogo size={26} />
            <span><span className="text-[#14B8A6]">Satya</span>Scan</span>
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
          className="flex items-center gap-3">

          {/* Search bar → goes to /analyze */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D1D5DB]/40 text-sm">🔍</span>
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => navigate('/analyze')}
                type="text"
                placeholder={t('landing.searchPlaceholder')}
                className="pl-9 pr-4 py-1.5 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] text-white placeholder-[#D1D5DB]/30 text-sm w-52 outline-none focus:border-[#14B8A6] transition-colors"
              />
            </div>
          </form>

          {/* UI Language toggle */}
          <button
            onClick={() => setUiLang(uiLang === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#2A2A2A] text-[#D1D5DB] hover:border-[#14B8A6] hover:text-[#14B8A6] transition-colors text-xs font-bold"
          >
            {uiLang === 'en' ? '🇮🇳 HI' : '🇬🇧 EN'}
          </button>

          <button
            onClick={goAnalyze}
            className="ss-btn-primary text-sm px-4 py-1.5"
          >
            {t('landing.hero.cta')} →
          </button>
        </motion.div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-gradient grid-pattern pt-32 pb-20 px-6 max-w-6xl mx-auto relative">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={0}>
              <span className="ss-badge mb-6 inline-flex">
                <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] accent-pulse" />
                {t('landing.badge')}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
            >
              {t('landing.hero.title1')}
              <span className="block gradient-text">
                {t('landing.hero.title2')}
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-lg text-[#D1D5DB] mb-8 max-w-lg mx-auto lg:mx-0"
            >
              {t('landing.hero.subtitle')}
            </motion.p>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-wrap gap-4 justify-center lg:justify-start"
            >
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                onClick={goAnalyze}
                className="ss-btn-primary px-8 py-3 text-sm shadow-lg shadow-[#14B8A6]/20"
              >
                {t('landing.hero.cta')} →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                onClick={goAnalyze}
                className="ss-btn-secondary px-8 py-3 text-sm"
              >
                {t('landing.hero.ctaSecondary')}
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={4}
              className="flex gap-6 mt-8 justify-center lg:justify-start flex-wrap"
            >
              {[t('landing.trust.soc2'), t('landing.trust.encrypted'), t('landing.trust.gdpr')].map((tag) => (
                <span key={tag} className="text-xs flex items-center gap-1.5 text-[#D1D5DB]">
                  <span className="text-[#14B8A6]">✓</span> {tag}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Hero visual cards */}
          <div className="flex-1 relative w-full max-w-sm mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="relative"
            >
              {/* Floating verified card */}
              <motion.div
                animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 right-0 flex items-center gap-3 px-4 py-3 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] shadow-xl"
              >
                <span className="text-[#14B8A6] text-xl">✅</span>
                <div>
                  <p className="text-xs text-[#D1D5DB]/60 uppercase tracking-wider">{t('landing.verified')}</p>
                  <p className="text-sm font-bold text-white">BBC News API</p>
                </div>
              </motion.div>

              {/* Main card */}
              <div className="mt-12 rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-auto text-xs text-[#D1D5DB]/50">{t('landing.analysisProgress')}…</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: t('landing.claimExtraction'), status: '✓', color: 'bg-[#14B8A6]', w: 'w-full' },
                    { label: t('landing.sourceMatching'), status: '✓', color: 'bg-[#14B8A6]', w: 'w-4/5' },
                    { label: t('landing.aiDetection'), status: '…', color: 'bg-[#5eead4]', w: 'w-3/5' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#D1D5DB]/60">{item.label}</span>
                        <span className="text-[#14B8A6]">{item.status}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#2A2A2A]">
                        <motion.div
                          className={`h-1.5 rounded-full ${item.color}`}
                          initial={{ width: 0 }} animate={{ width: item.w }}
                          transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating AI confidence card */}
              <motion.div
                animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-4 left-0 flex items-center gap-3 px-4 py-3 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] shadow-xl"
              >
                <span className="text-[#5eead4] text-xl">🤖</span>
                <div>
                  <p className="text-xs text-[#D1D5DB]/60 uppercase tracking-wider">{t('landing.aiConfidence')}</p>
                  <p className="text-sm font-bold text-white">99.8% {t('landing.genuine')}</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <AnimatedSection className="py-16 px-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {STATS_DATA.map((s, i) => (
            <motion.div
              key={s.key} variants={scaleIn} custom={i}
              className="ss-card text-center py-8"
            >
              <p className={`text-4xl font-extrabold bg-gradient-to-r ${s.color} bg-clip-text text-transparent mb-2`}>
                {s.value}
              </p>
              <p className="text-xs uppercase tracking-widest text-[#D1D5DB]">{t(`landing.stats.${s.key}`)}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── Features ── */}
      <AnimatedSection className="py-20 px-6 max-w-6xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-12">
          <h2 className="text-4xl font-extrabold mb-3">
            {t('landing.features.title')}{' '}
            <span className="gradient-text">{t('landing.features.titleAccent')}</span>
          </h2>
          <p className="text-[#D1D5DB] max-w-xl mx-auto">{t('landing.features.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title} variants={scaleIn} custom={i}
              whileHover={{ y: -4, borderColor: 'rgba(20,184,166,0.4)' }}
              className="ss-card cursor-pointer transition-all duration-200"
            >
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-lg font-bold mb-2 text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-[#D1D5DB]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── How It Works ── */}
      <AnimatedSection className="py-20 px-6 max-w-5xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-12">
          <h2 className="text-4xl font-extrabold mb-3">{t('landing.steps.title')}</h2>
          <p className="text-[#D1D5DB]">{t('landing.steps.subtitle')}</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step} variants={fadeUp} custom={i}
              className="ss-card relative"
            >
              <p className="text-4xl font-black text-[#14B8A6]/20 mb-3">{s.step}</p>
              <h3 className="font-bold text-base mb-1 text-white">{s.title}</h3>
              <p className="text-sm text-[#D1D5DB]">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-[#14B8A6]/50 text-xl z-10">→</div>
              )}
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── CTA ── */}
      <AnimatedSection className="py-20 px-6">
        <motion.div
          variants={scaleIn}
          className="max-w-2xl mx-auto text-center bg-[#1A1A1A] border border-[#14B8A6]/20 rounded-3xl p-12 shadow-2xl"
          style={{ boxShadow: '0 0 60px rgba(20,184,166,0.08)' }}
        >
          <h2 className="text-4xl font-extrabold text-white mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="text-[#D1D5DB] mb-8">{t('landing.cta.subtitle')}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={goAnalyze}
              className="ss-btn-primary px-8 py-3 shadow-lg shadow-[#14B8A6]/20"
            >
              {t('landing.cta.primary')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={goAnalyze}
              className="ss-btn-secondary px-8 py-3"
            >
              {t('landing.cta.secondary')}
            </motion.button>
          </div>
        </motion.div>
      </AnimatedSection>

      {/* ── Footer ── */}
      <footer className="border-t border-[#2A2A2A] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-lg">
              <span className="text-[#14B8A6]">Satya</span>Scan
            </p>
            <p className="text-xs text-[#D1D5DB]/50">{t('landing.footer.rights')}</p>
          </div>
          <div className="flex gap-6 text-sm text-[#D1D5DB]/60">
            {[
              t('landing.footer.about'),
              t('landing.footer.features'),
              t('landing.footer.github'),
              t('landing.footer.contact'),
            ].map((l) => (
              <a key={l} href="#" className="hover:text-[#14B8A6] transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
