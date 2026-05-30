import React, { useState } from 'react';

interface NavbarProps {
  currentView: 'home' | 'about';
  onNavigate: (view: 'home' | 'about') => void;
  onReachUs: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onReachUs }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <nav className="relative z-10 w-full glassmorphic border-b border-black/5">
      <div className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        
        {/* Logo Section */}
        <div 
          onClick={(e) => handleLinkClick(e, 'home')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          {/* Pulsing AI Indicator */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black/30 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-black"></span>
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
            className={`text-sm font-medium transition-colors hover:text-black ${
              currentView === 'home' ? 'text-black' : 'text-[#6F6F6F]'
            }`}
          >
            Home
          </a>
          <a 
            href="#about" 
            onClick={(e) => handleLinkClick(e, 'about')}
            className={`text-sm font-medium transition-colors hover:text-black ${
              currentView === 'about' ? 'text-black' : 'text-[#6F6F6F]'
            }`}
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

        {/* CTA Button */}
        <div className="hidden md:block">
          <button 
            onClick={(e) => handleLinkClick(e, 'home')}
            className="rounded-full px-6 py-2.5 text-sm font-medium bg-[#000000] text-white hover:scale-103 active:scale-[0.98] transition-transform duration-300 shadow-sm cursor-pointer"
          >
            Begin Journey
          </button>
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
          <button 
            onClick={(e) => handleLinkClick(e, 'home')}
            className="w-full text-center rounded-full py-3 bg-[#000000] text-white hover:scale-103 active:scale-[0.98] transition-transform font-medium text-sm cursor-pointer mt-2"
          >
            Begin Journey
          </button>
        </div>
      )}
    </nav>
  );
};
