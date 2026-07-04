import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, ArrowLeft, ArrowDown } from 'lucide-react';

export default function StepwiseView({ nodes, highlightedNodes, onNodeClick }) {
  const [expandedSteps, setExpandedSteps] = useState(new Set());

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

  // Group nodes by type: clusters and their child file nodes
  const steps = useMemo(() => {
    if (!nodes || nodes.length === 0) return [];

    const clusterNodes = nodes.filter(n => n.type === 'conceptNode');
    const fileNodes = nodes.filter(n => n.type === 'fileNode');

    // Build a map of cluster domain → file nodes
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
        })).sort((a, b) => b.lineCount - a.lineCount), // Sort by size descending (main files first)
      };
    }).sort((a, b) => b.fileCount - a.fileCount); // Sort by file count descending
  }, [nodes, highlightedNodes]);

  const handleFileClick = (filePath) => {
    if (onNodeClick && filePath) {
      onNodeClick(filePath);
    }
  };

  const langColors = {
    javascript: '#f7df1e',
    typescript: '#3178c6',
    python: '#3572a5',
    go: '#00add8',
    rust: '#dea584',
    java: '#b07219',
    css: '#563d7c',
    scss: '#c6538c',
    html: '#e34c26',
    ruby: '#701516',
    php: '#4f5d95',
    csharp: '#178600',
    swift: '#f05138',
    kotlin: '#a97bff',
    dart: '#00b4ab',
    shell: '#89e051',
    yaml: '#cb171e',
    json: '#292929',
    markdown: '#083fa1',
    sql: '#e38c00',
    dockerfile: '#384d54',
    text: '#78716c',
  };

  if (steps.length === 0) {
    return (
      <div className="stepwise-empty">
        <span>No clusters to display</span>
      </div>
    );
  }

  return (
    <div className="stepwise-container">
      <div className="stepwise-grid">
        {steps.map((step, index) => {
          const r = Math.floor(index / 3);
          const c = index % 3;
          const isEvenRow = r % 2 === 0;

          // Step Card Position in a 5-column grid (Step, Arrow, Step, Arrow, Step)
          const stepRow = r * 2 + 1;
          const stepCol = isEvenRow ? c * 2 + 1 : 5 - c * 2;

          const isExpanded = expandedSteps.has(step.id);
          const displayedFiles = isExpanded ? step.files : step.files.slice(0, 3);
          const hiddenCount = step.files.length - 3;

          // Determine connector to next step
          let connector = null;
          if (index < steps.length - 1) {
            if (c < 2) {
              // Horizontal connector
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
              // Vertical connector
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

          return (
            <div key={step.id} style={{ display: 'contents' }}>
              {/* Step Card */}
              <div
                className={`stepwise-step ${step.isHighlighted ? 'highlighted' : ''}`}
                style={{
                  gridRow: stepRow,
                  gridColumn: stepCol,
                  '--step-color': step.color,
                }}
              >
                {/* Step Header */}
                <div className="stepwise-step-header">
                  <div className="stepwise-step-icon-wrapper" style={{ background: `${step.color}20`, border: `1px solid ${step.color}40` }}>
                    <span className="stepwise-step-icon">{step.icon}</span>
                  </div>
                  <div className="stepwise-step-info">
                    <span className="stepwise-step-title">{step.label}</span>
                    <span className="stepwise-step-count">{step.fileCount} {step.fileCount === 1 ? 'file' : 'files'}</span>
                  </div>
                  <span className="stepwise-step-number" style={{ color: step.color }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* File List */}
                <div className="stepwise-files">
                  {displayedFiles.map((file) => (
                    <button
                      key={file.id}
                      className={`stepwise-file ${file.isHighlighted ? 'highlighted' : ''}`}
                      onClick={() => handleFileClick(file.fullPath)}
                      title={`${file.fullPath} — Click to view code`}
                    >
                      <span
                        className="stepwise-file-dot"
                        style={{ background: langColors[file.language] || '#78716c' }}
                      />
                      <span className="stepwise-file-name">{file.name}</span>
                      <span className="stepwise-file-meta">
                        {file.lineCount}L
                      </span>
                    </button>
                  ))}
                </div>

                {/* Expand / Collapse Button */}
                {hiddenCount > 0 && (
                  <button
                    className="stepwise-show-more-btn"
                    onClick={() => toggleExpand(step.id)}
                    title={isExpanded ? "Show fewer files" : `Show ${hiddenCount} more files`}
                  >
                    {isExpanded ? (
                      <>
                        Show less
                        <ChevronUp size={11} />
                      </>
                    ) : (
                      <>
                        +{hiddenCount} more
                        <ChevronDown size={11} />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Render Connector */}
              {connector && (
                <div
                  className={`stepwise-connector stepwise-connector--${connector.type} stepwise-connector--${connector.dir}`}
                  style={{
                    gridRow: connector.gridRow,
                    gridColumn: connector.gridColumn,
                    '--connector-color': connector.color,
                  }}
                >
                  {connector.type === 'horizontal' ? (
                    <svg width="40" height="20" viewBox="0 0 40 20" className="stepwise-connector-svg">
                      <path
                        d="M 0 10 Q 10 2, 20 10 T 40 10"
                        fill="none"
                        stroke="var(--connector-color)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg width="20" height="48" viewBox="0 0 20 48" className="stepwise-connector-svg">
                      <path
                        d="M 10 0 C 18 12, 2 36, 10 48"
                        fill="none"
                        stroke="var(--connector-color)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                  <div className="stepwise-connector-arrow">
                    {connector.dir === 'right' && <ArrowRight size={13} />}
                    {connector.dir === 'left' && <ArrowLeft size={13} />}
                    {connector.dir === 'down' && <ArrowDown size={13} />}
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
