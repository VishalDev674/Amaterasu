import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

function FileNode({ data }) {
  const isHighlighted = data.highlighted;

  const langColors = {
    javascript: '#f7df1e',
    typescript: '#3178c6',
    python: '#3572a5',
  };

  return (
    <div
      className={`file-node ${isHighlighted ? 'highlighted' : ''}`}
      style={{ '--node-color': data.color }}
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
