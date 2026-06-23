import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/api';
import { useTranslation } from '../context/LanguageContext';

// Shield logo with teal
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
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-[#1A1A1A] border-r border-[#2A2A2A] relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(20,184,166,0.1) 0%, transparent 70%)' }} />
        <div className="relative z-10 text-center px-12">
          <div className="flex justify-center mb-6">
            <ShieldLogo size={72} />
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4">
            <span className="text-[#14B8A6]">Satya</span>Scan
          </h2>
          <p className="text-[#D1D5DB] text-lg leading-relaxed max-w-xs mx-auto">
            Next-generation AI verification for the truth-first era.
          </p>
          <div className="mt-10 flex flex-col gap-3 max-w-xs mx-auto">
            {['99.4% detection accuracy', '50k+ verified sources', 'End-to-end encrypted'].map((f) => (
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

          <h1 className="text-3xl font-extrabold text-white mb-2">{t('login.title')}</h1>
          <p className="text-[#D1D5DB] mb-8">{t('login.subtitle')}</p>

          {error && (
            <div className="bg-red-900/20 border border-red-700/50 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="ss-label">{t('login.email')}</label>
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
              <div className="flex items-center justify-between mb-2">
                <label className="ss-label mb-0">{t('login.password')}</label>
                <a href="#" className="text-xs text-[#14B8A6] hover:underline">{t('login.forgotPassword')}</a>
              </div>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="ss-input"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="ss-btn-primary w-full py-3 text-sm"
            >
              {loading ? t('login.loading') : t('login.submit')}
            </button>
          </form>

          <p className="text-[#D1D5DB] text-sm mt-6 text-center">
            {t('login.noAccount')}{' '}
            <Link to="/signup" className="text-[#14B8A6] hover:underline font-semibold">
              {t('login.signupLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
