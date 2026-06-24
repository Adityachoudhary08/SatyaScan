import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { signup } from '../api/api';
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

const slideLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};

// ── Shield Logo ─────────────────────────────────────────────────────────────
function ShieldLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="slgSignup" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#5eead4" />
        </linearGradient>
        <filter id="glowSignup">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M50 6 L88 22 L88 54 C88 72 70 88 50 95 C30 88 12 72 12 54 L12 22 Z"
        fill="url(#slgSignup)" opacity="0.2" stroke="url(#slgSignup)" strokeWidth="2" />
      <text x="50" y="66" textAnchor="middle" fontSize="44" fontWeight="800"
        fontFamily="Inter,Arial,sans-serif" fill="url(#slgSignup)" filter="url(#glowSignup)">S</text>
    </svg>
  );
}

// ── Hexagonal grid SVG (decorative) ─────────────────────────────────────────
function HexGrid() {
  return (
    <div className="rotate-slow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]" style={{ width: 300, height: 300 }}>
      <svg width="300" height="300" viewBox="0 0 300 300" fill="none">
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <circle key={angle} cx="150" cy="150" r={80 + angle / 10}
            stroke="#14B8A6" strokeWidth="0.5" strokeDasharray="3 5" />
        ))}
        <polygon points="150,70 210,110 210,190 150,230 90,190 90,110"
          stroke="#14B8A6" strokeWidth="0.5" fill="none" />
      </svg>
    </div>
  );
}

// ── Password strength calculator ────────────────────────────────────────────
function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', class: '' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 20, label: 'Weak', class: 'strength-weak' };
  if (score === 2) return { level: 40, label: 'Fair', class: 'strength-fair' };
  if (score === 3) return { level: 70, label: 'Good', class: 'strength-good' };
  return { level: 100, label: 'Strong', class: 'strength-strong' };
}

// ── Feature items (honest, no inflated stats) ───────────────────────────────
const FEATURES = [
  { icon: '⚡', text: 'Instant Claim Verification' },
  { icon: '🛡️', text: 'AI Content Detection' },
  { icon: '🌐', text: 'Multi-Language Support' },
];

export default function SignupPage() {
  const { t } = useTranslation();
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pwStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError(t('signup.passwordShort'));
      return;
    }
    setLoading(true);
    try {
      const { data } = await signup(form.name, form.email, form.password);
      saveAuth(data.token, data.user);
      navigate('/analyze');
    } catch (err) {
      setError(err.response?.data?.message || t('signup.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex">

      {/* ── Left Form Panel ── */}
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
            {t('signup.title')}
          </motion.h1>
          <motion.p variants={fadeUp} className="text-[#D1D5DB]/70 mb-8">
            {t('signup.subtitle')}
          </motion.p>

          {/* Error with AnimatePresence */}
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

          {/* Form with glassmorphism */}
          <motion.div variants={slideLeft} className="glass-card glass-card-glow p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div variants={fadeUp}>
                <label className="ss-label">{t('signup.name')}</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="ss-input-animated"
                  placeholder="Your full name"
                />
              </motion.div>

              <motion.div variants={fadeUp}>
                <label className="ss-label">{t('signup.email')}</label>
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
                <label className="ss-label">{t('signup.password')}</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="ss-input-animated"
                  placeholder={t('signup.passwordHint')}
                />
                {/* Animated password strength bar */}
                <div className="mt-2.5">
                  <div className="h-1.5 rounded-full bg-[#2A2A2A] overflow-hidden">
                    <motion.div
                      className={`h-1.5 rounded-full ${pwStrength.class}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pwStrength.level}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    {form.password && (
                      <motion.p
                        key={pwStrength.label}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs mt-1.5"
                        style={{ color: pwStrength.level >= 70 ? '#14B8A6' : pwStrength.level >= 40 ? '#eab308' : '#ef4444' }}
                      >
                        {pwStrength.label}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
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
                      {t('signup.loading')}
                    </span>
                  ) : t('signup.submit')}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>

          <motion.p variants={fadeUp} className="text-[#D1D5DB]/60 text-sm mt-6 text-center">
            {t('signup.hasAccount')}{' '}
            <Link to="/login" className="text-[#14B8A6] hover:underline font-semibold">
              {t('signup.loginLink')}
            </Link>
          </motion.p>
        </div>
      </motion.div>

      {/* ── Right Branding Panel ── */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0f0f0f 0%, #141414 50%, #0f0f0f 100%)' }}
      >
        {/* Background glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(20,184,166,0.08) 0%, transparent 70%)'
        }} />

        {/* Hex grid decoration */}
        <HexGrid />

        {/* Floating orbs */}
        <div className="floating-orb absolute top-[20%] right-[20%] w-28 h-28 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)' }} />
        <div className="floating-orb-slow absolute bottom-[25%] left-[15%] w-20 h-20 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(94,234,212,0.1) 0%, transparent 70%)' }} />
        <div className="floating-orb-fast absolute top-[55%] right-[10%] w-14 h-14 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)' }} />

        {/* Content */}
        <div className="relative z-10 text-center px-12">
          <motion.div variants={scaleIn} className="flex justify-center mb-6">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ShieldLogo size={80} />
            </motion.div>
          </motion.div>

          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-white mb-4">
            Join <span className="text-[#14B8A6]">Satya</span>Scan
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[#D1D5DB]/80 text-lg leading-relaxed max-w-xs mx-auto">
            Start fighting misinformation today with AI-powered verification.
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
    </div>
  );
}
