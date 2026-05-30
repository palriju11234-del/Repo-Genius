import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-12 md:py-16 select-none font-sans animate-fade-rise">
      <div className="glassmorphic rounded-3xl p-8 md:p-12 shadow-md hover:shadow-lg transition-all duration-300 border border-black/5">
        
        {/* Title */}
        <h1 
          className="text-4xl md:text-6xl text-[#000000] font-normal leading-tight font-serif mb-8 text-center"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          About RepoGenius
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-black font-semibold leading-relaxed mb-6 font-sans text-center max-w-2xl mx-auto">
          RepoGenius is an AI-powered semantic search platform designed to transform the way developers discover GitHub repositories.
        </p>

        {/* Paragraph 1 */}
        <p className="text-base text-black/80 leading-relaxed mb-6">
          Traditional GitHub search relies heavily on keywords, often making repository discovery slow, inefficient, and frustrating — especially for students, beginners, and hackathon teams. RepoGenius solves this problem using semantic AI search, enabling users to find repositories based on meaning and intent rather than exact keyword matches.
        </p>

        {/* Paragraph 2 */}
        <p className="text-base text-black/80 leading-relaxed mb-6">
          By combining embeddings, vector similarity search, hybrid ranking, and LLM-generated explanations, RepoGenius understands natural language queries like:
        </p>

        {/* Example Quotes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8 max-w-xl mx-auto">
          <div className="bg-black/[0.02] border-l-2 border-black p-4 rounded-r-xl text-center">
            <span className="font-serif italic text-lg text-black">“Beginner-friendly FastAPI backend”</span>
          </div>
          <div className="bg-black/[0.02] border-l-2 border-black p-4 rounded-r-xl text-center">
            <span className="font-serif italic text-lg text-black">“Secure MQTT authentication project”</span>
          </div>
        </div>

        <p className="text-base text-black/80 leading-relaxed mb-6 text-center font-medium">
          and intelligently recommends the most relevant repositories.
        </p>

        {/* Bullet List 1: Advanced Technologies */}
        <div className="mb-8 border border-black/5 rounded-2xl p-6 bg-black/[0.01]">
          <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4 font-sans text-center">
            Advanced Technologies Utilized
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
            {['Semantic embeddings', 'FAISS vector database', 'Cosine similarity ranking', 'GitHub API integration', 'Large Language Models (LLMs)'].map((tech, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-black/80 leading-relaxed items-center font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-black select-none shrink-0" />
                <span>{tech}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#6F6F6F] leading-relaxed mt-4 text-center font-sans">
            to deliver fast, accurate, and explainable search results.
          </p>
        </div>

        {/* Bullet List 2: Built For */}
        <div className="mb-8 p-6">
          <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4 font-sans text-center">
            Who RepoGenius is Built For
          </h3>
          <ul className="space-y-3 max-w-md mx-auto">
            {[
              'Students & beginners looking for learning projects',
              'Developers searching for production-ready repositories',
              'Hackathon teams needing rapid project discovery',
              'Open-source contributors exploring meaningful projects'
            ].map((target, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-black/80 leading-relaxed font-sans">
                <span className="text-black font-bold select-none">•</span>
                <span>{target}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Paragraph 3 */}
        <p className="text-base text-black/80 leading-relaxed mb-6 text-center max-w-xl mx-auto">
          Instead of spending hours scrolling through irrelevant repositories, developers can now discover the right project in seconds.
        </p>

        {/* Paragraph 4 */}
        <p className="text-base text-black/80 leading-relaxed mb-8 text-center max-w-xl mx-auto">
          At its core, RepoGenius is more than just a search engine — it is an intelligent developer assistant built to simplify open-source discovery through AI.
        </p>

        {/* Closing sentence */}
        <div className="border-t border-black/5 pt-8 mt-8 text-center">
          <p 
            className="text-2xl md:text-3xl text-center italic text-[#6F6F6F] font-serif tracking-tight leading-tight select-none"
            style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.5px' }}
          >
            Find the right GitHub project by meaning, not keyword.
          </p>
        </div>

      </div>
    </main>
  );
};
