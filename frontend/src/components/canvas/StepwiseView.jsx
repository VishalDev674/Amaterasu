import { useMemo } from 'react';
import { ChevronDown, FileCode, ArrowDown } from 'lucide-react';

export default function StepwiseView({ nodes, edges, highlightedNodes, onNodeClick }) {
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
        })),
      };
    }).sort((a, b) => b.fileCount - a.fileCount); // Sort by file count descending
  }, [nodes, highlightedNodes]);

  // Count inter-cluster dependencies
  const clusterDeps = useMemo(() => {
    if (!edges) return new Map();
    const deps = new Map();
    for (const edge of edges) {
      if (edge.id.startsWith('dep-')) {
        const sourceCluster = nodes.find(n => n.type === 'fileNode' && n.id === edge.source)?.data?.parentCluster;
        const targetCluster = nodes.find(n => n.type === 'fileNode' && n.id === edge.target)?.data?.parentCluster;
        if (sourceCluster && targetCluster && sourceCluster !== targetCluster) {
          const key = `${sourceCluster}→${targetCluster}`;
          deps.set(key, (deps.get(key) || 0) + 1);
        }
      }
    }
    return deps;
  }, [edges, nodes]);

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
      <div className="stepwise-pipeline">
        {steps.map((step, index) => (
          <div key={step.id} className="stepwise-step-wrapper">
            {/* Step Card */}
            <div
              className={`stepwise-step ${step.isHighlighted ? 'highlighted' : ''}`}
              style={{ '--step-color': step.color }}
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
                {step.files.map((file) => (
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
                      {file.functions > 0 && ` · ${file.functions}fn`}
                      {file.classes > 0 && ` · ${file.classes}cls`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Connector between steps */}
            {index < steps.length - 1 && (
              <div className="stepwise-connector">
                <div className="stepwise-connector-line" />
                <ArrowDown size={14} className="stepwise-connector-arrow" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
