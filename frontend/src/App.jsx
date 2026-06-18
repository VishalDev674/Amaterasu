import { useAmaterasu } from './hooks/useAmaterasu';
import ConceptCanvas from './components/canvas/ConceptCanvas';
import TelemetryCards from './components/dashboard/TelemetryCards';
import NarrativePanel from './components/dashboard/NarrativePanel';
import CommandBar from './components/dashboard/CommandBar';
import { Flame } from 'lucide-react';

export default function App() {
  const {
    nodes, edges, clusters, telemetry, narrative,
    isAnalyzing, isStreaming, highlightedNodes, highlightedEdges,
    error, repoPath, actions,
    analyze, generateNarrative, traceFlow, clearTrace,
    setNodes, setEdges,
  } = useAmaterasu();

  const hasRepo = nodes.length > 0;

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">
            <Flame size={16} color="white" />
          </div>
          <span className="app-logo-text">AMATERASU</span>
          <span className="app-logo-badge">v2.0</span>
        </div>

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
        />

        {/* Right: Dashboard */}
        <div className="panel-dashboard">
          <TelemetryCards telemetry={telemetry} />

          <NarrativePanel
            narrative={narrative}
            isStreaming={isStreaming}
            error={error}
          />

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
