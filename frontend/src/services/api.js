// In production (Netlify), requests to /api/* are proxied to the Render backend via netlify.toml
// In development, fall back to the local backend server
const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:3001/api'
  : '/api';

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

export function streamNarrative(action, onChunk, onDone, onError, chatHistory = []) {
  let cancelled = false;
  const controller = new AbortController();

  // Strip in-progress entries from history before sending (only send completed turns)
  const completedHistory = chatHistory
    .filter(e => !e.isStreaming && e.response)
    .map(e => ({ command: e.command, response: e.response }));

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/narrative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, chatHistory: completedHistory }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Stream failed' }));
        onError?.(err.error || 'Stream failed');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) { onDone?.(); return; }
            if (data.error) { onError?.(data.error); return; }
            if (data.content) onChunk(data.content);
          } catch { /* ignore parse errors */ }
        }
      }
      onDone?.();
    } catch (err) {
      if (err.name !== 'AbortError') onError?.(err.message || 'Connection lost');
    }
  })();

  return () => {
    cancelled = true;
    controller.abort();
  };
}


export async function fetchFileContent(filePath) {
  const res = await fetch(`${API_BASE}/file-content?path=${encodeURIComponent(filePath)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch file content' }));
    throw new Error(err.error || 'Failed to fetch file content');
  }
  return res.json();
}
