import React, { useEffect, useState } from 'react';
import type { Repository } from '../mockData';

interface ExplanationPanelProps {
  repo: Repository | null;
  onClose: () => void;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ repo, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (repo) {
      // Trigger slide-in animation delay
      const t = setTimeout(() => setIsOpen(true), 50);
      return () => clearTimeout(t);
    } else {
      setIsOpen(false);
    }
  }, [repo]);

  if (!repo) return null;

  // Coordinate calculations for the 4-axis Radar Graph (Semantic, Quality, Docs, Beginner)
  const cx = 160;
  const cy = 140;
  const rMax = 95;

  const getCoords = (index: number, value: number) => {
    // index 0: Up (Semantic Match)
    // index 1: Right (Code Quality)
    // index 2: Down (Documentation)
    // index 3: Left (Beginner Friendliness)
    const angle = (index * Math.PI) / 2 - Math.PI / 2; // -90 deg for first axis
    const distance = (value / 100) * rMax;
    return {
      x: cx + distance * Math.cos(angle),
      y: cy + distance * Math.sin(angle),
    };
  };

  // Concentric grid polygons (diamonds/squares)
  const gridLevels = [25, 50, 75, 100];
  const gridPolygons = gridLevels.map(level => {
    const pts = [
      getCoords(0, level),
      getCoords(1, level),
      getCoords(2, level),
      getCoords(3, level)
    ];
    return `${pts[0].x},${pts[0].y} ${pts[1].x},${pts[1].y} ${pts[2].x},${pts[2].y} ${pts[3].x},${pts[3].y}`;
  });

  // Repository score polygon points
  const p0 = getCoords(0, repo.matchScore);
  const p1 = getCoords(1, repo.codeQuality);
  const p2 = getCoords(2, repo.documentation);
  const p3 = getCoords(3, repo.beginnerFriendliness);
  const repoPolygon = `${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Allow drawer to slide out before unmounting
  };

  return (
    <>
      {/* Backdrop overlay (z-40) */}
      <div 
        className={`fixed inset-0 bg-black/15 backdrop-blur-[4px] z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Slide-out Panel (z-50) */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white/95 backdrop-blur-xl shadow-2xl z-50 border-l border-black/5 overflow-y-auto transition-transform duration-300 ease-out select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6F6F6F] mb-1">
                <span>{repo.owner}</span>
                <span>/</span>
                <span className="bg-black/5 text-[#000000] px-2 py-0.5 rounded-md">{repo.difficulty}</span>
              </div>
              <h2 className="text-2xl font-bold text-black font-sans leading-tight">
                {repo.name}
              </h2>
            </div>
            <button 
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors cursor-pointer"
              aria-label="Close panel"
            >
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cosine similarity metrics & Semantic Match Visualization */}
          <div className="mb-8 border border-black/5 rounded-2xl p-6 bg-black/[0.01]">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4 font-sans">
              Semantic Match Visualization
            </h3>
            
            {/* Custom SVG Radar Chart */}
            <div className="flex justify-center mb-6">
              <svg className="w-80 h-72" viewBox="0 0 320 280">
                {/* Nested Grid Polygons */}
                {gridPolygons.map((points, idx) => (
                  <polygon 
                    key={idx} 
                    points={points} 
                    className="fill-none stroke-black/5" 
                    strokeDasharray={idx === 3 ? 'none' : '2,2'}
                  />
                ))}

                {/* Concentric Grid Label text */}
                <text x={cx} y={cy - rMax + 8} className="text-[9px] fill-black/25 font-sans font-medium text-center" textAnchor="middle">100%</text>
                <text x={cx} y={cy - (rMax * 0.75) + 8} className="text-[9px] fill-black/25 font-sans font-medium text-center" textAnchor="middle">75%</text>
                <text x={cx} y={cy - (rMax * 0.5) + 8} className="text-[9px] fill-black/25 font-sans font-medium text-center" textAnchor="middle">50%</text>

                {/* Axis Lines */}
                <line x1={cx} y1={cy} x2={cx} y2={cy - rMax} className="stroke-black/5" />
                <line x1={cx} y1={cy} x2={cx + rMax} y2={cy} className="stroke-black/5" />
                <line x1={cx} y1={cy} x2={cx} y2={cy + rMax} className="stroke-black/5" />
                <line x1={cx} y1={cy} x2={cx - rMax} y2={cy} className="stroke-black/5" />

                {/* Target Score Polygon */}
                <polygon 
                  points={repoPolygon} 
                  className="fill-black/5 stroke-black stroke-2"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05))',
                    transition: 'points 0.3s ease-in-out'
                  }}
                />

                {/* Dots on Vertices */}
                <circle cx={p0.x} cy={p0.y} r="4" className="fill-black stroke-white stroke-2" />
                <circle cx={p1.x} cy={p1.y} r="4" className="fill-black stroke-white stroke-2" />
                <circle cx={p2.x} cy={p2.y} r="4" className="fill-black stroke-white stroke-2" />
                <circle cx={p3.x} cy={p3.y} r="4" className="fill-black stroke-white stroke-2" />

                {/* Axis Labels */}
                <text x={cx} y={cy - rMax - 8} className="text-[10px] font-bold fill-black font-sans" textAnchor="middle">Semantic Match</text>
                <text x={cx + rMax + 12} y={cy + 4} className="text-[10px] font-bold fill-black font-sans" textAnchor="start">Code Quality</text>
                <text x={cx} y={cy + rMax + 16} className="text-[10px] font-bold fill-black font-sans" textAnchor="middle">Documentation</text>
                <text x={cx - rMax - 12} y={cy + 4} className="text-[10px] font-bold fill-black font-sans" textAnchor="end">Beginner friendly</text>
              </svg>
            </div>

            {/* Exact Percent Score Bars */}
            <div className="space-y-3 font-sans">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#6F6F6F]">Semantic Match (Cosine Similarity)</span>
                  <span className="text-black">{repo.matchScore}%</span>
                </div>
                <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-black h-full rounded-full transition-all duration-500" style={{ width: `${repo.matchScore}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#6F6F6F]">Code Quality</span>
                  <span className="text-black">{repo.codeQuality}%</span>
                </div>
                <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-black/75 h-full rounded-full transition-all duration-500" style={{ width: `${repo.codeQuality}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#6F6F6F]">Documentation Depth</span>
                  <span className="text-black">{repo.documentation}%</span>
                </div>
                <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-black/75 h-full rounded-full transition-all duration-500" style={{ width: `${repo.documentation}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#6F6F6F]">Beginner Friendliness</span>
                  <span className="text-black">{repo.beginnerFriendliness}%</span>
                </div>
                <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-black/75 h-full rounded-full transition-all duration-500" style={{ width: `${repo.beginnerFriendliness}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* AI Explanation List */}
          <div className="mb-8 font-sans">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4">
              AI Match Explanation
            </h3>
            
            <p className="text-sm font-medium text-black leading-relaxed mb-4">
              This repository is relevant because:
            </p>

            <ul className="space-y-3">
              {repo.aiDetails.map((detail, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-[#6F6F6F] leading-relaxed align-top">
                  <span className="text-black font-bold select-none mt-0.5">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-black/5">
            <a 
              href={repo.githubUrl} 
              target="_blank" 
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full py-4 bg-black text-white hover:scale-103 active:scale-[0.98] transition-transform duration-300 font-semibold text-sm cursor-pointer shadow-md"
            >
              <span>Open on GitHub</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
