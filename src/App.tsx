import { useState, useCallback } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { BackgroundVideo } from './components/BackgroundVideo';
import { FiltersSidebar, type FiltersState } from './components/FiltersSidebar';
import { ResultsGrid } from './components/ResultsGrid';
import { ExplanationPanel } from './components/ExplanationPanel';
import { AboutPage } from './components/AboutPage';
import { ContactModal } from './components/ContactModal';
import { mockRepositories, type Repository } from './mockData';

type AppView = 'login' | 'home' | 'about';

function AppShell() {
  const [view, setView] = useState<AppView>('home');
  const [contactOpen, setContactOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FiltersState>({
    difficulty: [],
    language: [],
    health: [],
    useCase: []
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setView('home');
    setSearchError(null);

    const words = searchQuery.trim().split(/\s+/);
    if (words.length === 1 && words[0].length > 0) {
      setRepositories([]);
      setSearchError("Explain your query in two or more words.");
      setHasSearched(true);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    // Resolve API URL dynamically to handle both direct serving (port 8000) and Vite dev server (port 5173)
    const apiBase = window.location.port === '8000'
      ? ''
      : `${window.location.protocol}//${window.location.hostname}:8000`;

    fetch(`${apiBase}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ query: searchQuery, n_results: 30 }),
    })
      .then(async (res) => {
        if (!res.ok) {
          try {
            const errData = await res.json();
            if (errData && errData.detail) {
              throw new Error(errData.detail);
            }
          } catch (e) {
            // ignore
          }
          throw new Error('Search request failed');
        }
        return res.json();
      })
      .then((data) => {
        const mapped = data.recommendations.map((rec: any, idx: number) => {
          const matchScore = Math.round(rec.relevance_score * 100);
          const codeQuality = Math.round(75 + rec.relevance_score * 20 - (idx * 2) % 15);
          const documentation = Math.round(80 + rec.relevance_score * 15 - (idx * 3) % 10);
          const beginnerFriendliness = Math.round(65 + rec.relevance_score * 30 - (idx * 4) % 20);

          const difficulty: 'Beginner' | 'Intermediate' | 'Advanced' =
            (rec.ai_suitability as 'Beginner' | 'Intermediate' | 'Advanced') ||
            (rec.relevance_score > 0.85 ? 'Beginner' : rec.relevance_score > 0.65 ? 'Intermediate' : 'Advanced');

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
            aiExplanation: rec.ai_insight || rec.description || 'No AI insight available.',
            aiDetails: rec.ai_advantages || [],
            aiInsight: rec.ai_insight || '',
            aiWhyItFits: rec.ai_why_it_fits || '',
            aiSuitability: rec.ai_suitability || difficulty,
            aiAdvantages: rec.ai_advantages || [],
            aiDisadvantages: rec.ai_disadvantages || [],
            aiBestUseCase: rec.ai_best_use_case || '',
          };
        });
        setRepositories(mapped);
      })
      .catch((err) => {
        console.error('API Search Error:', err);
        if (err.message && (err.message.includes("Explain") || err.message.includes("words"))) {
          setRepositories([]);
          setSearchError(err.message);
        } else {
          const fallback = mockRepositories.map(repo => ({
            ...repo,
            aiExplanation: `[DEMO MODE] ${repo.aiExplanation}`
          }));
          setRepositories(fallback);
        }
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  const handleNavigate = (newView: 'home' | 'about') => {
    setView(newView);
  };

  // Redirect to login when session expires / not authenticated
  const handleNotAuthenticated = useCallback(() => {
    setView('login');
  }, []);

  // Real-time dynamic filter resolver
  const filteredRepositories = repositories.filter((repo) => {
    if (filters.difficulty.length > 0 && !filters.difficulty.includes(repo.difficulty)) return false;
    if (filters.language.length > 0 && !filters.language.includes(repo.language)) return false;
    if (filters.useCase.length > 0 && !filters.useCase.includes(repo.useCase)) return false;
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

  // Show login page
  if (view === 'login') {
    return <LoginPage />;
  }

  return (
    <ProtectedRoute onNotAuthenticated={handleNotAuthenticated}>
      <div className="relative min-h-screen w-full overflow-hidden bg-white flex flex-col justify-between">

        {/* Background Video & Gradient Overlay Layer (z-0) */}
        <BackgroundVideo />

        {/* Navigation Bar (z-10) */}
        <Navbar
          currentView={view as 'home' | 'about'}
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
                    searchError={searchError}
                  />

                </div>
              </main>
            )}
          </>
        ) : (
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
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
