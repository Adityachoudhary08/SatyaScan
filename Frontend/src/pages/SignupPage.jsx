import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signup } from '../api/api';
import { useTranslation } from '../context/LanguageContext';

// Shield logo with teal
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

export default function SignupPage() {
  const { t } = useTranslation();
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-[#1A1A1A] border-r border-[#2A2A2A] relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(20,184,166,0.1) 0%, transparent 70%)' }} />
        <div className="relative z-10 text-center px-12">
          <div className="flex justify-center mb-6">
            <ShieldLogo size={72} />
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4">
            Join <span className="text-[#14B8A6]">Satya</span>Scan
          </h2>
          <p className="text-[#D1D5DB] text-lg leading-relaxed max-w-xs mx-auto">
            Start fighting misinformation today with AI-powered verification.
          </p>
          <div className="mt-10 flex flex-col gap-3 max-w-xs mx-auto">
            {['Free to get started', '1M+ claims verified', 'Supports 120+ languages'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm text-[#D1D5DB]">
                <span className="w-5 h-5 rounded-full bg-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6] text-xs">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <ShieldLogo size={32} />
            <span className="font-bold text-xl"><span className="text-[#14B8A6]">Satya</span>Scan</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2">{t('signup.title')}</h1>
          <p className="text-[#D1D5DB] mb-8">{t('signup.subtitle')}</p>

          {error && (
            <div className="bg-red-900/20 border border-red-700/50 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="ss-label">{t('signup.name')}</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="ss-input"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="ss-label">{t('signup.email')}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="ss-input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="ss-label">{t('signup.password')}</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="ss-input"
                placeholder={t('signup.passwordHint')}
              />
              <p className="text-xs text-[#D1D5DB]/40 mt-1.5">{t('signup.passwordHint')}</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="ss-btn-primary w-full py-3 text-sm"
            >
              {loading ? t('signup.loading') : t('signup.submit')}
            </button>
          </form>

          <p className="text-[#D1D5DB] text-sm mt-6 text-center">
            {t('signup.hasAccount')}{' '}
            <Link to="/login" className="text-[#14B8A6] hover:underline font-semibold">
              {t('signup.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
