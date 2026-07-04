import { useState, useRef, useEffect } from 'react';
import { Send, FolderSearch, GitCompare, Brain, BookOpen, Zap } from 'lucide-react';

export default function CommandBar({
  onAnalyze,
  onNarrative,
  isAnalyzing,
  isStreaming,
  hasRepo,
  onOpenCompare,
  onOpenQuiz,
}) {
  const [input, setInput] = useState('');
  const [showQuizMenu, setShowQuizMenu] = useState(false);
  const inputRef = useRef(null);
  const quizMenuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (quizMenuRef.current && !quizMenuRef.current.contains(e.target)) {
        setShowQuizMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const trimmed = input.trim();
    const isWindowsPath = /^[a-zA-Z]:[/\\]/.test(trimmed);
    const isUnixPath = trimmed.startsWith('/');
    const isRelativePath = trimmed.startsWith('./') || trimmed.startsWith('../');
    const isGitUrl = /^(https?:\/\/|git@)/.test(trimmed) || trimmed.includes('github.com') || trimmed.includes('gitlab.com') || trimmed.includes('bitbucket.org');

    if (isWindowsPath || isUnixPath || isRelativePath || isGitUrl) {
      onAnalyze(trimmed);
    } else if (hasRepo) {
      onNarrative(trimmed);
    } else {
      onAnalyze(trimmed);
    }
    setInput('');
  };

  const isBusy = isAnalyzing || isStreaming;

  return (
    <div className="command-bar">
      {/* Action Buttons */}
      {!hasRepo && (
        <button
          className="command-action-btn"
          onClick={() => {
            inputRef.current?.focus();
            setInput('');
          }}
          title="Enter a local folder path to analyze"
        >
          <FolderSearch size={14} />
          Analyze
        </button>
      )}

      {hasRepo && (
        <>
          {/* Compare Button */}
          <button
            className="command-action-btn command-action-btn--compare"
            onClick={onOpenCompare}
            disabled={isAnalyzing}
            title="Compare two files"
          >
            <GitCompare size={14} />
            Compare
          </button>

          {/* Quiz Dropdown */}
          <div className="trace-dropdown" ref={quizMenuRef}>
            <button
              className="command-action-btn command-action-btn--quiz"
              onClick={() => setShowQuizMenu(v => !v)}
              disabled={isAnalyzing}
              title="Start a quiz"
            >
              <Brain size={14} />
              Quiz
            </button>

            {showQuizMenu && (
              <div className="trace-dropdown-menu">
                <button
                  className="trace-dropdown-item"
                  onClick={() => { setShowQuizMenu(false); onOpenQuiz('beginner'); }}
                >
                  <BookOpen size={13} color="#22c55e" />
                  Beginner
                  <span className="trace-dropdown-item-desc">Conceptual questions</span>
                </button>
                <button
                  className="trace-dropdown-item"
                  onClick={() => { setShowQuizMenu(false); onOpenQuiz('advanced'); }}
                >
                  <Zap size={13} color="#f97316" />
                  Advanced
                  <span className="trace-dropdown-item-desc">Deep-dive implementation</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Input */}
      <form className="command-input-wrapper" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="command-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={hasRepo ? 'Ask about the architecture...' : 'Enter path to analyze (e.g. C:\\Users\\you\\project)'}
          disabled={isBusy}
        />
        <button
          type="submit"
          className="command-send-btn"
          disabled={!input.trim() || isBusy}
        >
          {isBusy ? <div className="spinner spinner-sm" /> : <Send size={14} />}
        </button>
      </form>
    </div>
  );
}
