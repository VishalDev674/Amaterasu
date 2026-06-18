import { useState, useRef, useEffect } from 'react';
import { Send, FolderSearch, Route, Sparkles, ChevronUp, X } from 'lucide-react';

export default function CommandBar({
  onAnalyze,
  onNarrative,
  onTrace,
  onClearTrace,
  actions,
  isAnalyzing,
  isStreaming,
  hasRepo,
  activeTrace,
}) {
  const [input, setInput] = useState('');
  const [showTraceMenu, setShowTraceMenu] = useState(false);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowTraceMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // If input looks like a path or git URL, analyze it
    // Windows: C:\path or C:/path, Unix: /path, relative: ./path or ../path
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
      // Try it as a path anyway — user may have just typed a path without a drive letter
      onAnalyze(trimmed);
    }
    setInput('');
  };

  const handleTraceAction = (actionName) => {
    setShowTraceMenu(false);
    onTrace(actionName);
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
          <button
            className="command-action-btn"
            onClick={() => onNarrative('Explain the overall architecture of this codebase')}
            disabled={isBusy}
          >
            <Sparkles size={14} />
            Story
          </button>

          <div className="trace-dropdown" ref={menuRef}>
            <button
              className={`command-action-btn ${activeTrace ? 'active' : ''}`}
              onClick={() => {
                if (activeTrace) {
                  onClearTrace();
                } else {
                  setShowTraceMenu(!showTraceMenu);
                }
              }}
              disabled={isAnalyzing}
            >
              {activeTrace ? <X size={14} /> : <Route size={14} />}
              {activeTrace ? 'Clear' : 'Trace'}
              {!activeTrace && <ChevronUp size={10} />}
            </button>

            {showTraceMenu && (
              <div className="trace-dropdown-menu">
                {(actions.length > 0 ? actions : [
                  { name: 'User Login', description: 'Auth flow trace' },
                  { name: 'API Request', description: 'Request pipeline' },
                  { name: 'Data Query', description: 'DB read operation' },
                ]).map((action) => (
                  <button
                    key={action.name}
                    className="trace-dropdown-item"
                    onClick={() => handleTraceAction(action.name)}
                  >
                    {action.name}
                    <span className="trace-dropdown-item-desc">{action.description}</span>
                  </button>
                ))}
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
          placeholder={hasRepo ? 'Ask about the architecture...' : 'Enter path to analyze (e.g. C:\Users\you\project)'}
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
