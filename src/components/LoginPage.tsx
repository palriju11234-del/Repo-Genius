import React, { useEffect, useState } from 'react';

const API_BASE = window.location.port === '8000'
  ? ''
  : `${window.location.protocol}//${window.location.hostname}:8000`;

/* ── Brand icons as inline SVGs ─────────────────────────────────────────── */

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

/* ── Animated background particles ──────────────────────────────────────── */

const FloatingOrb = ({
  size, x, y, delay, duration, color
}: { size: number; x: string; y: string; delay: string; duration: string; color: string }) => (
  <div
    className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
    style={{
      width: size,
      height: size,
      left: x,
      top: y,
      background: color,
      animation: `float ${duration} ease-in-out ${delay} infinite alternate`,
    }}
  />
);

/* ── Main Login Page ─────────────────────────────────────────────────────── */

export const LoginPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hoveredProvider, setHoveredProvider] = useState<'google' | 'github' | null>(null);

  // Parse ?error= from URL after failed OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
      const messages: Record<string, string> = {
        access_denied: 'Access was denied. Please try again.',
        no_code: 'Authentication failed — no code returned. Please try again.',
        state_mismatch: 'Security check failed. Please try again.',
        token_exchange_failed: 'Could not complete login. Please try again later.',
        no_access_token: 'Could not retrieve access token. Please try again.',
        userinfo_failed: 'Could not fetch your profile. Please try again.',
      };
      setErrorMsg(messages[err] ?? `Login error: ${err}`);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const providers = [
    {
      key: 'google' as const,
      label: 'Continue with Google',
      href: `${API_BASE}/api/auth/google/login`,
      icon: <GoogleIcon />,
      bg: 'bg-white',
      text: 'text-[#1a1a1a]',
      border: 'border border-black/10',
      hoverBg: 'hover:bg-gray-50',
      shadow: 'shadow-sm hover:shadow-md',
    },
    {
      key: 'github' as const,
      label: 'Continue with GitHub',
      href: `${API_BASE}/api/auth/github/login`,
      icon: <GitHubIcon />,
      bg: 'bg-[#0d1117]',
      text: 'text-white',
      border: 'border border-white/10',
      hoverBg: 'hover:bg-[#161b22]',
      shadow: 'shadow-sm hover:shadow-md',
    },
  ] as const;

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-[#f8f8f6]">

      {/* Floating ambient orbs */}
      <FloatingOrb size={500} x="-10%" y="-10%" delay="0s" duration="8s" color="radial-gradient(circle, #e8e0ff 0%, transparent 70%)" />
      <FloatingOrb size={400} x="60%" y="40%" delay="2s" duration="10s" color="radial-gradient(circle, #d0e8ff 0%, transparent 70%)" />
      <FloatingOrb size={300} x="20%" y="60%" delay="4s" duration="7s" color="radial-gradient(circle, #ffe8f0 0%, transparent 70%)" />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div
          className="bg-white/80 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl shadow-black/5 border border-black/[0.06]"
          style={{ animation: 'fadeRise 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-10">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black/30 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-black" />
              </span>
              <span className="text-4xl font-normal tracking-tight text-black font-serif" style={{ lineHeight: 1 }}>
                RepoGenius
              </span>
            </div>
            <p className="text-[#6F6F6F] text-sm text-center leading-relaxed max-w-[260px]">
              AI-powered semantic repository discovery. Sign in to begin your journey.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-black/8" />
            <span className="text-xs text-[#9F9F9F] font-medium tracking-wide uppercase">Sign in with</span>
            <div className="flex-1 h-px bg-black/8" />
          </div>

          {/* OAuth buttons */}
          <div className="flex flex-col gap-3">
            {providers.map(({ key, label, href, icon, bg, text, border, hoverBg, shadow }) => (
              <a
                key={key}
                id={`login-${key}`}
                href={href}
                onMouseEnter={() => setHoveredProvider(key)}
                onMouseLeave={() => setHoveredProvider(null)}
                className={`
                  flex items-center justify-center gap-3 w-full rounded-2xl px-5 py-3.5
                  text-sm font-medium transition-all duration-200
                  ${bg} ${text} ${border} ${hoverBg} ${shadow}
                  ${hoveredProvider === key ? 'scale-[1.01]' : 'scale-100'}
                  active:scale-[0.98]
                `}
                style={{ textDecoration: 'none' }}
              >
                {icon}
                <span>{label}</span>
              </a>
            ))}
          </div>

          {/* Error message */}
          {errorMsg && (
            <div
              className="mt-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100"
              role="alert"
              style={{ animation: 'fadeRise 0.3s ease forwards' }}
            >
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-red-700 leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* Footer note */}
          <p className="mt-8 text-center text-[11px] text-[#ABABAB] leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#terms" className="underline underline-offset-2 hover:text-[#6F6F6F] transition-colors">Terms</a>
            {' '}and{' '}
            <a href="#privacy" className="underline underline-offset-2 hover:text-[#6F6F6F] transition-colors">Privacy Policy</a>.
          </p>
        </div>

        {/* Bottom caption */}
        <p className="text-center text-xs text-[#C0C0C0] mt-6 select-none">
          © 2026 RepoGenius · Designing the future of semantic source discovery
        </p>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes float {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(20px, -30px) scale(1.08); }
        }
        @keyframes fadeRise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
