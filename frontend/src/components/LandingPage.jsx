import { useState, useEffect } from 'react';
import { ArrowRight, GitBranch, Cpu, Network, Brain, Sparkles, CheckCircle2, Zap } from 'lucide-react';

// Stable particles
const PARTICLES = Array.from({ length: 25 }).map((_, i) => {
  const size = Math.random() * 3 + 1;
  const left = Math.random() * 100;
  const bottom = Math.random() * 20;
  const delay = Math.random() * 8;
  const duration = Math.random() * 8 + 8;
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

// Pipeline steps definition
const PIPELINE_STEPS = [
  {
    id: 'clone',
    icon: GitBranch,
    label: 'Cloning Repository',
    desc: 'Fetching source code from GitHub',
    color: '#3b82f6',
    duration: 3000,
    facts: [
      'Using shallow clone (--depth 1) for speed',
      'Downloading source tree structure',
      'Resolving Git objects & refs',
    ],
  },
  {
    id: 'ast',
    icon: Cpu,
    label: 'Parsing AST',
    desc: 'Building Abstract Syntax Trees for each file',
    color: '#f59e0b',
    duration: 3500,
    facts: [
      'Detecting languages: JS, TS, Python, Go...',
      'Extracting functions, classes & imports',
      'Mapping inter-file dependencies',
    ],
  },
  {
    id: 'cluster',
    icon: Network,
    label: 'Clustering Domains',
    desc: 'Grouping files by conceptual responsibility',
    color: '#8b5cf6',
    duration: 2500,
    facts: [
      'Classifying: Auth, API, Database, UI...',
      'Building dependency graph edges',
      'Calculating file metrics & sizes',
    ],
  },
  {
    id: 'vector',
    icon: Brain,
    label: 'Indexing Vectors',
    desc: 'Embedding code semantics for AI search',
    color: '#10b981',
    duration: 2000,
    facts: [
      'Generating semantic embeddings',
      'Building in-memory vector store',
      'Enabling natural language queries',
    ],
  },
  {
    id: 'map',
    icon: Sparkles,
    label: 'Building Concept Map',
    desc: 'Generating interactive architecture graph',
    color: '#ea580c',
    duration: 1500,
    facts: [
      'Positioning nodes in circular layout',
      'Rendering React Flow graph',
      'Connecting dependency edges',
    ],
  },
];

function PipelineStep({ step, status, factIndex, isLast }) {
  // status: 'waiting' | 'active' | 'done'
  const Icon = step.icon;
  const isDone = status === 'done';
  const isActive = status === 'active';
  const isWaiting = status === 'waiting';

  return (
    <div className={`aflow-step ${status}`} style={{ '--step-color': step.color }}>
      {/* Icon bubble */}
      <div className={`aflow-step-icon-wrap ${isActive ? 'aflow-pulse' : ''}`}
        style={{
          background: isDone
            ? `${step.color}22`
            : isActive
              ? `${step.color}18`
              : 'rgba(255,255,255,0.03)',
          border: `1.5px solid ${isDone || isActive ? step.color + '60' : 'rgba(255,255,255,0.06)'}`,
          boxShadow: isActive ? `0 0 20px ${step.color}35` : isDone ? `0 0 12px ${step.color}20` : 'none',
        }}
      >
        {isDone ? (
          <CheckCircle2 size={20} style={{ color: step.color }} />
        ) : isActive ? (
          <Icon size={20} style={{ color: step.color }} />
        ) : (
          <Icon size={20} style={{ color: 'rgba(255,255,255,0.15)' }} />
        )}
      </div>

      {/* Connector line */}
      {!isLast && (
        <div className={`aflow-connector ${isDone ? 'aflow-connector--done' : isActive ? 'aflow-connector--active' : ''}`}
          style={{
            '--line-color': step.color,
          }}
        >
          <div className="aflow-connector-line" />
          {isActive && <div className="aflow-connector-pulse" style={{ background: step.color }} />}
        </div>
      )}

      {/* Text */}
      <div className="aflow-step-text">
        <div className={`aflow-step-label ${isActive ? 'aflow-step-label--active' : ''} ${isDone ? 'aflow-step-label--done' : ''}`}
          style={isActive ? { color: step.color } : {}}
        >
          {step.label}
        </div>
        <div className="aflow-step-desc">
          {isActive && step.facts[factIndex % step.facts.length]
            ? step.facts[factIndex % step.facts.length]
            : step.desc}
        </div>
      </div>

      {/* Status badge */}
      <div className="aflow-step-status">
        {isDone && (
          <span className="aflow-badge aflow-badge--done" style={{ color: step.color, background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
            done
          </span>
        )}
        {isActive && (
          <span className="aflow-badge aflow-badge--active" style={{ color: step.color, background: `${step.color}15`, border: `1px solid ${step.color}40` }}>
            <span className="aflow-badge-dot" style={{ background: step.color }} />
            running
          </span>
        )}
        {isWaiting && (
          <span className="aflow-badge aflow-badge--waiting">
            queued
          </span>
        )}
      </div>
    </div>
  );
}

function AnalysisFlowchart({ repoUrl }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startTime] = useState(() => Date.now());

  // Cycle through fun facts for the active step
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex(f => f + 1);
    }, 1800);
    return () => clearInterval(interval);
  }, [currentStep]);

  // Advance steps based on timing
  useEffect(() => {
    if (currentStep >= PIPELINE_STEPS.length) return;
    const duration = PIPELINE_STEPS[currentStep].duration;
    const timer = setTimeout(() => {
      setCurrentStep(s => s + 1);
      setFactIndex(0);
    }, duration);
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Elapsed time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [startTime]);

  const repoName = repoUrl
    ? repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\.git$/, '')
    : 'repository';

  const elapsed = (elapsedMs / 1000).toFixed(1);
  const totalDone = Math.min(currentStep, PIPELINE_STEPS.length);

  return (
    <div className="aflow-overlay animate-fade-in">
      {/* Ambient orbs */}
      <div className="aflow-orb aflow-orb--1" />
      <div className="aflow-orb aflow-orb--2" />
      <div className="aflow-orb aflow-orb--3" />

      <div className="aflow-card">
        {/* Header */}
        <div className="aflow-header">
          <div className="aflow-header-left">
            <div className="aflow-header-icon">
              <Zap size={16} color="white" />
            </div>
            <div>
              <div className="aflow-header-title">Analyzing Repository</div>
              <div className="aflow-header-repo">{repoName}</div>
            </div>
          </div>
          <div className="aflow-header-right">
            <div className="aflow-elapsed">{elapsed}s</div>
            <div className="aflow-step-count">{totalDone}/{PIPELINE_STEPS.length} steps</div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="aflow-progress-track">
          <div
            className="aflow-progress-fill"
            style={{ width: `${(totalDone / PIPELINE_STEPS.length) * 100}%` }}
          />
          {/* Current step sub-progress (fully controlled via hardware-accelerated CSS keyframes) */}
          {currentStep < PIPELINE_STEPS.length && (
            <div
              key={currentStep}
              className="aflow-progress-sub"
              style={{
                left: `${(totalDone / PIPELINE_STEPS.length) * 100}%`,
                width: 0,
                '--step-duration': `${PIPELINE_STEPS[currentStep].duration}ms`,
                background: PIPELINE_STEPS[currentStep]?.color,
              }}
            />
          )}
        </div>

        {/* Pipeline steps */}
        <div className="aflow-steps">
          {PIPELINE_STEPS.map((step, i) => {
            const status =
              i < currentStep ? 'done' :
              i === currentStep ? 'active' :
              'waiting';
            return (
              <PipelineStep
                key={step.id}
                step={step}
                status={status}
                factIndex={factIndex}
                isLast={i === PIPELINE_STEPS.length - 1}
              />
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="aflow-footer">
          <Sparkles size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span>Building your interactive architecture map — this usually takes 10–30 seconds</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onAnalyze, isAnalyzing, error, setError }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isAnalyzing) return;
    onAnalyze(input.trim());
  };

  // Show flowchart overlay when analyzing
  if (isAnalyzing) {
    return (
      <div className="landing-container">
        <div className="landing-particles">
          {PARTICLES.map(p => <div key={p.id} style={p.style} />)}
        </div>
        <AnalysisFlowchart repoUrl={input} />
        <div className="landing-landscape-wrapper" style={{ opacity: 0.3 }}>
          <svg className="landing-landscape" viewBox="0 0 1440 280" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="glow2" cx="50%" cy="100%" r="60%">
                <stop offset="0%" stopColor="#ea580c" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#glow2)" />
            <path d="M0,210 L80,190 L160,200 L240,175 L320,185 L400,160 L480,175 L560,140 L640,165 L720,150 L800,180 L880,155 L960,170 L1040,135 L1120,155 L1200,145 L1280,175 L1360,150 L1440,165 L1440,280 L0,280 Z" fill="#2d1305" opacity="0.5" />
            <path d="M0,235 L100,215 L200,225 L300,195 L400,210 L500,180 L600,205 L700,190 L800,215 L900,195 L1000,205 L1100,175 L1200,195 L1300,185 L1440,205 L1440,280 L0,280 Z" fill="#1b0800" opacity="0.85" />
            <path d="M0,260 L120,245 L240,255 L360,235 L480,245 L600,225 L720,240 L840,230 L960,250 L1080,235 L1200,245 L1320,235 L1440,250 L1440,280 L0,280 Z" fill="#09090b" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-container">
      {/* Background embers */}
      <div className="landing-particles">
        {PARTICLES.map(p => <div key={p.id} style={p.style} />)}
      </div>

      {/* Main content */}
      <div className="landing-content animate-fade-in">
        <span className="landing-badge">NEXT-GENERATION CODE INTELLIGENCE</span>
        <h1 className="landing-title">AMATERASU</h1>
        <p className="landing-desc">
          Transform complex codebases into living architectural maps.
        </p>
        <p className="landing-italic">
          Stop reading files. Start understanding systems.
        </p>

        {/* Input box */}
        <form className="landing-form" onSubmit={handleSubmit}>
          <div className="landing-input-wrapper">
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="landing-input-icon">
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
              placeholder="github.com/user/project  or  C:\path\to\local\project"
              disabled={isAnalyzing}
            />
          </div>

          <button type="submit" className="landing-btn" disabled={!input.trim() || isAnalyzing}>
            <span className="landing-btn-inner">
              ANALYZE REPOSITORY <ArrowRight size={14} />
            </span>
          </button>
        </form>

        {error && (
          <div className="landing-error">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}
      </div>

      {/* Landscape */}
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
          <path d="M0,210 L80,190 L160,200 L240,175 L320,185 L400,160 L480,175 L560,140 L640,165 L720,150 L800,180 L880,155 L960,170 L1040,135 L1120,155 L1200,145 L1280,175 L1360,150 L1440,165 L1440,280 L0,280 Z" fill="#2d1305" opacity="0.5" />
          <path d="M0,235 L100,215 L200,225 L300,195 L400,210 L500,180 L600,205 L700,190 L800,215 L900,195 L1000,205 L1100,175 L1200,195 L1300,185 L1440,205 L1440,280 L0,280 Z" fill="#1b0800" opacity="0.85" />
          <path d="M0,260 L120,245 L240,255 L360,235 L480,245 L600,225 L720,240 L840,230 L960,250 L1080,235 L1200,245 L1320,235 L1440,250 L1440,280 L0,280 Z" fill="#09090b" />
        </svg>
      </div>
    </div>
  );
}
