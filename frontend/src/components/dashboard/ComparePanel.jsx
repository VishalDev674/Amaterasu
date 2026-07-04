import { useState } from 'react';
import { GitCompare, X, ChevronDown, Loader2, FileCode, Search, AlertTriangle } from 'lucide-react';

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

function FilePicker({ label, nodes, value, onChange, excludePath }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = nodes
    .filter(n => n.type === 'file' || n.data?.filePath)
    .filter(n => {
      const fp = n.data?.filePath || n.id;
      return fp !== excludePath && fp.toLowerCase().includes(search.toLowerCase());
    });

  const selected = nodes.find(n => (n.data?.filePath || n.id) === value);
  const displayName = selected
    ? (selected.data?.filePath || selected.id).split(/[/\\]/).pop()
    : null;

  return (
    <div className="compare-file-picker">
      <label className="compare-picker-label">{label}</label>
      <div className="compare-picker-btn-wrap">
        <button
          className={`compare-picker-btn ${value ? 'compare-picker-btn--selected' : ''}`}
          onClick={() => setOpen(o => !o)}
        >
          <FileCode size={13} />
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
                  const fp = n.data?.filePath || n.id;
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
          <span className="compare-title">Compare Files</span>
        </div>
        <button className="compare-close-btn" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      {/* File Selectors */}
      <div className="compare-selectors">
        <FilePicker label="File A" nodes={nodes} value={fileA} onChange={setFileA} excludePath={fileB} />
        <div className="compare-vs-divider">
          <GitCompare size={16} color="var(--text-muted)" />
          <span>vs</span>
        </div>
        <FilePicker label="File B" nodes={nodes} value={fileB} onChange={setFileB} excludePath={fileA} />
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
            <><GitCompare size={14} /> Compare</>
          )}
        </button>
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
          {/* Side-by-side stats */}
          <div className="compare-stats-row">
            <div className="compare-stat-card compare-stat-card--a">
              <div className="compare-stat-name">{nameA}</div>
              <div className="compare-stat-row">
                <span className="compare-stat-label">Lines</span>
                <span className="compare-stat-value">{result.fileAStats?.lineCount ?? '—'}</span>
              </div>
              <div className="compare-stat-row">
                <span className="compare-stat-label">Functions</span>
                <span className="compare-stat-value">{result.fileAStats?.functions ?? '—'}</span>
              </div>
              <div className="compare-stat-row">
                <span className="compare-stat-label">Classes</span>
                <span className="compare-stat-value">{result.fileAStats?.classes ?? '—'}</span>
              </div>
            </div>

            <div className="compare-stat-vs">↔</div>

            <div className="compare-stat-card compare-stat-card--b">
              <div className="compare-stat-name">{nameB}</div>
              <div className="compare-stat-row">
                <span className="compare-stat-label">Lines</span>
                <span className="compare-stat-value">{result.fileBStats?.lineCount ?? '—'}</span>
              </div>
              <div className="compare-stat-row">
                <span className="compare-stat-label">Functions</span>
                <span className="compare-stat-value">{result.fileBStats?.functions ?? '—'}</span>
              </div>
              <div className="compare-stat-row">
                <span className="compare-stat-label">Classes</span>
                <span className="compare-stat-value">{result.fileBStats?.classes ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          {result.analysis && (
            <div className="compare-analysis">
              <div className="compare-analysis-label">
                ✦ AI Comparison Analysis
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
                  <div className="compare-symbol-title compare-symbol-title--shared">⟺ Shared Exports</div>
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
