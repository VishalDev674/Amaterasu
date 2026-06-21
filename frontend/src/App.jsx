import { useAmaterasu } from './hooks/useAmaterasu';
import ConceptCanvas from './components/canvas/ConceptCanvas';
import HeaderStats from './components/dashboard/TelemetryCards';
import NarrativePanel from './components/dashboard/NarrativePanel';
import CommandBar from './components/dashboard/CommandBar';
import CodeViewer from './components/dashboard/CodeViewer';
import LandingPage from './components/LandingPage';
import { Flame } from 'lucide-react';

export default function App() {
  const {
    nodes, edges, clusters, telemetry, narrative,
    isAnalyzing, isStreaming, highlightedNodes, highlightedEdges,
    error, repoPath, actions,
    selectedFile, fileContent, isLoadingFile,
    analyze, generateNarrative, traceFlow, clearTrace,
    selectFile, closeFileViewer,
    setNodes, setEdges, setError,
  } = useAmaterasu();

  const hasRepo = nodes.length > 0;

  const handleReset = () => {
    setNodes([]);
    setEdges([]);
    setError(null);
    closeFileViewer();
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
          <span className="app-logo-badge">v2.0</span>
        </div>

        {/* Center: Compact Stats */}
        <HeaderStats telemetry={telemetry} />

        <div className="app-header-actions">
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
      <main className="app-main">
        {/* Left: Canvas */}
        <ConceptCanvas
          nodes={nodes}
          edges={edges}
          highlightedNodes={highlightedNodes}
          highlightedEdges={highlightedEdges}
          onNodesChange={setNodes}
          onEdgesChange={setEdges}
          onNodeClick={selectFile}
        />

        {/* Right: Dashboard */}
        <div className="panel-dashboard">
          {/* Code Viewer replaces the top area when a file is selected */}
          {selectedFile ? (
            <CodeViewer
              fileContent={fileContent}
              isLoading={isLoadingFile}
              onClose={closeFileViewer}
            />
          ) : (
            <NarrativePanel
              narrative={narrative}
              isStreaming={isStreaming}
              error={error}
            />
          )}

          <CommandBar
            onAnalyze={analyze}
            onNarrative={generateNarrative}
            onTrace={traceFlow}
            onClearTrace={clearTrace}
            actions={actions}
            isAnalyzing={isAnalyzing}
            isStreaming={isStreaming}
            hasRepo={hasRepo}
            activeTrace={telemetry.activeTrace}
          />
        </div>
      </main>
    </div>
  );
}
