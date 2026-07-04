import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

function ConceptNode({ data, selected }) {
  const isHighlighted = data.highlighted;

  return (
    <div
      className={`concept-node ${isHighlighted ? 'highlighted' : ''} ${selected ? 'selected' : ''}`}
      style={{
        '--node-color': data.color,
        '--node-glow': data.color,
      }}
    >
      {/* Animated background shimmer */}
      <div className="concept-node-shimmer" />

      {/* Top glow bar */}
      <div className="concept-node-topbar" style={{ background: data.color }} />

      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: data.color,
          border: '2px solid rgba(0,0,0,0.4)',
          width: 10,
          height: 10,
          top: -5,
          boxShadow: `0 0 8px ${data.color}`,
        }}
      />

      <div className="concept-node-header">
        <div className="concept-node-icon-wrap" style={{ background: `${data.color}22`, border: `1px solid ${data.color}44` }}>
          <span className="concept-node-icon">{data.icon}</span>
        </div>
        <div className="concept-node-title-group">
          <span className="concept-node-title">{data.label}</span>
          <span className="concept-node-subtitle">{data.fileCount} {data.fileCount === 1 ? 'file' : 'files'}</span>
        </div>
        <span className="concept-node-badge" style={{ color: data.color, background: `${data.color}1a`, border: `1px solid ${data.color}33` }}>
          {data.fileCount}
        </span>
      </div>

      {data.files && data.files.length > 0 && (
        <div className="concept-node-files">
          {data.files.slice(0, 4).map((f, i) => (
            <div key={i} className="concept-node-file-row">
              <span className="concept-node-file-dot" style={{ background: data.color }} />
              <span className="concept-node-file-name">{f.path.split('/').pop()}</span>
            </div>
          ))}
          {data.files.length > 4 && (
            <div className="concept-node-file-more">
              +{data.files.length - 4} more
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: data.color,
          border: '2px solid rgba(0,0,0,0.4)',
          width: 10,
          height: 10,
          bottom: -5,
          boxShadow: `0 0 8px ${data.color}`,
        }}
      />
    </div>
  );
}

export default memo(ConceptNode);
