import { useState, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';

export default function LandingPage({ onAnalyze, isAnalyzing, error, setError }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isAnalyzing) return;
    onAnalyze(input.trim());
  };

  // Generate floating ember particles with stable random coordinates
  const particles = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => {
      const size = Math.random() * 3 + 1; // 1px to 4px
      const left = Math.random() * 100; // 0% to 100%
      const bottom = Math.random() * 20; // start low
      const delay = Math.random() * 8; // 0s to 8s delay
      const duration = Math.random() * 8 + 8; // 8s to 16s duration
      
      return {
        id: i,
        style: {
          position: 'absolute',
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}%`,
          bottom: `${bottom}%`,
          background: 'rgba(234, 88, 12, 0.5)',
          boxShadow: '0 0 6px rgba(234, 88, 12, 0.7), 0 0 12px rgba(249, 115, 22, 0.4)',
          borderRadius: '50%',
          pointerEvents: 'none',
          animation: `floatUp ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
        }
      };
    });
  }, []);

  return (
    <div className="landing-container">
      {/* Background stars/embers */}
      <div className="landing-particles">
        {particles.map(p => (
          <div key={p.id} style={p.style} />
        ))}
      </div>

      {/* Main content container */}
      <div className="landing-content animate-fade-in">
        <span className="landing-badge">NEXT-GENERATION CODE INTELLIGENCE</span>
        <h1 className="landing-title">AMATERASU</h1>
        <p className="landing-desc">
          Transform complex codebases into living architectural maps.
        </p>
        <p className="landing-italic">
          Stop reading files. Start understanding systems.
        </p>

        {/* Input box and button */}
        <form className="landing-form" onSubmit={handleSubmit}>
          <div className="landing-input-wrapper">
            <svg
              viewBox="0 0 24 24"
              width={18}
              height={18}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="landing-input-icon"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            <input
              type="text"
              className="landing-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="github.com/user/project"
              disabled={isAnalyzing}
            />
          </div>

          <button
            type="submit"
            className="landing-btn"
            disabled={!input.trim() || isAnalyzing}
          >
            {isAnalyzing ? (
              <span className="landing-btn-inner">
                <span className="spinner spinner-sm" />
                ANALYZING REPOSITORY...
              </span>
            ) : (
              <span className="landing-btn-inner">
                ANALYZE REPOSITORY <ArrowRight size={14} />
              </span>
            )}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div className="landing-error">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}
      </div>

      {/* Vector mountain landscape at the bottom */}
      <div className="landing-landscape-wrapper">
        <svg className="landing-landscape" viewBox="0 0 1440 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="glow" cx="50%" cy="100%" r="60%">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#7c2d12" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#glow)" />
          
          {/* Hill Layer 1 (Back - light warm brown silhouette with detailed peaks) */}
          <path d="M0,210 L80,190 L160,200 L240,175 L320,185 L400,160 L480,175 L560,140 L640,165 L720,150 L800,180 L880,155 L960,170 L1040,135 L1120,155 L1200,145 L1280,175 L1360,150 L1440,165 L1440,280 L0,280 Z" fill="#2d1305" opacity="0.5" />
          
          {/* Hill Layer 2 (Middle - darker brown silhouette with secondary peaks) */}
          <path d="M0,235 L100,215 L200,225 L300,195 L400,210 L500,180 L600,205 L700,190 L800,215 L900,195 L1000,205 L1100,175 L1200,195 L1300,185 L1440,205 L1440,280 L0,280 Z" fill="#1b0800" opacity="0.85" />
          
          {/* Hill Layer 3 (Front - deep obsidian black) */}
          <path d="M0,260 L120,245 L240,255 L360,235 L480,245 L600,225 L720,240 L840,230 L960,250 L1080,235 L1200,245 L1320,235 L1440,250 L1440,280 L0,280 Z" fill="#09090b" />
        </svg>
      </div>
    </div>
  );
}
