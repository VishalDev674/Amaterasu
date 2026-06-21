import { useEffect, useRef } from 'react';
import { X, FileCode, Copy, Check } from 'lucide-react';
import { useState } from 'react';

// ─── Ember-themed Syntax Tokens ───────────────────────────────
// Colors pulled from the Amaterasu landing page palette
const TOKEN_COLORS = {
  keyword:   '#fb923c',  // ember bright orange (landing-italic color)
  string:    '#fdba74',  // warm peach (landing badge text)
  comment:   '#78716c',  // muted stone (text-muted)
  number:    '#f472b6',  // pink accent
  function:  '#f5f5f4',  // primary text — functions stand out clean
  type:      '#38bdf8',  // sky blue accent
  operator:  '#a8a29e',  // secondary text
  property:  '#34d399',  // emerald green
  tag:       '#ea580c',  // ember glow (core accent)
  attribute: '#fbbf24',  // amber/gold
  constant:  '#818cf8',  // indigo/violet
  punctuation: '#57534e', // dim stone
};

// Language-specific keyword sets
const KEYWORDS = {
  javascript: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|yield|delete|void|null|undefined|true|false|super|static|get|set|constructor)\b/g,
  typescript: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|yield|delete|void|null|undefined|true|false|super|static|get|set|constructor|type|interface|enum|implements|declare|namespace|abstract|readonly|as|is|keyof|infer|never|unknown|any)\b/g,
  python: /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|yield|lambda|pass|break|continue|and|or|not|in|is|None|True|False|self|global|nonlocal|assert|del|print|async|await)\b/g,
  go: /\b(func|return|if|else|for|range|switch|case|break|continue|var|const|type|struct|interface|map|chan|go|defer|select|package|import|nil|true|false|make|new|len|cap|append|copy|delete|panic|recover)\b/g,
  rust: /\b(fn|let|mut|return|if|else|for|while|loop|match|break|continue|struct|enum|impl|trait|pub|use|mod|crate|self|super|const|static|type|where|as|in|ref|move|async|await|unsafe|extern|dyn|true|false|None|Some|Ok|Err)\b/g,
  java: /\b(public|private|protected|class|interface|extends|implements|return|if|else|for|while|do|switch|case|break|continue|new|this|super|static|final|abstract|void|int|long|double|float|boolean|char|byte|short|String|import|package|try|catch|finally|throw|throws|null|true|false|synchronized|volatile|transient|enum|instanceof)\b/g,
  css: /\b(important|inherit|initial|unset|none|auto|block|flex|grid|inline|relative|absolute|fixed|sticky|hidden|visible|solid|dotted|dashed|transparent|ease|linear|infinite|normal|bold|italic|center|left|right|top|bottom)\b/g,
  html: /\b(html|head|body|div|span|p|a|img|ul|ol|li|table|tr|td|th|form|input|button|select|option|textarea|h1|h2|h3|h4|h5|h6|section|article|nav|header|footer|main|aside|script|style|link|meta|title)\b/g,
  ruby: /\b(def|end|class|module|return|if|elsif|else|unless|for|while|until|do|begin|rescue|ensure|raise|yield|block_given|require|include|extend|attr_accessor|attr_reader|attr_writer|nil|true|false|self|super|puts|print)\b/g,
  php: /\b(function|return|if|else|elseif|for|foreach|while|do|switch|case|break|continue|class|extends|implements|new|this|self|static|public|private|protected|abstract|final|interface|namespace|use|require|include|echo|print|null|true|false|array|try|catch|finally|throw)\b/g,
  shell: /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|export|source|local|readonly|set|unset|shift|eval|exec|trap|wait|cd|pwd|ls|grep|sed|awk|find|xargs|pipe|read|cat|test|true|false)\b/g,
  csharp: /\b(public|private|protected|internal|class|interface|struct|enum|return|if|else|for|foreach|while|do|switch|case|break|continue|new|this|base|static|abstract|virtual|override|sealed|async|await|var|string|int|bool|void|null|true|false|using|namespace|try|catch|finally|throw|readonly|const|delegate|event|yield|ref|out|in|is|as|typeof|sizeof|where|select|from|linq)\b/g,
  default: /\b(function|return|if|else|for|while|class|import|export|const|let|var|true|false|null|new|this|self|def|end|type|struct|enum|interface|public|private|static|void|int|string|bool)\b/g,
};

function highlightLine(text, language) {
  if (!text) return '';

  // Escape HTML first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Apply syntax highlighting via regex replacements
  // Order matters: strings and comments first (they can contain keywords)

  // Comments (// and # style)
  html = html.replace(/(\/\/.*$|#(?!include|import|define|ifdef|ifndef|endif|pragma|if).*$)/gm,
    `<span style="color:${TOKEN_COLORS.comment};font-style:italic">$1</span>`);

  // Multi-line comments won't be perfect but handle /* */ on same line
  html = html.replace(/(\/\*.*?\*\/)/g,
    `<span style="color:${TOKEN_COLORS.comment};font-style:italic">$1</span>`);

  // Strings (double and single quoted)
  html = html.replace(/(&quot;.*?&quot;|'[^']*'|`[^`]*`|"[^"]*")/g,
    `<span style="color:${TOKEN_COLORS.string}">$1</span>`);

  // Template literals with backticks
  html = html.replace(/(&#96;[^&#96;]*&#96;)/g,
    `<span style="color:${TOKEN_COLORS.string}">$1</span>`);

  // Numbers
  html = html.replace(/\b(\d+\.?\d*(?:e[+-]?\d+)?|0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+)\b/g,
    `<span style="color:${TOKEN_COLORS.number}">$1</span>`);

  // Keywords (language-specific)
  const kwRegex = KEYWORDS[language] || KEYWORDS.default;
  // We need to recreate the regex to avoid stateful lastIndex issues
  const kwPattern = new RegExp(kwRegex.source, kwRegex.flags);
  html = html.replace(kwPattern,
    `<span style="color:${TOKEN_COLORS.keyword};font-weight:600">$1</span>`);

  // Function calls: word followed by (
  html = html.replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g,
    `<span style="color:${TOKEN_COLORS.function}">$1</span>`);

  // HTML/JSX tags
  if (['html', 'xml', 'vue', 'svelte', 'astro'].includes(language)) {
    html = html.replace(/(&lt;\/?)([\w-]+)/g,
      `$1<span style="color:${TOKEN_COLORS.tag}">$2</span>`);
    html = html.replace(/\b([\w-]+)(?==)/g,
      `<span style="color:${TOKEN_COLORS.attribute}">$1</span>`);
  }

  // CSS selectors and properties
  if (['css', 'scss', 'sass', 'less'].includes(language)) {
    html = html.replace(/([.#][\w-]+)/g,
      `<span style="color:${TOKEN_COLORS.tag}">$1</span>`);
    html = html.replace(/([\w-]+)\s*:/g,
      `<span style="color:${TOKEN_COLORS.property}">$1</span>:`);
  }

  // Decorators (@something)
  html = html.replace(/@(\w+)/g,
    `<span style="color:${TOKEN_COLORS.constant}">@$1</span>`);

  return html;
}

export default function CodeViewer({ fileContent, isLoading, onClose }) {
  const scrollRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [fileContent?.filePath]);

  const handleCopy = async () => {
    if (!fileContent?.content) return;
    try {
      await navigator.clipboard.writeText(fileContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  if (isLoading) {
    return (
      <div className="code-viewer">
        <div className="code-viewer-header">
          <div className="code-viewer-file-info">
            <FileCode size={14} />
            <span>Loading...</span>
          </div>
          <button className="code-viewer-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="code-viewer-loading">
          <div className="spinner" />
          <span>Fetching file content...</span>
        </div>
      </div>
    );
  }

  if (!fileContent) return null;

  const lines = fileContent.content.split('\n');
  const fileName = fileContent.filePath.split('/').pop();
  const language = fileContent.language || 'text';

  return (
    <div className="code-viewer">
      <div className="code-viewer-header">
        <div className="code-viewer-file-info">
          <FileCode size={14} />
          <span className="code-viewer-filename">{fileName}</span>
          <span className="code-viewer-lang-badge">{language}</span>
          <span className="code-viewer-line-count">{fileContent.lineCount}L</span>
        </div>
        <div className="code-viewer-actions">
          <button className="code-viewer-copy" onClick={handleCopy} title="Copy code">
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <button className="code-viewer-close" onClick={onClose} title="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="code-viewer-path">
        {fileContent.filePath}
      </div>

      <div className="code-viewer-body" ref={scrollRef}>
        <table className="code-viewer-table">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="code-viewer-line">
                <td className="code-viewer-line-number">{i + 1}</td>
                <td
                  className="code-viewer-line-content"
                  dangerouslySetInnerHTML={{ __html: highlightLine(line, language) || '&nbsp;' }}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Function/class summary bar */}
      {(fileContent.functions?.length > 0 || fileContent.classes?.length > 0) && (
        <div className="code-viewer-symbols">
          {fileContent.functions?.slice(0, 6).map((fn, i) => (
            <span key={`fn-${i}`} className="code-viewer-symbol fn">
              ƒ {fn.name}
            </span>
          ))}
          {fileContent.classes?.slice(0, 4).map((cls, i) => (
            <span key={`cls-${i}`} className="code-viewer-symbol cls">
              ◆ {cls.name}
            </span>
          ))}
          {(fileContent.functions?.length > 6 || fileContent.classes?.length > 4) && (
            <span className="code-viewer-symbol more">
              +{Math.max(0, (fileContent.functions?.length || 0) - 6) + Math.max(0, (fileContent.classes?.length || 0) - 4)} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
