import { useState } from 'react';
import { GitCompare, X, ChevronDown, Loader2, FileCode, Search, AlertTriangle, Sparkles, ArrowLeftRight } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

async function fetchComparison(fileA, fileB) {
  const res = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileA, fileB }),
  });
  if (!res.ok) throw new Error('Comparison failed');
  return res.json();
}

function FilePicker({ label, nodes, value, onChange, excludePath, accent }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = nodes
    .filter(n => n.type === 'fileNode' || (n.data?.fullPath || n.data?.filePath))
    .filter(n => n.type !== 'conceptNode')
    .filter(n => {
      const fp = n.data?.fullPath || n.data?.filePath || n.id;
      return fp !== excludePath && fp.toLowerCase().includes(search.toLowerCase());
    });

  const selected = nodes.find(n => (n.data?.fullPath || n.data?.filePath || n.id) === value);
  const displayName = selected
    ? (selected.data?.fullPath || selected.data?.filePath || selected.id).split(/[/\\]/).pop()
    : null;

  const accentColor = accent === 'a' ? '#6366f1' : '#ea580c';

  return (
    <div className="compare-file-picker">
      <label className="compare-picker-label" style={{ color: accentColor }}>{label}</label>
      <div className="compare-picker-btn-wrap">
        <button
          className={`compare-picker-btn ${value ? 'compare-picker-btn--selected' : ''}`}
          onClick={() => setOpen(o => !o)}
          style={value ? { borderColor: `${accentColor}50`, background: `${accentColor}08` } : {}}
        >
          <FileCode size={13} style={{ color: value ? accentColor : undefined }} />
          <span className="compare-picker-name">{displayName || 'Select a file…'}</span>
          <ChevronDown size={12} className={`compare-picker-chevron ${open ? 'open' : ''}`} />
        </button>
        {open && (
          <div className="compare-picker-dropdown">
            <div className="compare-picker-search-wrap">
              <Search size={12} color="var(--text-muted)" />
              <input
                className="compare-picker-search"
                placeholder="Filter files..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="compare-picker-list">
              {filtered.length === 0 ? (
                <div className="compare-picker-empty">No files match</div>
              ) : (
                filtered.map(n => {
                  const fp = n.data?.fullPath || n.data?.filePath || n.id;
                  const name = fp.split(/[/\\]/).pop();
                  const dir = fp.split(/[/\\]/).slice(-2, -1)[0] || '';
                  return (
                    <button
                      key={fp}
                      className="compare-picker-item"
                      onClick={() => { onChange(fp); setOpen(false); setSearch(''); }}
                    >
                      <span className="compare-picker-item-name">{name}</span>
                      {dir && <span className="compare-picker-item-dir">{dir}/</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

function StatBar({ label, valueA, valueB, nameA, nameB }) {
  const max = Math.max(valueA || 0, valueB || 0, 1);
  const pctA = Math.round(((valueA || 0) / max) * 100);
  const pctB = Math.round(((valueB || 0) / max) * 100);
  return (
    <div className="compare-stat-bar-row">
      <span className="compare-stat-bar-label">{label}</span>
      <div className="compare-stat-bar-track">
        <div className="compare-stat-bar-fill compare-stat-bar-fill--a" style={{ width: `${pctA}%` }} title={`${nameA}: ${valueA}`} />
      </div>
      <span className="compare-stat-bar-val compare-stat-bar-val--a">{valueA ?? '—'}</span>
      <span className="compare-stat-bar-sep">vs</span>
      <span className="compare-stat-bar-val compare-stat-bar-val--b">{valueB ?? '—'}</span>
      <div className="compare-stat-bar-track compare-stat-bar-track--b">
        <div className="compare-stat-bar-fill compare-stat-bar-fill--b" style={{ width: `${pctB}%` }} title={`${nameB}: ${valueB}`} />
      </div>
    </div>
  );
}

export default function ComparePanel({ nodes, onClose }) {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canCompare = fileA && fileB && fileA !== fileB;

  const handleCompare = async () => {
    if (!canCompare) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await fetchComparison(fileA, fileB);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const nameA = fileA?.split(/[/\\]/).pop() || '';
  const nameB = fileB?.split(/[/\\]/).pop() || '';

  return (
    <div className="compare-panel animate-fade-in">
      {/* Header */}
      <div className="compare-header">
        <div className="compare-header-left">
          <div className="compare-header-icon">
            <GitCompare size={14} color="white" />
          </div>
          <div>
            <span className="compare-title">File Comparison</span>
            <span className="compare-subtitle">Analyze two files side-by-side</span>
          </div>
        </div>
        <button className="compare-close-btn" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      {/* File Selectors */}
      <div className="compare-selectors">
        <FilePicker label="File A" nodes={nodes} value={fileA} onChange={setFileA} excludePath={fileB} accent="a" />
        <div className="compare-vs-divider">
          <ArrowLeftRight size={14} color="var(--text-muted)" />
        </div>
        <FilePicker label="File B" nodes={nodes} value={fileB} onChange={setFileB} excludePath={fileA} accent="b" />
      </div>

      {/* Compare Button */}
      <div className="compare-btn-row">
        <button
          className="compare-run-btn"
          onClick={handleCompare}
          disabled={!canCompare || loading}
        >
          {loading ? (
            <><Loader2 size={14} className="quiz-spin-icon" /> Analyzing…</>
          ) : (
            <><Sparkles size={14} /> Compare Files</>
          )}
        </button>
        {!canCompare && !loading && (
          <span className="compare-hint">Select two different files above to compare</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="compare-error">
          <AlertTriangle size={13} />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="compare-result animate-fade-in">
          {/* Visual stat bars */}
          <div className="compare-stats-visual">
            <div className="compare-stats-header">
              <span className="compare-stats-label-a">{nameA}</span>
              <span className="compare-stats-center-label">Metrics</span>
              <span className="compare-stats-label-b">{nameB}</span>
            </div>
            <StatBar label="Lines" valueA={result.fileAStats?.lineCount} valueB={result.fileBStats?.lineCount} nameA={nameA} nameB={nameB} />
            <StatBar label="Functions" valueA={result.fileAStats?.functions} valueB={result.fileBStats?.functions} nameA={nameA} nameB={nameB} />
            <StatBar label="Classes" valueA={result.fileAStats?.classes} valueB={result.fileBStats?.classes} nameA={nameA} nameB={nameB} />
          </div>

          {/* AI Analysis */}
          {result.analysis && (
            <div className="compare-analysis">
              <div className="compare-analysis-label">
                <Sparkles size={11} style={{ display: 'inline', marginRight: 4 }} />
                AI Comparison Analysis
              </div>
              <div
                className="narrative-content compare-analysis-content"
                dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(result.analysis)}</p>` }}
              />
            </div>
          )}

          {/* Shared & Unique symbols */}
          {(result.shared?.length > 0 || result.uniqueToA?.length > 0 || result.uniqueToB?.length > 0) && (
            <div className="compare-symbols">
              {result.shared?.length > 0 && (
                <div className="compare-symbol-group">
                  <div className="compare-symbol-title compare-symbol-title--shared">⟺ Shared Symbols ({result.shared.length})</div>
                  <div className="compare-symbol-list">
                    {result.shared.map(s => <span key={s} className="compare-symbol-tag compare-symbol-tag--shared">{s}</span>)}
                  </div>
                </div>
              )}
              {result.uniqueToA?.length > 0 && (
                <div className="compare-symbol-group">
                  <div className="compare-symbol-title compare-symbol-title--a">⊂ Only in {nameA}</div>
                  <div className="compare-symbol-list">
                    {result.uniqueToA.map(s => <span key={s} className="compare-symbol-tag compare-symbol-tag--a">{s}</span>)}
                  </div>
                </div>
              )}
              {result.uniqueToB?.length > 0 && (
                <div className="compare-symbol-group">
                  <div className="compare-symbol-title compare-symbol-title--b">⊂ Only in {nameB}</div>
                  <div className="compare-symbol-list">
                    {result.uniqueToB.map(s => <span key={s} className="compare-symbol-tag compare-symbol-tag--b">{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
