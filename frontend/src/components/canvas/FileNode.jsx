import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const langColors = {
  javascript: '#f7df1e', typescript: '#3178c6', python: '#3572a5',
  go: '#00add8', rust: '#dea584', java: '#b07219', css: '#563d7c',
  scss: '#c6538c', html: '#e34c26', ruby: '#701516', php: '#4f5d95',
  csharp: '#178600', swift: '#f05138', kotlin: '#a97bff', dart: '#00b4ab',
  shell: '#89e051', yaml: '#cb171e', json: '#9ca3af', markdown: '#083fa1',
  sql: '#e38c00', dockerfile: '#384d54', text: '#78716c', c: '#555555',
  cpp: '#f34b7d', lua: '#000080', r: '#198ce7', scala: '#c22d40',
  elixir: '#6e4a7e', haskell: '#5e5086', graphql: '#e10098',
  vue: '#41b883', svelte: '#ff3e00', astro: '#ff5d01',
};

const langIcons = {
  javascript: 'JS', typescript: 'TS', python: 'PY', go: 'GO',
  rust: 'RS', java: 'JV', css: 'CSS', scss: 'SCSS', html: 'HTML',
  ruby: 'RB', php: 'PHP', csharp: 'C#', swift: 'SW', kotlin: 'KT',
  dart: 'DT', shell: 'SH', yaml: 'YML', json: 'JSON', markdown: 'MD',
  sql: 'SQL', vue: 'VUE', svelte: 'SVL',
};

function FileNode({ data }) {
  const isHighlighted = data.highlighted;
  const langColor = langColors[data.language] || '#78716c';
  const langLabel = langIcons[data.language] || (data.language || '?').slice(0, 3).toUpperCase();

  return (
    <div
      className={`file-node ${isHighlighted ? 'highlighted' : ''}`}
      style={{ '--node-color': langColor, '--lang-color': langColor }}
      title={`${data.fullPath || data.label} — Click to view code`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: langColor, border: '2px solid rgba(0,0,0,0.4)', width: 7, height: 7, top: -4 }}
      />

      <div className="file-node-lang-bar" style={{ background: langColor }} />

      <div className="file-node-inner">
        <div className="file-node-lang-badge" style={{ color: langColor, background: `${langColor}1a`, border: `1px solid ${langColor}33` }}>
          {langLabel}
        </div>
        <div className="file-node-name">{data.label}</div>
        <div className="file-node-stats">
          <span>{data.lineCount}L</span>
          <span className="file-node-stat-sep">·</span>
          <span>{data.functions}fn</span>
          <span className="file-node-stat-sep">·</span>
          <span>{data.classes}cls</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: langColor, border: '2px solid rgba(0,0,0,0.4)', width: 7, height: 7, bottom: -4 }}
      />
    </div>
  );
}

export default memo(FileNode);
