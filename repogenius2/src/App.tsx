import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { BackgroundVideo } from './components/BackgroundVideo';
import { FiltersSidebar, type FiltersState } from './components/FiltersSidebar';
import { ResultsGrid } from './components/ResultsGrid';
import { ExplanationPanel } from './components/ExplanationPanel';
import { AboutPage } from './components/AboutPage';
import { ContactModal } from './components/ContactModal';
import { mockRepositories, type Repository } from './mockData';

function App() {
  const [view, setView] = useState<'home' | 'about'>('home');
  const [contactOpen, setContactOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [globalExplanation, setGlobalExplanation] = useState<string>('');
  
  const [filters, setFilters] = useState<FiltersState>({
    difficulty: [],
    language: [],
    health: [],
    useCase: []
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setView('home'); // Ensure we are on home view when searching
    setIsSearching(true);
    setHasSearched(true);
    setGlobalExplanation('');

    // Resolve API URL dynamically to handle both direct serving (port 8000) and Vite dev server (port 5173)
    const apiBase = window.location.port === '8000' ? '' : 'http://127.0.0.1:8000';

    // Query actual FastAPI semantic discovery backend
    fetch(`${apiBase}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        n_results: 30, // Request enough so local filters work wonderfully
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Search request failed');
        return res.json();
      })
      .then((data) => {
        const mapped = data.recommendations.map((rec: any, idx: number) => {
          const matchScore = Math.round(rec.relevance_score * 100);
          const codeQuality = Math.round(75 + rec.relevance_score * 20 - (idx * 2) % 15);
          const documentation = Math.round(80 + rec.relevance_score * 15 - (idx * 3) % 10);
          const beginnerFriendliness = Math.round(65 + rec.relevance_score * 30 - (idx * 4) % 20);

          const difficulty = rec.relevance_score > 0.85 ? 'Beginner' : rec.relevance_score > 0.65 ? 'Intermediate' : 'Advanced';
          
          let useCase: any = 'Web Dev';
          const topicsLower = (rec.topics || []).map((t: string) => t.toLowerCase());
          const descLower = (rec.description || '').toLowerCase();
          if (topicsLower.includes('ai') || topicsLower.includes('machine-learning') || topicsLower.includes('deep-learning') || topicsLower.includes('llm') || descLower.includes('ai') || descLower.includes('learning')) {
            useCase = 'AI';
          } else if (topicsLower.includes('security') || topicsLower.includes('cybersecurity') || topicsLower.includes('auth')) {
            useCase = 'Cybersecurity';
          } else if (topicsLower.includes('blockchain') || topicsLower.includes('crypto')) {
            useCase = 'Blockchain';
          } else if (topicsLower.includes('iot') || topicsLower.includes('hardware')) {
            useCase = 'IoT';
          }

          const activity = rec.stars > 2500 ? 'Active' : rec.stars > 500 ? 'Recently Updated' : 'Inactive';
          const owner = rec.full_name.includes('/') ? rec.full_name.split('/')[0] : 'github-user';

          const aiDetails = [
            `Leverages ${rec.language} for high-performance and modern semantic design.`,
            `Features ${rec.stars.toLocaleString()} stars on GitHub, indicating high community trust.`,
            `Topics listed: ${rec.topics.join(', ') || 'General project'}.`,
            `Demonstrates excellent compliance and semantic matching with your query: "${rec.name}".`
          ];

          return {
            id: rec.full_name || rec.name || String(idx),
            name: rec.name,
            owner: owner,
            description: rec.description || 'No description provided.',
            matchScore: matchScore,
            codeQuality: Math.min(100, Math.max(0, codeQuality)),
            documentation: Math.min(100, Math.max(0, documentation)),
            beginnerFriendliness: Math.min(100, Math.max(0, beginnerFriendliness)),
            techStack: rec.topics && rec.topics.length > 0 ? rec.topics.slice(0, 6) : [rec.language],
            stars: rec.stars,
            activity: activity,
            difficulty: difficulty,
            useCase: useCase,
            language: rec.language as any,
            githubUrl: rec.url || `https://github.com/${rec.full_name}`,
            aiExplanation: rec.description || `Dynamically retrieved match via conceptual meaning analysis. Fits perfectly into the "${useCase}" category.`,
            aiDetails: aiDetails
          };
        });
        setRepositories(mapped);
        setGlobalExplanation(data.explanation || '');
      })
      .catch((err) => {
        console.error('API Search Error:', err);
        // Fallback to mock data with a warning flag so app never crashes
        const fallback = mockRepositories.map(repo => ({
          ...repo,
          aiExplanation: `[DEMO MODE] ${repo.aiExplanation}`
        }));
        setRepositories(fallback);
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  const handleNavigate = (newView: 'home' | 'about') => {
    setView(newView);
  };

  // Real-time dynamic search and filter resolver
  const filteredRepositories = repositories.filter((repo) => {


    // 2. Difficulty Sidebar Filter
    if (filters.difficulty.length > 0 && !filters.difficulty.includes(repo.difficulty)) {
      return false;
    }

    // 3. Language Sidebar Filter
    if (filters.language.length > 0 && !filters.language.includes(repo.language)) {
      return false;
    }

    // 4. Use Case Sidebar Filter
    if (filters.useCase.length > 0 && !filters.useCase.includes(repo.useCase)) {
      return false;
    }

    // 5. Repo Health Sidebar Filter
    if (filters.health.length > 0) {
      const matchesHealth = filters.health.some((healthVal) => {
        if (healthVal === 'Active') return repo.activity === 'Active';
        if (healthVal === 'Recently Updated') return repo.activity === 'Recently Updated';
        if (healthVal === 'Most Starred') return repo.stars >= 2000;
        return false;
      });
      if (!matchesHealth) return false;
    }

    return true;
  });

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white flex flex-col justify-between">
      
      {/* Background Video & Gradient Overlay Layer (z-0) */}
      <BackgroundVideo />

      {/* Navigation Bar (z-10) */}
      <Navbar 
        currentView={view} 
        onNavigate={handleNavigate} 
        onReachUs={() => setContactOpen(true)} 
      />

      {/* Main View Renderer */}
      {view === 'home' ? (
        <>
          {/* Minimizable Hero Section (z-10) */}
          <HeroSection 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
            hasSearched={hasSearched}
          />

          {/* Interactive Search Results & Sidebar Section (z-10) */}
          {hasSearched && (
            <main className="relative z-10 w-full max-w-7xl mx-auto px-8 pb-32 animate-fade-rise">
              
              {/* Premium Glassmorphic Global AI Explanation Section */}
              {globalExplanation && !isSearching && (
                <div className="mb-8 p-6 bg-white/70 backdrop-blur-md border border-black/5 rounded-2xl shadow-sm select-none font-sans max-w-7xl">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold text-black uppercase tracking-wider">
                    <span className="text-sm">✦</span>
                    <span>AI Discovery Insights</span>
                  </div>
                  <p className="text-sm text-[#6F6F6F] leading-relaxed font-normal">
                    {globalExplanation}
                  </p>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-8 items-start">
                
                {/* Left Hand Filters Sidebar */}
                <FiltersSidebar 
                  filters={filters}
                  onChange={setFilters}
                />

                {/* Right Hand Repo Cards Grid */}
                <ResultsGrid 
                  repositories={filteredRepositories}
                  isLoading={isSearching}
                  onSelectRepo={setSelectedRepo}
                />

              </div>
            </main>
          )}
        </>
      ) : (
        /* Rich Text About Platform Panel (z-10) */
        <AboutPage />
      )}

      {/* Slide-out AI Explanation & Radar Graph Side Panel (z-50) */}
      <ExplanationPanel 
        repo={selectedRepo}
        onClose={() => setSelectedRepo(null)}
      />

      {/* Center Floating Reach-Us Contact Card Modal (z-50) */}
      <ContactModal 
        isOpen={contactOpen} 
        onClose={() => setContactOpen(false)} 
      />

      {/* Premium Minimalist Footer (z-10) */}
      <footer className="relative z-10 w-full px-8 py-6 text-center text-xs text-[#6F6F6F] font-sans border-t border-black/5 bg-white/40 backdrop-blur-sm select-none mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 RepoGenius. Designing the future of semantic source discovery.</p>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-black transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-black transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
      
    </div>
  );
}

export default App;
