import React, { useState, useRef } from 'react';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  hasSearched: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  onSearch,
  hasSearched
}) => {
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleVoiceSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isListening) return;

    setIsListening(true);
    setSearchQuery('Listening...');
    
    // Simulate real-time semantic voice dictation
    setTimeout(() => {
      setSearchQuery('');
      const targetQuery = 'Find a beginner friendly FastAPI backend';
      let currentString = '';
      let index = 0;
      
      const typingInterval = setInterval(() => {
        if (index < targetQuery.length) {
          currentString += targetQuery[index];
          setSearchQuery(currentString);
          index++;
        } else {
          clearInterval(typingInterval);
          setIsListening(false);
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }
      }, 40);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <section 
      className="relative z-10 flex flex-col items-center justify-center text-center px-6 w-full transition-all duration-700 ease-in-out"
      style={{
        paddingTop: hasSearched ? '2.5rem' : 'calc(8rem - 75px)',
        paddingBottom: hasSearched ? '2rem' : '10rem',
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center">
        
        {/* Headline */}
        <h1 
          className="font-normal text-[#000000] leading-[0.95] max-w-6xl animate-fade-rise select-none transition-all duration-700 ease-in-out"
          style={{ 
            fontFamily: "'Instrument Serif', serif", 
            letterSpacing: '-2.46px',
            fontSize: hasSearched ? '2.75rem' : 'clamp(3rem, 7vw, 6rem)'
          }}
        >
          Find the right Github project by <span className="italic text-[#6F6F6F]">meaning,</span> not <span className="italic text-[#6F6F6F]">keyword.</span>
        </h1>

        {/* Description - User requested text to be solid black color #000000 */}
        <p 
          className={`text-[#000000] max-w-2xl leading-relaxed animate-fade-rise-delay font-sans transition-all duration-500 ${
            hasSearched ? 'max-h-0 opacity-0 overflow-hidden mt-0' : 'text-base sm:text-lg mt-8 opacity-100'
          }`}
        >
          AI-powered semantic search for GitHub Repositories — built for developers, students, and hackathon teams.
        </p>

        {/* Search & Actions Container */}
        <div className="w-full max-w-2xl mt-10 animate-fade-rise-delay flex flex-col items-center">
          
          {/* Search Input Box */}
          <div className="w-full relative glassmorphic shadow-sm hover:shadow-md transition-shadow duration-300 rounded-full border border-black/10 flex items-center px-6 py-4 bg-white/80 focus-within:border-black/25">
            {/* Search Icon */}
            <svg className="w-5 h-5 text-black/45 shrink-0 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            {/* Input Element */}
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Find a beginner friendly FastAPI backend"
              className="w-full bg-transparent border-none outline-none text-black text-base placeholder-black/35 font-sans pr-10"
              disabled={isListening}
            />

            {/* Voice Search Button */}
            <button
              type="button"
              onClick={handleVoiceSearch}
              className="absolute right-6 p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer shrink-0"
              aria-label="Voice Search"
            >
              {isListening ? (
                <span className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500"></span>
                </span>
              ) : (
                <svg className="w-5 h-5 text-black/55 hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
          </div>

          {/* Hero Begin Journey CTA Button - Positioned below the search bar */}
          <button 
            onClick={onSearch}
            className="rounded-full px-14 py-5 text-base font-semibold bg-[#000000] text-white hover:scale-103 active:scale-[0.98] transition-transform duration-300 shadow-md hover:shadow-lg cursor-pointer mt-8 animate-fade-rise-delay-2 font-sans select-none"
          >
            Begin Journey
          </button>
          
        </div>
      </div>
    </section>
  );
};
