import React from 'react';

export interface FiltersState {
  difficulty: string[];
  language: string[];
  health: string[];
  useCase: string[];
}

interface FiltersSidebarProps {
  filters: FiltersState;
  onChange: (newFilters: FiltersState) => void;
}

export const FiltersSidebar: React.FC<FiltersSidebarProps> = ({ filters, onChange }) => {
  
  const toggleFilter = (category: keyof FiltersState, value: string) => {
    const activeList = filters[category];
    const newActiveList = activeList.includes(value)
      ? activeList.filter(item => item !== value)
      : [...activeList, value];

    onChange({
      ...filters,
      [category]: newActiveList
    });
  };

  const clearAll = () => {
    onChange({
      difficulty: [],
      language: [],
      health: [],
      useCase: []
    });
  };

  const hasAnyFilter = 
    filters.difficulty.length > 0 ||
    filters.language.length > 0 ||
    filters.health.length > 0 ||
    filters.useCase.length > 0;

  return (
    <aside className="w-full md:w-68 flex-shrink-0 bg-white/70 backdrop-blur-lg border border-black/5 rounded-2xl p-6 select-none shadow-sm h-fit">
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-bold text-black uppercase tracking-wider font-sans">
          Advanced Filters
        </h3>
        {hasAnyFilter && (
          <button 
            onClick={clearAll}
            className="text-xs font-semibold text-[#6F6F6F] hover:text-black transition-colors cursor-pointer border-b border-dotted border-black/35 hover:border-black"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Difficulty */}
        <div className="border-t border-black/5 pt-4 first:border-none first:pt-0">
          <h4 className="text-xs font-bold text-black uppercase tracking-wider mb-3">Difficulty</h4>
          <div className="space-y-2">
            {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
              <label key={lvl} className="flex items-center gap-3 cursor-pointer group text-sm text-[#6F6F6F] hover:text-black transition-colors">
                <input 
                  type="checkbox"
                  checked={filters.difficulty.includes(lvl)}
                  onChange={() => toggleFilter('difficulty', lvl)}
                  className="rounded border-black/20 text-black focus:ring-black focus:ring-offset-0 cursor-pointer w-4 h-4 accent-black transition-all"
                />
                <span className="font-sans group-hover:translate-x-0.5 transition-transform duration-200">{lvl}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Programming Language */}
        <div className="border-t border-black/5 pt-4">
          <h4 className="text-xs font-bold text-black uppercase tracking-wider mb-3">Language</h4>
          <div className="space-y-2">
            {['Python', 'JavaScript', 'Java', 'C++', 'Go'].map((lang) => (
              <label key={lang} className="flex items-center gap-3 cursor-pointer group text-sm text-[#6F6F6F] hover:text-black transition-colors">
                <input 
                  type="checkbox"
                  checked={filters.language.includes(lang)}
                  onChange={() => toggleFilter('language', lang)}
                  className="rounded border-black/20 text-black focus:ring-black focus:ring-offset-0 cursor-pointer w-4 h-4 accent-black transition-all"
                />
                <span className="font-sans group-hover:translate-x-0.5 transition-transform duration-200">{lang}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Repo Health */}
        <div className="border-t border-black/5 pt-4">
          <h4 className="text-xs font-bold text-black uppercase tracking-wider mb-3">Repo Health</h4>
          <div className="space-y-2">
            {['Active', 'Recently Updated', 'Most Starred'].map((healthVal) => (
              <label key={healthVal} className="flex items-center gap-3 cursor-pointer group text-sm text-[#6F6F6F] hover:text-black transition-colors">
                <input 
                  type="checkbox"
                  checked={filters.health.includes(healthVal)}
                  onChange={() => toggleFilter('health', healthVal)}
                  className="rounded border-black/20 text-black focus:ring-black focus:ring-offset-0 cursor-pointer w-4 h-4 accent-black transition-all"
                />
                <span className="font-sans group-hover:translate-x-0.5 transition-transform duration-200">{healthVal}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="border-t border-black/5 pt-4">
          <h4 className="text-xs font-bold text-black uppercase tracking-wider mb-3">Use Cases</h4>
          <div className="space-y-2">
            {['AI', 'Web Dev', 'IoT', 'Cybersecurity', 'Blockchain'].map((uc) => (
              <label key={uc} className="flex items-center gap-3 cursor-pointer group text-sm text-[#6F6F6F] hover:text-black transition-colors">
                <input 
                  type="checkbox"
                  checked={filters.useCase.includes(uc)}
                  onChange={() => toggleFilter('useCase', uc)}
                  className="rounded border-black/20 text-black focus:ring-black focus:ring-offset-0 cursor-pointer w-4 h-4 accent-black transition-all"
                />
                <span className="font-sans group-hover:translate-x-0.5 transition-transform duration-200">{uc}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
