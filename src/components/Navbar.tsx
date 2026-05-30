import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  currentView: 'home' | 'about';
  onNavigate: (view: 'home' | 'about') => void;
  onReachUs: () => void;
}

/* ── Provider badge icon ─────────────────────────────────────────────────── */
const ProviderIcon = ({ provider }: { provider: 'google' | 'github' }) =>
  provider === 'github' ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[#6F6F6F]">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 24 24" className="text-[#6F6F6F]">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

/* ── User Avatar ─────────────────────────────────────────────────────────── */
const Avatar = ({ src, name, size = 32 }: { src: string; name: string; size?: number }) => {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  if (imgError || !src) {
    return (
      <div
        className="rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold shrink-0 select-none"
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
      referrerPolicy="no-referrer"
    />
  );
};

/* ── Main Navbar ─────────────────────────────────────────────────────────── */
export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onReachUs }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleLinkClick = (e: React.MouseEvent, view: 'home' | 'about') => {
    e.preventDefault();
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  const handleReachUsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onReachUs();
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setProfileOpen(false);
    await logout();
    setLoggingOut(false);
  };

  return (
    <nav className="relative z-40 w-full glassmorphic border-b border-black/5">
      <div className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">

        {/* Logo Section */}
        <div
          onClick={(e) => handleLinkClick(e as any, 'home')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black/30 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-black" />
          </span>
          <span
            className="text-3xl font-normal tracking-tight text-[#000000] font-serif select-none"
            style={{ lineHeight: '1' }}
          >
            RepoGenius
          </span>
        </div>

        {/* Desktop Menu Items */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#home"
            onClick={(e) => handleLinkClick(e, 'home')}
            className={`text-sm font-medium transition-colors hover:text-black ${currentView === 'home' ? 'text-black' : 'text-[#6F6F6F]'}`}
          >
            Home
          </a>
          <a
            href="#about"
            onClick={(e) => handleLinkClick(e, 'about')}
            className={`text-sm font-medium transition-colors hover:text-black ${currentView === 'about' ? 'text-black' : 'text-[#6F6F6F]'}`}
          >
            About
          </a>
          <a
            href="#reach-us"
            onClick={handleReachUsClick}
            className="text-sm font-medium text-[#6F6F6F] hover:text-black transition-colors"
          >
            Reach Us
          </a>
        </div>

        {/* Right side: Profile or CTA */}
        <div className="hidden md:block">
          {user ? (
            /* ── Profile dropdown ── */
            <div className="relative" ref={profileRef}>
              <button
                id="profile-menu-trigger"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 hover:bg-black/5 transition-colors cursor-pointer"
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <Avatar src={user.avatar_url} name={user.name} size={30} />
                <span className="text-sm font-medium text-[#1a1a1a] max-w-[120px] truncate">{user.name}</span>
                <svg
                  className={`w-3.5 h-3.5 text-[#9F9F9F] transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown panel */}
              {profileOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/10 border border-black/[0.06] py-2 z-50"
                  style={{ animation: 'fadeRise 0.15s ease forwards' }}
                  role="menu"
                >
                  {/* User info section */}
                  <div className="px-4 py-3 border-b border-black/5">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar_url} name={user.name} size={38} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1a1a1a] truncate">{user.name}</p>
                        <p className="text-xs text-[#9F9F9F] truncate">{user.email}</p>
                      </div>
                    </div>
                    {/* Provider badge */}
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/[0.04] border border-black/[0.06]">
                      <ProviderIcon provider={user.provider} />
                      <span className="text-[10px] text-[#9F9F9F] font-medium capitalize">via {user.provider}</span>
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="px-2 pt-1.5">
                    <button
                      id="logout-button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#E53E3E] hover:bg-red-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                      role="menuitem"
                    >
                      {loggingOut ? (
                        <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      )}
                      {loggingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Unauthenticated CTA ── */
            <button
              onClick={(e) => handleLinkClick(e as any, 'home')}
              className="rounded-full px-6 py-2.5 text-sm font-medium bg-[#000000] text-white hover:scale-103 active:scale-[0.98] transition-transform duration-300 shadow-sm cursor-pointer"
            >
              Begin Journey
            </button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col justify-center items-center gap-1.5 w-6 h-6 cursor-pointer"
          aria-label="Toggle Menu"
        >
          <span className={`h-0.5 w-5 bg-black transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`h-0.5 w-5 bg-black transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-5 bg-black transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-lg border-b border-black/5 py-6 px-8 flex flex-col gap-5 animate-fade-rise z-20">
          <a
            href="#home"
            onClick={(e) => handleLinkClick(e, 'home')}
            className={`text-base font-medium ${currentView === 'home' ? 'text-black' : 'text-[#6F6F6F]'}`}
          >
            Home
          </a>
          <a
            href="#about"
            onClick={(e) => handleLinkClick(e, 'about')}
            className={`text-base font-medium ${currentView === 'about' ? 'text-black' : 'text-[#6F6F6F]'}`}
          >
            About
          </a>
          <a
            href="#reach-us"
            onClick={handleReachUsClick}
            className="text-base font-medium text-[#6F6F6F] hover:text-black transition-colors"
          >
            Reach Us
          </a>

          {user ? (
            /* Mobile profile section */
            <div className="border-t border-black/5 pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar src={user.avatar_url} name={user.name} size={40} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a1a] truncate">{user.name}</p>
                  <p className="text-xs text-[#9F9F9F] truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 text-sm text-[#E53E3E] font-medium disabled:opacity-50"
              >
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => handleLinkClick(e as any, 'home')}
              className="w-full text-center rounded-full py-3 bg-[#000000] text-white hover:scale-103 active:scale-[0.98] transition-transform font-medium text-sm cursor-pointer mt-2"
            >
              Begin Journey
            </button>
          )}
        </div>
      )}

      {/* Dropdown animation */}
      <style>{`
        @keyframes fadeRise {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  );
};
