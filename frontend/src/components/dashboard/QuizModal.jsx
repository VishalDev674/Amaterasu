import { useState, useEffect, useRef } from 'react';
import { Brain, X, CheckCircle, XCircle, ChevronRight, Trophy, RefreshCw, BookOpen, Zap, Loader2, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3001/api';

async function fetchQuiz(level) {
  const res = await fetch(`${API_BASE}/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level }),
  });
  if (!res.ok) throw new Error('Failed to generate quiz');
  return res.json();
}

const LEVEL_CONFIG = {
  beginner: {
    label: 'Beginner',
    icon: <BookOpen size={16} />,
    color: '#22c55e',
    colorSubtle: 'rgba(34,197,94,0.12)',
    colorBorder: 'rgba(34,197,94,0.3)',
    description: 'Conceptual questions about the codebase structure and patterns',
  },
  advanced: {
    label: 'Advanced',
    icon: <Zap size={16} />,
    color: '#f97316',
    colorSubtle: 'rgba(249,115,22,0.12)',
    colorBorder: 'rgba(249,115,22,0.3)',
    description: 'Deep-dive into implementation details and design decisions',
  },
};

export default function QuizModal({ onClose, initialLevel }) {
  const [phase, setPhase] = useState('select'); // select | loading | quiz | result
  const [level, setLevel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);

  const startQuiz = async (selectedLevel) => {
    setLevel(selectedLevel);
    setPhase('loading');
    setError(null);
    try {
      const data = await fetchQuiz(selectedLevel);
      setQuestions(data.questions || []);
      setCurrentIdx(0);
      setScore(0);
      setAnswers([]);
      setSelectedOption(null);
      setConfirmed(false);
      setPhase('quiz');
    } catch (err) {
      setError(err.message || 'Failed to generate quiz. Make sure a repository is analyzed first.');
      setPhase('select');
    }
  };

  // Auto-start with initialLevel if provided
  useEffect(() => {
    if (initialLevel && LEVEL_CONFIG[initialLevel]) {
      setTimeout(() => {
        startQuiz(initialLevel);
      }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleConfirm = () => {
    if (selectedOption === null) return;
    const q = questions[currentIdx];
    const isCorrect = selectedOption === q.correctIndex;
    setConfirmed(true);
    setAnswers(prev => [...prev, { questionIdx: currentIdx, selectedOption, isCorrect }]);
    if (isCorrect) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      setPhase('result');
    } else {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setConfirmed(false);
    }
  };

  const handleRetry = () => {
    setPhase('select');
    setLevel(null);
    setQuestions([]);
    setCurrentIdx(0);
    setScore(0);
    setAnswers([]);
    setSelectedOption(null);
    setConfirmed(false);
    setError(null);
  };

  const cfg = level ? LEVEL_CONFIG[level] : null;
  const q = questions[currentIdx];
  const totalQ = questions.length;
  const progress = totalQ > 0 ? ((currentIdx + (confirmed ? 1 : 0)) / totalQ) * 100 : 0;

  return (
    <div className="quiz-backdrop" onClick={handleBackdrop}>
      <div className="quiz-modal" ref={modalRef}>
        {/* Header */}
        <div className="quiz-header">
          <div className="quiz-header-left">
            <div className="quiz-header-icon">
              <Brain size={16} color="white" />
            </div>
            <div>
              <div className="quiz-title">Codebase Quiz</div>
              {cfg && (
                <div className="quiz-subtitle" style={{ color: cfg.color }}>
                  {cfg.label} Mode
                </div>
              )}
            </div>
          </div>
          <button className="quiz-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="quiz-body">

          {/* ── PHASE: SELECT ── */}
          {phase === 'select' && (
            <div className="quiz-select-phase">
              <div className="quiz-select-header">
                <p className="quiz-select-desc">
                  Test your understanding of this codebase. Choose a difficulty level to generate AI-powered questions.
                </p>
                {error && (
                  <div className="quiz-error-banner">
                    <AlertTriangle size={14} />
                    <span>{error}</span>
                  </div>
                )}
              </div>
              <div className="quiz-level-cards">
                {Object.entries(LEVEL_CONFIG).map(([key, conf]) => (
                  <button
                    key={key}
                    className="quiz-level-card"
                    style={{ '--card-color': conf.color, '--card-color-subtle': conf.colorSubtle, '--card-color-border': conf.colorBorder }}
                    onClick={() => startQuiz(key)}
                  >
                    <div className="quiz-level-card-icon" style={{ color: conf.color, background: conf.colorSubtle }}>
                      {conf.icon}
                    </div>
                    <div className="quiz-level-card-content">
                      <div className="quiz-level-card-label" style={{ color: conf.color }}>{conf.label}</div>
                      <div className="quiz-level-card-desc">{conf.description}</div>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── PHASE: LOADING ── */}
          {phase === 'loading' && (
            <div className="quiz-loading-phase">
              <div className="quiz-loading-spinner">
                <Loader2 size={36} className="quiz-spin-icon" style={{ color: cfg?.color }} />
              </div>
              <div className="quiz-loading-text">Generating {cfg?.label} quiz...</div>
              <div className="quiz-loading-sub">AI is analyzing your codebase</div>
            </div>
          )}

          {/* ── PHASE: QUIZ ── */}
          {phase === 'quiz' && q && (
            <div className="quiz-question-phase">
              {/* Progress bar */}
              <div className="quiz-progress-bar-container">
                <div className="quiz-progress-bar" style={{ width: `${progress}%`, background: cfg?.color }} />
              </div>
              <div className="quiz-meta-row">
                <span className="quiz-question-counter">
                  Question {currentIdx + 1} of {totalQ}
                </span>
                <span className="quiz-score-badge" style={{ color: cfg?.color, background: cfg?.colorSubtle, border: `1px solid ${cfg?.colorBorder}` }}>
                  Score: {score}
                </span>
              </div>

              <div className="quiz-question-text">{q.question}</div>

              <div className="quiz-options">
                {q.options.map((opt, idx) => {
                  let optClass = 'quiz-option';
                  if (confirmed) {
                    if (idx === q.correctIndex) optClass += ' quiz-option--correct';
                    else if (idx === selectedOption && idx !== q.correctIndex) optClass += ' quiz-option--wrong';
                    else optClass += ' quiz-option--neutral';
                  } else if (selectedOption === idx) {
                    optClass += ' quiz-option--selected';
                  }
                  return (
                    <button
                      key={idx}
                      className={optClass}
                      onClick={() => !confirmed && setSelectedOption(idx)}
                      disabled={confirmed}
                    >
                      <span className="quiz-option-letter">{String.fromCharCode(65 + idx)}</span>
                      <span className="quiz-option-text">{opt}</span>
                      {confirmed && idx === q.correctIndex && <CheckCircle size={16} color="#22c55e" />}
                      {confirmed && idx === selectedOption && idx !== q.correctIndex && <XCircle size={16} color="#ef4444" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation shown after confirmation */}
              {confirmed && q.explanation && (
                <div className="quiz-explanation animate-fade-in">
                  <span className="quiz-explanation-label">💡 Explanation</span>
                  <p>{q.explanation}</p>
                </div>
              )}

              <div className="quiz-actions-row">
                {!confirmed ? (
                  <button
                    className="quiz-confirm-btn"
                    onClick={handleConfirm}
                    disabled={selectedOption === null}
                    style={{ '--btn-color': cfg?.color, '--btn-color-subtle': cfg?.colorSubtle }}
                  >
                    Confirm Answer
                  </button>
                ) : (
                  <button
                    className="quiz-next-btn"
                    onClick={handleNext}
                    style={{ '--btn-color': cfg?.color, '--btn-color-subtle': cfg?.colorSubtle }}
                  >
                    {currentIdx + 1 >= totalQ ? 'See Results' : 'Next Question'}
                    <ChevronRight size={15} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── PHASE: RESULT ── */}
          {phase === 'result' && (
            <div className="quiz-result-phase animate-fade-in">
              <div className="quiz-result-trophy" style={{ color: cfg?.color }}>
                <Trophy size={48} />
              </div>
              <div className="quiz-result-score-display" style={{ color: cfg?.color }}>
                {score}<span className="quiz-result-score-denom">/{totalQ}</span>
              </div>
              <div className="quiz-result-label">
                {score === totalQ ? '🎉 Perfect Score!' : score >= totalQ * 0.7 ? '👍 Great Job!' : score >= totalQ * 0.4 ? '📚 Keep Learning!' : '🔄 Try Again!'}
              </div>
              <div className="quiz-result-percentage" style={{ color: cfg?.color }}>
                {Math.round((score / totalQ) * 100)}% correct
              </div>

              {/* Answer review */}
              <div className="quiz-result-review">
                {answers.map((ans, i) => (
                  <div key={i} className={`quiz-review-item ${ans.isCorrect ? 'quiz-review-item--correct' : 'quiz-review-item--wrong'}`}>
                    {ans.isCorrect ? <CheckCircle size={13} color="#22c55e" /> : <XCircle size={13} color="#ef4444" />}
                    <span>Q{i + 1}: {questions[ans.questionIdx]?.question?.slice(0, 60)}...</span>
                  </div>
                ))}
              </div>

              <div className="quiz-result-actions">
                <button className="quiz-retry-btn" onClick={handleRetry}>
                  <RefreshCw size={14} />
                  Try Another Quiz
                </button>
                <button className="quiz-same-retry-btn" onClick={() => startQuiz(level)} style={{ '--btn-color': cfg?.color }}>
                  <Zap size={14} />
                  Retry {cfg?.label}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
