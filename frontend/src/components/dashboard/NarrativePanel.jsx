import { useEffect, useRef } from 'react';
import { MessageSquare, User, Sparkles } from 'lucide-react';

// Simple markdown-to-HTML (lightweight, no deps)
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

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function NarrativePanel({ narrative, isStreaming, error, chatHistory = [] }) {
  const scrollRef = useRef(null);
  const autoScrollRef = useRef(true);

  // Auto-scroll when history grows or streaming updates
  useEffect(() => {
    if (autoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, narrative, isStreaming]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 80;
  };

  // Reset auto-scroll when streaming starts
  useEffect(() => {
    if (isStreaming) autoScrollRef.current = true;
  }, [isStreaming]);

  const isEmpty = chatHistory.length === 0 && !error;

  return (
    <div className="narrative-panel" ref={scrollRef} onScroll={handleScroll}>
      {isEmpty ? (
        <div className="narrative-empty">
          <span className="narrative-empty-icon">
            <MessageSquare size={36} strokeWidth={1} />
          </span>
          <h4>Chat History</h4>
          <p>Ask questions about the architecture — your commands and AI responses will appear here as a conversation</p>
        </div>
      ) : (
        <div className="chat-history">
          {/* Top-level error (not tied to a specific entry) */}
          {error && chatHistory.length === 0 && (
            <div className="chat-error-banner">⚠️ {error}</div>
          )}

          {chatHistory.map((entry) => (
            <div key={entry.id} className="chat-entry animate-fade-in">
              {/* User command bubble */}
              <div className="chat-row chat-row--user">
                <div className="chat-bubble chat-bubble--user">
                  <span>{entry.command}</span>
                </div>
                <div className="chat-avatar chat-avatar--user" title="You">
                  <User size={13} />
                </div>
              </div>
              <div className="chat-timestamp chat-timestamp--right">
                {formatTime(entry.timestamp)}
              </div>

              {/* AI response bubble */}
              <div className="chat-row chat-row--ai">
                <div className="chat-avatar chat-avatar--ai" title="Amaterasu AI">
                  <Sparkles size={13} />
                </div>
                <div className="chat-bubble chat-bubble--ai">
                  {entry.error ? (
                    <span className="chat-entry-error">⚠️ {entry.error}</span>
                  ) : entry.response ? (
                    <>
                      <div
                        className="narrative-content"
                        dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(entry.response)}</p>` }}
                      />
                      {entry.isStreaming && <span className="narrative-cursor" />}
                    </>
                  ) : (
                    <div className="chat-thinking">
                      <span className="chat-dot" />
                      <span className="chat-dot" />
                      <span className="chat-dot" />
                    </div>
                  )}
                </div>
              </div>
              {!entry.isStreaming && (
                <div className="chat-timestamp chat-timestamp--left">
                  {entry.response
                    ? `${entry.response.split(/\s+/).filter(Boolean).length} words`
                    : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
