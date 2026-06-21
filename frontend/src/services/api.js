const API_BASE = 'http://localhost:3001/api';

export async function analyzeRepo(repoPath) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: repoPath }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || 'Analysis failed');
  }
  return res.json();
}

export function streamNarrative(action, onChunk, onDone, onError) {
  const url = `${API_BASE}/narrative?action=${encodeURIComponent(action)}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.done) {
        eventSource.close();
        onDone?.();
      } else if (data.error) {
        eventSource.close();
        onError?.(data.error);
      } else if (data.content) {
        onChunk(data.content);
      }
    } catch {
      // ignore parse errors
    }
  };

  eventSource.onerror = () => {
    eventSource.close();
    onError?.('Connection lost');
  };

  return () => eventSource.close();
}

export async function traceFlow(action) {
  const res = await fetch(`${API_BASE}/trace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Trace failed' }));
    throw new Error(err.error || 'Trace failed');
  }
  return res.json();
}

export async function getAvailableActions() {
  const res = await fetch(`${API_BASE}/actions`);
  return res.json();
}

export async function getTelemetry() {
  const res = await fetch(`${API_BASE}/telemetry`);
  return res.json();
}

export async function queryVectorStore(query, topK = 5) {
  const res = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, topK }),
  });
  return res.json();
}

export async function fetchFileContent(filePath) {
  const res = await fetch(`${API_BASE}/file-content?path=${encodeURIComponent(filePath)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch file content' }));
    throw new Error(err.error || 'Failed to fetch file content');
  }
  return res.json();
}
