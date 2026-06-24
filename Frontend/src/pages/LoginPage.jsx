import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/api';
import { useTranslation } from '../context/LanguageContext';

// ── Animation variants ──────────────────────────────────────────────────────
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};

const slideRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};

// ── Shield Logo ─────────────────────────────────────────────────────────────
function ShieldLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="slgLogin" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#5eead4" />
        </linearGradient>
        <filter id="glowLogin">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M50 6 L88 22 L88 54 C88 72 70 88 50 95 C30 88 12 72 12 54 L12 22 Z"
        fill="url(#slgLogin)" opacity="0.2" stroke="url(#slgLogin)" strokeWidth="2" />
      <text x="50" y="66" textAnchor="middle" fontSize="44" fontWeight="800"
        fontFamily="Inter,Arial,sans-serif" fill="url(#slgLogin)" filter="url(#glowLogin)">S</text>
    </svg>
  );
}

// ── Trust Ring SVG ──────────────────────────────────────────────────────────
function TrustRing() {
  return (
    <div className="rotate-slow" style={{ width: 240, height: 240 }}>
      <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
        <circle cx="120" cy="120" r="110" stroke="url(#ringGrad)" strokeWidth="1" strokeDasharray="8 6" opacity="0.3" />
        <circle cx="120" cy="120" r="95" stroke="url(#ringGrad)" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.15" />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="240" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ── Feature items (honest, no inflated stats) ───────────────────────────────
const FEATURES = [
  { icon: '🔍', text: 'AI-Powered Claim Analysis' },
  { icon: '📰', text: 'Multi-Source Cross-Referencing' },
  { icon: '📊', text: 'Detailed Trust Reports' },
];

export default function LoginPage() {
  const { t } = useTranslation();
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await login(form.email, form.password);
      saveAuth(data.token, data.user);
      navigate('/analyze');
    } catch (err) {
      setError(err.response?.data?.message || t('login.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex">

      {/* ── Left Branding Panel ── */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0f0f0f 0%, #141414 50%, #0f0f0f 100%)' }}
      >
        {/* Background glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(20,184,166,0.08) 0%, transparent 70%)'
        }} />

        {/* Floating orbs */}
        <div className="floating-orb absolute top-[15%] left-[20%] w-24 h-24 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)' }} />
        <div className="floating-orb-slow absolute bottom-[20%] right-[15%] w-32 h-32 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(94,234,212,0.08) 0%, transparent 70%)' }} />
        <div className="floating-orb-fast absolute top-[60%] left-[10%] w-16 h-16 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)' }} />

        {/* Content */}
        <div className="relative z-10 text-center px-12">
          {/* Trust ring behind shield */}
          <motion.div variants={fadeIn} className="flex justify-center mb-6 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <TrustRing />
            </div>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ShieldLogo size={80} />
            </motion.div>
          </motion.div>

          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-white mb-4">
            <span className="text-[#14B8A6]">Satya</span>Scan
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[#D1D5DB]/80 text-lg leading-relaxed max-w-xs mx-auto">
            Next-generation AI verification for the truth-first era.
          </motion.p>

          {/* Feature highlights (honest) */}
          <motion.div variants={stagger} className="mt-10 flex flex-col gap-3.5 max-w-xs mx-auto">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.text} variants={fadeUp} custom={i}
                className="flex items-center gap-3 text-sm text-[#D1D5DB]/90"
              >
                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                  style={{
                    background: 'linear-gradient(135deg, rgba(20,184,166,0.15) 0%, rgba(94,234,212,0.06) 100%)',
                    border: '1px solid rgba(20,184,166,0.2)',
                  }}>
                  {f.icon}
                </span>
                {f.text}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── Right Form Panel ── */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="flex-1 flex items-center justify-center px-6 py-12"
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <motion.div variants={fadeIn} className="lg:hidden flex items-center gap-3 mb-8">
            <ShieldLogo size={32} />
            <span className="font-bold text-xl"><span className="text-[#14B8A6]">Satya</span>Scan</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-3xl font-extrabold text-white mb-2">
            {t('login.title')}
          </motion.h1>
          <motion.p variants={fadeUp} className="text-[#D1D5DB]/70 mb-8">
            {t('login.subtitle')}
          </motion.p>

          {/* Error message with AnimatePresence */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-red-900/20 border border-red-700/50 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2 overflow-hidden"
              >
                <span>⚠️</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form with glassmorphism card */}
          <motion.div variants={slideRight} className="glass-card glass-card-glow p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div variants={fadeUp}>
                <label className="ss-label">{t('login.email')}</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="ss-input-animated"
                  placeholder="you@example.com"
                />
              </motion.div>

              <motion.div variants={fadeUp}>
                <div className="flex items-center justify-between mb-2">
                  <label className="ss-label mb-0">{t('login.password')}</label>
                  <a href="#" className="text-xs text-[#14B8A6] hover:underline">{t('login.forgotPassword')}</a>
                </div>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="ss-input-animated"
                  placeholder="••••••••"
                />
              </motion.div>

              <motion.div variants={fadeUp}>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="shimmer-btn w-full py-3 text-sm font-bold text-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                      />
                      {t('login.loading')}
                    </span>
                  ) : t('login.submit')}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>

          <motion.p variants={fadeUp} className="text-[#D1D5DB]/60 text-sm mt-6 text-center">
            {t('login.noAccount')}{' '}
            <Link to="/signup" className="text-[#14B8A6] hover:underline font-semibold">
              {t('login.signupLink')}
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
