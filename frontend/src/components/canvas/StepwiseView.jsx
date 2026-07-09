import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, ArrowLeft, ArrowDown, Layers } from 'lucide-react';

export default function StepwiseView({ nodes, highlightedNodes, onNodeClick }) {
  const [expandedSteps, setExpandedSteps] = useState(new Set());
  const [hoveredStep, setHoveredStep] = useState(null);

  const toggleExpand = (stepId) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const steps = useMemo(() => {
    if (!nodes || nodes.length === 0) return [];
    const clusterNodes = nodes.filter(n => n.type === 'conceptNode');
    const fileNodes = nodes.filter(n => n.type === 'fileNode');

    return clusterNodes.map(cluster => {
      const domainName = cluster.data.label;
      const clusterFiles = fileNodes.filter(f => f.data.parentCluster === domainName);
      const isHighlighted = highlightedNodes?.has(cluster.id);
      return {
        id: cluster.id,
        label: domainName,
        icon: cluster.data.icon,
        color: cluster.data.color,
        fileCount: cluster.data.fileCount,
        isHighlighted,
        files: clusterFiles.map(f => ({
          id: f.id,
          name: f.data.label,
          fullPath: f.data.fullPath,
          language: f.data.language,
          lineCount: f.data.lineCount,
          functions: f.data.functions,
          classes: f.data.classes,
          isHighlighted: highlightedNodes?.has(f.id),
        })).sort((a, b) => b.lineCount - a.lineCount),
      };
    }).sort((a, b) => b.fileCount - a.fileCount);
  }, [nodes, highlightedNodes]);

  const handleFileClick = (filePath) => {
    if (onNodeClick && filePath) onNodeClick(filePath);
  };

  const langColors = {
    javascript: '#f7df1e', typescript: '#3178c6', python: '#3572a5',
    go: '#00add8', rust: '#dea584', java: '#b07219', css: '#563d7c',
    scss: '#c6538c', html: '#e34c26', ruby: '#701516', php: '#4f5d95',
    csharp: '#178600', swift: '#f05138', kotlin: '#a97bff', dart: '#00b4ab',
    shell: '#89e051', yaml: '#cb171e', json: '#9ca3af', markdown: '#083fa1',
    sql: '#e38c00', dockerfile: '#384d54', text: '#78716c',
  };

  const langIcons = {
    javascript: 'JS', typescript: 'TS', python: 'PY', go: 'GO',
    rust: 'RS', java: 'JV', css: 'CSS', html: 'HTM', ruby: 'RB',
    php: 'PHP', csharp: 'C#', swift: 'SW', kotlin: 'KT', dart: 'DT',
    shell: 'SH', yaml: 'YML', json: 'JSON', markdown: 'MD', sql: 'SQL',
  };

  if (steps.length === 0) {
    return (
      <div className="stepwise-empty">
        <Layers size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
        <span>No clusters to display</span>
      </div>
    );
  }

  return (
    <div className="stepwise-container">
      {/* Ambient background orbs */}
      <div className="stepwise-bg-orb stepwise-bg-orb--1" />
      <div className="stepwise-bg-orb stepwise-bg-orb--2" />

      {/* Header */}
      <div className="stepwise-header">
        <div className="stepwise-header-icon"><Layers size={14} /></div>
        <span className="stepwise-header-title">Architecture Map</span>
        <span className="stepwise-header-count">{steps.length} domains · {steps.reduce((a, s) => a + s.fileCount, 0)} files</span>
      </div>

      <div className="stepwise-grid">
        {steps.map((step, index) => {
          const r = Math.floor(index / 3);
          const c = index % 3;
          const isEvenRow = r % 2 === 0;

          const stepRow = r * 2 + 1;
          const stepCol = isEvenRow ? c * 2 + 1 : 5 - c * 2;

          const isExpanded = expandedSteps.has(step.id);
          const displayedFiles = isExpanded ? step.files : step.files.slice(0, 4);
          const hiddenCount = step.files.length - 4;

          let connector = null;
          if (index < steps.length - 1) {
            if (c < 2) {
              const connRow = stepRow;
              const connCol = isEvenRow ? c * 2 + 2 : 4 - c * 2;
              connector = {
                type: 'horizontal',
                dir: isEvenRow ? 'right' : 'left',
                gridRow: connRow,
                gridColumn: connCol,
                color: step.color,
              };
            } else {
              const connRow = stepRow + 1;
              const connCol = isEvenRow ? 5 : 1;
              connector = {
                type: 'vertical',
                dir: 'down',
                gridRow: connRow,
                gridColumn: connCol,
                color: step.color,
              };
            }
          }

          const isHovered = hoveredStep === step.id;

          return (
            <div key={step.id} style={{ display: 'contents' }}>
              {/* Step Card */}
              <div
                className={`stepwise-step${step.isHighlighted ? ' highlighted' : ''}${isHovered ? ' hovered' : ''}`}
                style={{
                  gridRow: stepRow,
                  gridColumn: stepCol,
                  '--step-color': step.color,
                  '--step-color-dim': `${step.color}18`,
                  '--step-color-mid': `${step.color}35`,
                }}
                onMouseEnter={() => setHoveredStep(step.id)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Top glow bar */}
                <div className="stepwise-step-glow-bar" style={{ background: step.color }} />

                {/* Background shine */}
                <div className="stepwise-step-shine" />

                {/* Step number watermark */}
                <span className="stepwise-step-watermark">
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Header */}
                <div className="stepwise-step-header">
                  <div
                    className="stepwise-step-icon-wrapper"
                    style={{
                      background: `${step.color}20`,
                      border: `1.5px solid ${step.color}50`,
                      boxShadow: `0 0 12px ${step.color}30`,
                    }}
                  >
                    <span className="stepwise-step-icon">{step.icon}</span>
                  </div>
                  <div className="stepwise-step-info">
                    <span className="stepwise-step-title">{step.label}</span>
                    <span className="stepwise-step-count" style={{ color: step.color }}>
                      {step.fileCount} {step.fileCount === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                </div>

                {/* File List */}
                <div className="stepwise-files">
                  {displayedFiles.map((file) => {
                    const lc = langColors[file.language] || '#78716c';
                    const li = langIcons[file.language] || (file.language || '?').slice(0, 3).toUpperCase();
                    return (
                      <button
                        key={file.id}
                        className={`stepwise-file${file.isHighlighted ? ' highlighted' : ''}`}
                        onClick={() => handleFileClick(file.fullPath)}
                        title={`${file.fullPath} — Click to view code`}
                        style={{ '--file-lang-color': lc }}
                      >
                        <span className="stepwise-file-lang-badge" style={{ color: lc, background: `${lc}18`, border: `1px solid ${lc}35` }}>
                          {li}
                        </span>
                        <span className="stepwise-file-name">{file.name}</span>
                        <div className="stepwise-file-stats">
                          <span className="stepwise-file-stat">{file.lineCount}L</span>
                          {file.functions > 0 && <span className="stepwise-file-stat">{file.functions}fn</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Expand / Collapse */}
                {hiddenCount > 0 && (
                  <button
                    className="stepwise-show-more-btn"
                    onClick={() => toggleExpand(step.id)}
                    style={{ '--step-color': step.color }}
                  >
                    {isExpanded ? (
                      <>Show less <ChevronUp size={11} /></>
                    ) : (
                      <>+{hiddenCount} more <ChevronDown size={11} /></>
                    )}
                  </button>
                )}
              </div>

              {/* Connector */}
              {connector && (
                <div
                  className={`stepwise-connector stepwise-connector--${connector.type} stepwise-connector--${connector.dir}`}
                  style={{
                    gridRow: connector.gridRow,
                    gridColumn: connector.gridColumn,
                    '--connector-color': connector.color,
                  }}
                >
                  <div className="stepwise-connector-line" />
                  <div className="stepwise-connector-arrow">
                    {connector.dir === 'right' && <ArrowRight size={14} />}
                    {connector.dir === 'left' && <ArrowLeft size={14} />}
                    {connector.dir === 'down' && <ArrowDown size={14} />}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
