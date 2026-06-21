import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

function FileNode({ data }) {
  const isHighlighted = data.highlighted;

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
    c: '#555555',
    cpp: '#f34b7d',
    lua: '#000080',
    r: '#198ce7',
    scala: '#c22d40',
    elixir: '#6e4a7e',
    haskell: '#5e5086',
    ocaml: '#3be133',
    clojure: '#db5855',
    graphql: '#e10098',
    vue: '#41b883',
    svelte: '#ff3e00',
    astro: '#ff5d01',
    sass: '#a53b70',
    less: '#1d365d',
    toml: '#9c4221',
    ini: '#d1dbe0',
    env: '#ecd53f',
  };

  return (
    <div
      className={`file-node ${isHighlighted ? 'highlighted' : ''}`}
      style={{ '--node-color': data.color }}
      title={`${data.fullPath || data.label} — Click to view code`}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'var(--border-mid-contrast)', border: 'none', width: 6, height: 6 }} />

      <div className="file-node-name">
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: langColors[data.language] || 'var(--text-muted)', flexShrink: 0 }} />
        {data.label}
      </div>
      <div className="file-node-stats">
        {data.lineCount}L · {data.functions}fn · {data.classes}cls
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--border-mid-contrast)', border: 'none', width: 6, height: 6 }} />
    </div>
  );
}

export default memo(FileNode);
