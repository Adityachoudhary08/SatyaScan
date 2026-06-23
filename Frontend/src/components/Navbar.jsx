import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation, useLanguage } from '../context/LanguageContext';

// Inline SVG shield logo with teal accent
function ShieldLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shieldGradNav" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#5eead4" />
        </linearGradient>
        <filter id="glowNav">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path
        d="M50 6 L88 22 L88 54 C88 72 70 88 50 95 C30 88 12 72 12 54 L12 22 Z"
        fill="url(#shieldGradNav)"
        opacity="0.15"
        stroke="url(#shieldGradNav)"
        strokeWidth="2.5"
      />
      <text
        x="50" y="66"
        textAnchor="middle"
        fontSize="44"
        fontWeight="800"
        fontFamily="'Inter', 'Arial', sans-serif"
        fill="url(#shieldGradNav)"
        filter="url(#glowNav)"
        letterSpacing="-2"
      >
        S
      </text>
    </svg>
  );
}

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const { t, uiLang, setUiLang } = useTranslation();
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const toggleUiLang = () => {
    setUiLang(uiLang === 'en' ? 'hi' : 'en');
  };

  return (
    <nav className="nav-blur sticky top-0 z-50 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <ShieldLogo size={28} />
          <span className="font-bold text-lg tracking-tight text-white">
            <span className="text-[#14B8A6]">Satya</span>Scan
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-5 text-sm">
          <Link
            to="/analyze"
            className="text-[#D1D5DB] hover:text-[#14B8A6] transition-colors font-medium"
          >
            {t('nav.analyze')}
          </Link>
          {isLoggedIn && (
            <Link
              to="/history"
              className="text-[#D1D5DB] hover:text-[#14B8A6] transition-colors font-medium"
            >
              {t('nav.history')}
            </Link>
          )}

          {/* UI Language Toggle (EN/HI) */}
          <button
            onClick={toggleUiLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2A2A2A] text-[#D1D5DB] hover:border-[#14B8A6] hover:text-[#14B8A6] transition-colors text-xs font-bold uppercase tracking-wider"
            title={t('nav.language')}
          >
            <span>{uiLang === 'en' ? '🇮🇳' : '🇬🇧'}</span>
            <span>{uiLang === 'en' ? 'HI' : 'EN'}</span>
          </button>

          {/* Auth */}
          {isLoggedIn ? (
            <>
              <span className="text-[#D1D5DB] text-sm opacity-70">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm border border-red-800 text-red-400 hover:bg-red-800/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[#D1D5DB] hover:text-[#14B8A6] transition-colors font-medium"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/signup"
                className="ss-btn-primary px-4 py-1.5 text-xs"
              >
                {t('nav.signup')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#D1D5DB] hover:text-white p-2"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 pb-4 border-t border-[#2A2A2A] pt-4 space-y-3 px-1">
          <Link to="/analyze" className="block text-[#D1D5DB] hover:text-[#14B8A6] py-1.5 transition-colors" onClick={() => setMenuOpen(false)}>
            {t('nav.analyze')}
          </Link>
          {isLoggedIn && (
            <Link to="/history" className="block text-[#D1D5DB] hover:text-[#14B8A6] py-1.5 transition-colors" onClick={() => setMenuOpen(false)}>
              {t('nav.history')}
            </Link>
          )}
          <button
            onClick={toggleUiLang}
            className="block text-[#D1D5DB] hover:text-[#14B8A6] py-1.5 text-sm font-bold transition-colors"
          >
            {uiLang === 'en' ? '🇮🇳 Switch to Hindi' : '🇬🇧 English पर जाएं'}
          </button>
          {isLoggedIn ? (
            <button onClick={handleLogout} className="block text-red-400 hover:text-red-300 py-1.5 transition-colors text-sm">
              {t('nav.logout')}
            </button>
          ) : (
            <div className="flex gap-3 pt-1">
              <Link to="/login" className="ss-btn-secondary text-xs px-4 py-2" onClick={() => setMenuOpen(false)}>
                {t('nav.login')}
              </Link>
              <Link to="/signup" className="ss-btn-primary text-xs px-4 py-2" onClick={() => setMenuOpen(false)}>
                {t('nav.signup')}
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
