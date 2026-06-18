import { useEffect, useRef } from 'react';
import { BookOpen } from 'lucide-react';

export default function NarrativePanel({ narrative, isStreaming, error }) {
  const scrollRef = useRef(null);
  const autoScrollRef = useRef(true);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && autoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [narrative, isStreaming]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 60;
  };

  // Reset auto-scroll when streaming starts
  useEffect(() => {
    if (isStreaming) autoScrollRef.current = true;
  }, [isStreaming]);

  // Simple markdown-to-HTML (lightweight, no deps)
  const renderMarkdown = (text) => {
    if (!text) return '';
    return text
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      // Bold & italic
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Blockquotes
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      // List items
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // Paragraphs (double newlines)
      .replace(/\n\n/g, '</p><p>')
      // Single newlines
      .replace(/\n/g, '<br/>');
  };

  const isEmpty = !narrative && !isStreaming && !error;

  return (
    <div className="narrative-panel" ref={scrollRef} onScroll={handleScroll}>
      {isEmpty ? (
        <div className="narrative-empty">
          <span className="narrative-empty-icon">
            <BookOpen size={36} strokeWidth={1} />
          </span>
          <h4>Architectural Narratives</h4>
          <p>Analyze a repo and ask questions to generate AI-powered architectural insights and execution narratives</p>
        </div>
      ) : (
        <div className="narrative-content animate-fade-in">
          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-md)',
              color: '#fca5a5',
              fontSize: 13,
              marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(narrative)}</p>` }} />
          {isStreaming && <span className="narrative-cursor" />}
        </div>
      )}
    </div>
  );
}
