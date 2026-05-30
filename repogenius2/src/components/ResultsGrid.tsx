import React from 'react';
import type { Repository } from '../mockData';

interface ResultsGridProps {
  repositories: Repository[];
  isLoading: boolean;
  onSelectRepo: (repo: Repository) => void;
}

export const ResultsGrid: React.FC<ResultsGridProps> = ({ repositories, isLoading, onSelectRepo }) => {
  
  if (isLoading) {
    return (
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="bg-white/55 border border-black/5 rounded-2xl p-6 h-[270px] animate-pulse flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="h-3 w-16 bg-black/5 rounded" />
                  <div className="h-5 w-48 bg-black/5 rounded" />
                </div>
                <div className="h-5 w-16 bg-black/5 rounded-full" />
              </div>
              <div className="h-4 w-full bg-black/5 rounded" />
              <div className="h-4 w-5/6 bg-black/5 rounded" />
            </div>
            <div className="flex gap-2 mt-2">
              <div className="h-5 w-16 bg-black/5 rounded-full" />
              <div className="h-5 w-16 bg-black/5 rounded-full" />
              <div className="h-5 w-16 bg-black/5 rounded-full" />
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-black/5 mt-4">
              <div className="h-4 w-32 bg-black/5 rounded" />
              <div className="h-4 w-20 bg-black/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center bg-white/40 backdrop-blur-md border border-black/5 rounded-2xl">
        <svg className="w-12 h-12 text-[#6F6F6F] mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 className="text-base font-bold text-black mb-1 font-sans">No repositories found</h4>
        <p className="text-xs text-[#6F6F6F] max-w-sm font-sans leading-relaxed">
          No repositories match your active combination of filters. Try disabling some categories in the sidebar or refining your query.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 select-none font-sans">
      {repositories.map((repo) => (
        <div 
          key={repo.id}
          onClick={() => onSelectRepo(repo)}
          className="group relative bg-white/70 hover:bg-white/95 backdrop-blur-md border border-black/5 hover:border-black/10 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between hover:-translate-y-0.5"
        >
          {/* Main Card Content */}
          <div>
            <div className="flex justify-between items-start gap-4 mb-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#6F6F6F] uppercase tracking-wider mb-0.5">
                  {repo.owner}
                </span>
                <h4 className="text-lg font-bold text-black leading-tight group-hover:text-black transition-colors flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-black/50" viewBox="0 0 16 16" fill="currentColor">
                    <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .53-.17 1.75.73.5-.13 1.05-.2 1.6-.2.55 0 1.1.07 1.6.2 1.21-.9 1.75-.73 1.75-.73.35 1.1.07 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  <span className="tracking-tight">{repo.name}</span>
                </h4>
              </div>

              {/* Match Score Badge */}
              <span className="text-[10px] font-bold text-white bg-black rounded-full px-2.5 py-1 shadow-sm shrink-0">
                {repo.matchScore}% Match
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-[#6F6F6F] leading-relaxed mb-4 line-clamp-2 h-10 overflow-hidden font-normal">
              {repo.description}
            </p>

            {/* Tech Stack Pills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {repo.techStack.map((tech) => (
                <span 
                  key={tech} 
                  className="text-[10px] font-bold bg-black/[0.03] text-black border border-black/5 rounded-full px-2.5 py-0.5 select-none"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Match explanation excerpt */}
            <div className="bg-black/[0.01] border-l-2 border-black/40 px-3 py-2 rounded-r-xl mb-4">
              <span className="block text-[9px] font-bold text-black uppercase tracking-wider mb-0.5">
                AI Match Reason
              </span>
              <p className="text-xs text-[#6F6F6F] leading-relaxed line-clamp-2 h-8 overflow-hidden font-normal">
                {repo.aiExplanation}
              </p>
            </div>
          </div>

          {/* Card Footer Metadata & Stats */}
          <div className="flex justify-between items-center pt-4 border-t border-black/5 mt-auto">
            <div className="flex items-center gap-4 text-xs font-semibold text-[#6F6F6F] flex-wrap">
              
              {/* Star Rating */}
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{(repo.stars / 1000).toFixed(1)}k</span>
              </span>

              {/* Status Indicator */}
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  repo.activity === 'Active' ? 'bg-emerald-500 shadow-sm shadow-emerald-400' :
                  repo.activity === 'Recently Updated' ? 'bg-amber-500 shadow-sm shadow-amber-400' : 'bg-gray-400'
                }`} />
                <span>{repo.activity}</span>
              </span>

              {/* Beginner Badge */}
              {repo.difficulty === 'Beginner' && (
                <span className="text-[9px] bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 select-none">
                  🌱 Beginner Friendly
                </span>
              )}
            </div>

            {/* Explain Action CTA */}
            <span className="text-xs font-bold text-black border-b border-black group-hover:text-black/50 group-hover:border-black/50 transition-all py-0.5 shrink-0">
              Explain Match
            </span>
          </div>

        </div>
      ))}
    </div>
  );
};
