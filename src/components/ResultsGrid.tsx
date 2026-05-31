import React, { useState } from 'react';
import type { Repository } from '../mockData';

interface ResultsGridProps {
  repositories: Repository[];
  isLoading: boolean;
  onSelectRepo: (repo: Repository) => void;
  searchError?: string | null;
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-3.5 h-3.5 text-black/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const SparkleIcon = () => (
  <svg className="w-3 h-3 text-black/60" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.2L12 17l-6.2 3.9 2.4-7.2L2 9.2h7.6L12 2z" />
  </svg>
);

interface RepoCardProps {
  repo: Repository;
  onSelectRepo: (repo: Repository) => void;
}

const RepoCard: React.FC<RepoCardProps> = ({ repo, onSelectRepo }) => {
  const [insightOpen, setInsightOpen] = useState(false);

  const hasInsight = !!(repo.aiInsight || repo.aiWhyItFits || (repo.aiAdvantages && repo.aiAdvantages.length > 0));

  return (
    <div className="group relative bg-white/70 hover:bg-white/95 backdrop-blur-md border border-black/5 hover:border-black/10 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md flex flex-col hover:-translate-y-0.5 font-sans select-none">

      {/* ── Main clickable card area ── */}
      <div className="p-6 cursor-pointer flex-1" onClick={() => onSelectRepo(repo)}>

        {/* Header: owner / name / match badge */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#6F6F6F] uppercase tracking-wider mb-0.5">
              {repo.owner}
            </span>
            <h4 className="text-lg font-bold text-black leading-tight flex items-center gap-1.5">
              <svg className="w-4 h-4 text-black/50 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .53-.17 1.75.73.5-.13 1.05-.2 1.6-.2.55 0 1.1.07 1.6.2 1.21-.9 1.75-.73 1.75-.73.35 1.1.07 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span className="tracking-tight">{repo.name}</span>
            </h4>
          </div>
          <span className="text-[10px] font-bold text-white bg-black rounded-full px-2.5 py-1 shadow-sm shrink-0">
            {repo.matchScore}% Match
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-[#6F6F6F] leading-relaxed mb-4 line-clamp-2 font-normal">
          {repo.description}
        </p>

        {/* Tech Stack Pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {repo.techStack.map((tech) => (
            <span
              key={tech}
              className="text-[10px] font-bold bg-black/[0.03] text-black border border-black/5 rounded-full px-2.5 py-0.5"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Footer meta */}
        <div className="flex justify-between items-center pt-4 border-t border-black/5">
          <div className="flex items-center gap-4 text-xs font-semibold text-[#6F6F6F] flex-wrap">
            {/* Stars */}
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{repo.stars >= 1000 ? `${(repo.stars / 1000).toFixed(1)}k` : repo.stars}</span>
            </span>
            {/* Activity */}
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${
                repo.activity === 'Active' ? 'bg-emerald-500 shadow-sm shadow-emerald-400' :
                repo.activity === 'Recently Updated' ? 'bg-amber-500 shadow-sm shadow-amber-400' : 'bg-gray-400'
              }`} />
              <span>{repo.activity}</span>
            </span>
            {/* Beginner tag */}
            {repo.difficulty === 'Beginner' && (
              <span className="text-[9px] bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                🌱 Beginner Friendly
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-black border-b border-black group-hover:text-black/50 group-hover:border-black/50 transition-all py-0.5 shrink-0">
            Explain Match
          </span>
        </div>
      </div>

      {/* ── AI Discovery Insight Accordion ── */}
      {hasInsight && (
        <div className="border-t border-black/5">
          {/* Accordion toggle button */}
          <button
            onClick={() => setInsightOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 px-6 py-3 text-left hover:bg-black/[0.02] transition-colors rounded-b-2xl"
          >
            <div className="flex items-center gap-1.5">
              <SparkleIcon />
              <span className="text-[10px] font-bold text-black uppercase tracking-wider">
                AI Discovery Insight
              </span>
            </div>
            <ChevronIcon open={insightOpen} />
          </button>

          {/* Expanded content */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              insightOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-6 pb-5 space-y-4">

              {/* Main insight text */}
              {repo.aiInsight && (
                <p className="text-xs text-[#3a3a3a] leading-relaxed font-normal">
                  {repo.aiInsight}
                </p>
              )}

              {/* Why it fits */}
              {repo.aiWhyItFits && (
                <div className="bg-black/[0.02] border-l-2 border-black/30 px-3 py-2 rounded-r-lg">
                  <span className="block text-[9px] font-bold text-black uppercase tracking-wider mb-0.5">
                    Why it fits your query
                  </span>
                  <p className="text-xs text-[#6F6F6F] leading-relaxed">
                    {repo.aiWhyItFits}
                  </p>
                </div>
              )}

              {/* Advantages & Disadvantages side by side */}
              {((repo.aiAdvantages && repo.aiAdvantages.length > 0) || (repo.aiDisadvantages && repo.aiDisadvantages.length > 0)) && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Advantages */}
                  {repo.aiAdvantages && repo.aiAdvantages.length > 0 && (
                    <div>
                      <span className="block text-[9px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">
                        ✓ Advantages
                      </span>
                      <ul className="space-y-1">
                        {repo.aiAdvantages.slice(0, 3).map((adv, i) => (
                          <li key={i} className="flex gap-1.5 text-[10px] text-[#6F6F6F] leading-snug">
                            <span className="text-emerald-500 font-bold mt-0.5 shrink-0">+</span>
                            <span>{adv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Disadvantages */}
                  {repo.aiDisadvantages && repo.aiDisadvantages.length > 0 && (
                    <div>
                      <span className="block text-[9px] font-bold text-rose-600 uppercase tracking-wider mb-1.5">
                        ✗ Disadvantages
                      </span>
                      <ul className="space-y-1">
                        {repo.aiDisadvantages.slice(0, 3).map((dis, i) => (
                          <li key={i} className="flex gap-1.5 text-[10px] text-[#6F6F6F] leading-snug">
                            <span className="text-rose-400 font-bold mt-0.5 shrink-0">−</span>
                            <span>{dis}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Best Use Case */}
              {repo.aiBestUseCase && (
                <div className="flex items-start gap-2 bg-black/[0.02] rounded-xl px-3 py-2">
                  <span className="text-[10px] mt-0.5">🎯</span>
                  <div>
                    <span className="block text-[9px] font-bold text-black uppercase tracking-wider mb-0.5">
                      Best Use Case
                    </span>
                    <p className="text-[10px] text-[#6F6F6F] leading-snug">{repo.aiBestUseCase}</p>
                  </div>
                </div>
              )}

              {/* Suitability badge */}
              {repo.aiSuitability && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-black uppercase tracking-wider">Suitability:</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    repo.aiSuitability === 'Beginner'
                      ? 'bg-emerald-100 text-emerald-700'
                      : repo.aiSuitability === 'Intermediate'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}>
                    {repo.aiSuitability}
                  </span>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};


export const ResultsGrid: React.FC<ResultsGridProps> = ({ repositories, isLoading, onSelectRepo, searchError }) => {

  if (searchError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center bg-white/40 backdrop-blur-md border border-black/5 rounded-2xl animate-fade-rise select-none font-sans">
        <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-black/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h4 className="text-base font-bold text-black mb-1 font-sans">Elaborate your query</h4>
        <p className="text-xs text-[#6F6F6F] max-w-sm font-sans leading-relaxed">
          {searchError}
        </p>
      </div>
    );
  }

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
        <RepoCard key={repo.id} repo={repo} onSelectRepo={onSelectRepo} />
      ))}
    </div>
  );
};
