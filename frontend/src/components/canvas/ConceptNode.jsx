import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

function ConceptNode({ data, selected }) {
  const isHighlighted = data.highlighted;

  return (
    <div
      className={`concept-node ${isHighlighted ? 'highlighted' : ''}`}
      style={{
        '--node-color': data.color,
        '--node-glow': data.color,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: data.color, border: 'none', width: 8, height: 8 }} />

      <div className="concept-node-header">
        <span className="concept-node-icon">{data.icon}</span>
        <span className="concept-node-title">{data.label}</span>
      </div>

      <div className="concept-node-meta">
        <span className="concept-node-badge" style={{ '--node-color': data.color }}>
          {data.fileCount} {data.fileCount === 1 ? 'file' : 'files'}
        </span>
      </div>

      {data.files && data.files.length > 0 && (
        <div style={{ marginTop: 8, borderTop: '1px solid var(--border-low-contrast)', paddingTop: 6 }}>
          {data.files.slice(0, 4).map((f, i) => (
            <div key={i} style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.path.split('/').pop()}
            </div>
          ))}
          {data.files.length > 4 && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              +{data.files.length - 4} more
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: data.color, border: 'none', width: 8, height: 8 }} />
    </div>
  );
}

export default memo(ConceptNode);
