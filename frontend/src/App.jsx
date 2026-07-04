import { useState, useCallback } from 'react';
import { useAmaterasu } from './hooks/useAmaterasu';
import ConceptCanvas from './components/canvas/ConceptCanvas';
import NarrativePanel from './components/dashboard/NarrativePanel';
import CommandBar from './components/dashboard/CommandBar';
import CodeViewer from './components/dashboard/CodeViewer';
import ComparePanel from './components/dashboard/ComparePanel';
import QuizModal from './components/dashboard/QuizModal';
import LandingPage from './components/LandingPage';
import { Flame, Sparkles } from 'lucide-react';

export default function App() {
  const {
    nodes, edges, narrative,
    isAnalyzing, isStreaming, highlightedNodes, highlightedEdges,
    error, repoPath,
    selectedFile, fileContent, isLoadingFile,
    chatHistory,
    analyze, generateNarrative,
    selectFile, closeFileViewer,
    setNodes, setEdges, setError,
  } = useAmaterasu();

  const [canvasWidthPercent, setCanvasWidthPercent] = useState(50);
  const [narrativeHeightPercent, setNarrativeHeightPercent] = useState(50);
  const [isResizingCanvas, setIsResizingCanvas] = useState(false);
  const [isResizingCode, setIsResizingCode] = useState(false);

  // Compare & Quiz panel state
  const [showCompare, setShowCompare] = useState(false);
  const [quizLevel, setQuizLevel] = useState(null); // null | 'beginner' | 'advanced'

  const startCanvasResize = useCallback((e) => {
    e.preventDefault();
    setIsResizingCanvas(true);
    document.body.classList.add('is-resizing-v');
    const startX = e.clientX;
    const startPercent = canvasWidthPercent;
    const container = document.querySelector('.app-main');
    const containerWidth = container ? container.getBoundingClientRect().width : window.innerWidth;

    const doDrag = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newPercent = Math.max(20, Math.min(80, startPercent + deltaPercent));
      setCanvasWidthPercent(newPercent);
    };

    const stopDrag = () => {
      setIsResizingCanvas(false);
      document.body.classList.remove('is-resizing-v');
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  }, [canvasWidthPercent]);

  const startCodeResize = useCallback((e) => {
    e.preventDefault();
    setIsResizingCode(true);
    document.body.classList.add('is-resizing-h');
    const startY = e.clientY;
    const startPercent = narrativeHeightPercent;
    const container = document.querySelector('.panel-dashboard');
    const containerHeight = container ? container.getBoundingClientRect().height : window.innerHeight;

    const doDrag = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaPercent = (deltaY / containerHeight) * 100;
      const newPercent = Math.max(20, Math.min(80, startPercent + deltaPercent));
      setNarrativeHeightPercent(newPercent);
    };

    const stopDrag = () => {
      setIsResizingCode(false);
      document.body.classList.remove('is-resizing-h');
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  }, [narrativeHeightPercent]);

  const hasRepo = nodes.length > 0;

  const handleReset = () => {
    setNodes([]);
    setEdges([]);
    setError(null);
    closeFileViewer();
    setShowCompare(false);
    setQuizLevel(null);
  };

  if (!hasRepo) {
    return (
      <LandingPage
        onAnalyze={analyze}
        isAnalyzing={isAnalyzing}
        error={error}
        setError={setError}
      />
    );
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo" onClick={handleReset} style={{ cursor: 'pointer' }} title="Return to landing page">
          <div className="app-logo-icon">
            <Flame size={16} color="white" />
          </div>
          <span className="app-logo-text">AMATERASU</span>
        </div>

        <div className="app-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {hasRepo && (
            <>
              {/* Story Button */}
              <button
                className="header-action-btn story-btn"
                onClick={() => generateNarrative('Explain the overall architecture of this codebase')}
                disabled={isAnalyzing || isStreaming}
                title="Explain overall architecture"
              >
                <Sparkles size={13} />
                Story
              </button>
            </>
          )}
          {isAnalyzing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <div className="spinner spinner-sm" />
              Parsing AST...
            </div>
          )}
          {hasRepo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <span className="status-dot active" />
              {repoPath.split(/[/\\]/).pop()}
            </div>
          )}
        </div>
      </header>

      {/* Main workspace */}
      <main className="app-main" style={isResizingCanvas || isResizingCode ? { userSelect: 'none' } : {}}>
        {/* Left: Canvas */}
        <div style={{ width: `${canvasWidthPercent}%`, height: '100%', position: 'relative' }}>
          <ConceptCanvas
            nodes={nodes}
            edges={edges}
            highlightedNodes={highlightedNodes}
            highlightedEdges={highlightedEdges}
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
            onNodeClick={selectFile}
          />
        </div>

        {/* Vertical Resizer */}
        <div
          className={`resize-divider-vertical ${isResizingCanvas ? 'resizing' : ''}`}
          onMouseDown={startCanvasResize}
        />

        {/* Right: Dashboard */}
        <div className="panel-dashboard" style={{ width: `${100 - canvasWidthPercent}%` }}>

          {/* Compare Panel (replaces normal content when open) */}
          {showCompare ? (
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <ComparePanel
                nodes={nodes}
                onClose={() => setShowCompare(false)}
              />
            </div>
          ) : selectedFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ height: `${narrativeHeightPercent}%`, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <CodeViewer
                  fileContent={fileContent}
                  isLoading={isLoadingFile}
                  onClose={closeFileViewer}
                />
              </div>

              {/* Horizontal Resizer */}
              <div
                className={`resize-divider-horizontal ${isResizingCode ? 'resizing' : ''}`}
                onMouseDown={startCodeResize}
              />

              <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                <NarrativePanel
                  narrative={narrative}
                  isStreaming={isStreaming}
                  error={error}
                  chatHistory={chatHistory}
                />
              </div>
            </div>
          ) : (
            <NarrativePanel
              narrative={narrative}
              isStreaming={isStreaming}
              error={error}
              chatHistory={chatHistory}
            />
          )}

          <CommandBar
            onAnalyze={analyze}
            onNarrative={generateNarrative}
            isAnalyzing={isAnalyzing}
            isStreaming={isStreaming}
            hasRepo={hasRepo}
            onOpenCompare={() => { setShowCompare(true); closeFileViewer(); }}
            onOpenQuiz={(level) => setQuizLevel(level)}
          />
        </div>
      </main>

      {/* Quiz Modal Overlay */}
      {quizLevel && (
        <QuizModal
          initialLevel={quizLevel}
          onClose={() => setQuizLevel(null)}
        />
      )}
    </div>
  );
}
