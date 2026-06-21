import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import fs from 'fs';
import path from 'path';

const SUPPORTED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

// ─── Language Detection Map ─────────────────────────────────────
const LANGUAGE_MAP = {
  '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
  '.ts': 'typescript', '.tsx': 'typescript',
  '.py': 'python', '.pyw': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java', '.kt': 'kotlin', '.kts': 'kotlin',
  '.c': 'c', '.h': 'c',
  '.cpp': 'cpp', '.cc': 'cpp', '.cxx': 'cpp', '.hpp': 'cpp', '.hxx': 'cpp',
  '.cs': 'csharp',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.dart': 'dart',
  '.lua': 'lua',
  '.r': 'r', '.R': 'r',
  '.scala': 'scala',
  '.ex': 'elixir', '.exs': 'elixir',
  '.erl': 'erlang',
  '.hs': 'haskell',
  '.ml': 'ocaml', '.mli': 'ocaml',
  '.clj': 'clojure', '.cljs': 'clojure',
  '.sql': 'sql',
  '.sh': 'shell', '.bash': 'shell', '.zsh': 'shell', '.fish': 'shell',
  '.ps1': 'powershell', '.psm1': 'powershell',
  '.bat': 'batch', '.cmd': 'batch',
  '.css': 'css', '.scss': 'scss', '.sass': 'sass', '.less': 'less',
  '.html': 'html', '.htm': 'html',
  '.xml': 'xml', '.xsl': 'xml', '.xslt': 'xml',
  '.svg': 'svg',
  '.json': 'json', '.jsonc': 'json',
  '.yaml': 'yaml', '.yml': 'yaml',
  '.toml': 'toml',
  '.ini': 'ini', '.cfg': 'ini',
  '.env': 'env',
  '.md': 'markdown', '.mdx': 'markdown',
  '.txt': 'text', '.log': 'text',
  '.graphql': 'graphql', '.gql': 'graphql',
  '.proto': 'protobuf',
  '.tf': 'terraform', '.tfvars': 'terraform',
  '.vue': 'vue', '.svelte': 'svelte',
  '.astro': 'astro',
};

// Known file names without extensions
const FILENAME_MAP = {
  'Dockerfile': 'dockerfile',
  'Makefile': 'makefile',
  'Rakefile': 'ruby',
  'Gemfile': 'ruby',
  'Vagrantfile': 'ruby',
  'Procfile': 'procfile',
  '.gitignore': 'gitignore',
  '.dockerignore': 'dockerignore',
  '.editorconfig': 'editorconfig',
  '.prettierrc': 'json',
  '.eslintrc': 'json',
  '.babelrc': 'json',
  'docker-compose.yml': 'yaml',
  'docker-compose.yaml': 'yaml',
};

// ─── Binary Extensions to Skip Silently ─────────────────────────
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.avif', '.tiff', '.tif',
  '.mp3', '.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.wav', '.ogg', '.flac', '.aac', '.webm',
  '.zip', '.tar', '.gz', '.bz2', '.xz', '.rar', '.7z', '.jar', '.war',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.obj', '.o', '.a', '.lib',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.sqlite', '.db', '.mdb',
  '.pyc', '.pyo', '.class',
  '.lock',
  '.map',
  '.min.js', '.min.css',
  '.DS_Store', '.ico',
]);

// ─── Generic File Parser (Regex-based for any language) ──────────
function parseGenericFile(content, filePath, language) {
  const imports = [];
  const functions = [];
  const classes = [];
  const exports = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) continue;

    // ─── Go ───
    if (language === 'go') {
      const importMatch = trimmed.match(/^import\s+(?:\(\s*)?["'](.+?)["']/);
      if (importMatch) imports.push({ source: importMatch[1], specifiers: [] });
      const funcMatch = trimmed.match(/^func\s+(?:\(.+?\)\s+)?(\w+)\s*\(/);
      if (funcMatch) functions.push({ name: funcMatch[1], type: 'function' });
      const structMatch = trimmed.match(/^type\s+(\w+)\s+struct/);
      if (structMatch) classes.push({ name: structMatch[1], type: 'struct' });
    }
    // ─── Rust ───
    else if (language === 'rust') {
      const useMatch = trimmed.match(/^use\s+(.+?);/);
      if (useMatch) imports.push({ source: useMatch[1], specifiers: [] });
      const fnMatch = trimmed.match(/^(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/);
      if (fnMatch) functions.push({ name: fnMatch[1], type: 'function' });
      const structMatch = trimmed.match(/^(?:pub\s+)?struct\s+(\w+)/);
      if (structMatch) classes.push({ name: structMatch[1], type: 'struct' });
      const implMatch = trimmed.match(/^impl(?:<.+?>)?\s+(\w+)/);
      if (implMatch) classes.push({ name: implMatch[1], type: 'impl' });
    }
    // ─── Java / Kotlin / C# ───
    else if (language === 'java' || language === 'kotlin' || language === 'csharp') {
      const importMatch = trimmed.match(/^(?:import|using)\s+(?:static\s+)?(.+?);/);
      if (importMatch) imports.push({ source: importMatch[1], specifiers: [] });
      const classMatch = trimmed.match(/^(?:public|private|protected|internal|abstract|static|final|sealed|open|data)?\s*(?:class|interface|enum|object|record)\s+(\w+)/);
      if (classMatch) classes.push({ name: classMatch[1], type: 'class' });
      const methodMatch = trimmed.match(/^(?:public|private|protected|internal|static|abstract|override|virtual|async)?\s*(?:fun|void|int|string|boolean|String|List|Map|Set|Optional|Task|var|val|dynamic)?\s*<?.*>?\s+(\w+)\s*\(/);
      if (methodMatch && !['if', 'for', 'while', 'switch', 'catch', 'class', 'new', 'return'].includes(methodMatch[1])) {
        functions.push({ name: methodMatch[1], type: 'method' });
      }
    }
    // ─── Ruby ───
    else if (language === 'ruby') {
      const requireMatch = trimmed.match(/^require(?:_relative)?\s+['"](.*?)['"]/);
      if (requireMatch) imports.push({ source: requireMatch[1], specifiers: [] });
      const defMatch = trimmed.match(/^def\s+(\w+)/);
      if (defMatch) functions.push({ name: defMatch[1], type: 'method' });
      const classMatch = trimmed.match(/^class\s+(\w+)/);
      if (classMatch) classes.push({ name: classMatch[1], type: 'class' });
      const moduleMatch = trimmed.match(/^module\s+(\w+)/);
      if (moduleMatch) classes.push({ name: moduleMatch[1], type: 'module' });
    }
    // ─── PHP ───
    else if (language === 'php') {
      const useMatch = trimmed.match(/^use\s+(.+?);/);
      if (useMatch) imports.push({ source: useMatch[1], specifiers: [] });
      const funcMatch = trimmed.match(/^(?:public|private|protected|static)?\s*function\s+(\w+)/);
      if (funcMatch) functions.push({ name: funcMatch[1], type: 'function' });
      const classMatch = trimmed.match(/^(?:abstract\s+)?class\s+(\w+)/);
      if (classMatch) classes.push({ name: classMatch[1], type: 'class' });
    }
    // ─── CSS/SCSS/LESS ───
    else if (['css', 'scss', 'sass', 'less'].includes(language)) {
      const importMatch = trimmed.match(/^@(?:import|use|forward)\s+['"](.*?)['"]/);
      if (importMatch) imports.push({ source: importMatch[1], specifiers: [] });
      // Detect class/id selectors as "exports"
      const selectorMatch = trimmed.match(/^([.#][\w-]+)\s*\{/);
      if (selectorMatch) exports.push(selectorMatch[1]);
    }
    // ─── HTML ───
    else if (language === 'html') {
      const linkMatch = trimmed.match(/(?:src|href)=["'](.*?)["']/);
      if (linkMatch) imports.push({ source: linkMatch[1], specifiers: [] });
    }
    // ─── Shell ───
    else if (['shell', 'bash', 'powershell'].includes(language)) {
      const sourceMatch = trimmed.match(/^(?:source|\.|Import-Module)\s+["']?(.*?)["']?\s*$/);
      if (sourceMatch) imports.push({ source: sourceMatch[1], specifiers: [] });
      const funcMatch = trimmed.match(/^(?:function\s+)?(\w+)\s*\(\)\s*\{/);
      if (funcMatch) functions.push({ name: funcMatch[1], type: 'function' });
    }
    // ─── Vue / Svelte ───
    else if (language === 'vue' || language === 'svelte') {
      const importMatch = trimmed.match(/^import\s+(?:(.+?)\s+from\s+)?['"](.*?)['"]/);
      if (importMatch) imports.push({ source: importMatch[2], specifiers: importMatch[1] ? importMatch[1].replace(/[{}]/g, '').split(',').map(s => s.trim()) : [] });
    }
    // ─── SQL ───
    else if (language === 'sql') {
      const tableMatch = trimmed.match(/^CREATE\s+(?:TABLE|VIEW|FUNCTION|PROCEDURE)\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)/i);
      if (tableMatch) classes.push({ name: tableMatch[1], type: 'table' });
    }
    // ─── Config/data files (JSON, YAML, TOML) — minimal parsing ───
    else if (['json', 'yaml', 'toml', 'ini', 'env'].includes(language)) {
      // No structural parsing needed — just store the content
    }
    // ─── Markdown ───
    else if (language === 'markdown') {
      const headingMatch = trimmed.match(/^#{1,3}\s+(.+)/);
      if (headingMatch) functions.push({ name: headingMatch[1], type: 'heading' });
    }
    // ─── Swift ───
    else if (language === 'swift') {
      const importMatch = trimmed.match(/^import\s+(\w+)/);
      if (importMatch) imports.push({ source: importMatch[1], specifiers: [] });
      const funcMatch = trimmed.match(/^(?:public|private|internal|open|static|class|override)?\s*func\s+(\w+)/);
      if (funcMatch) functions.push({ name: funcMatch[1], type: 'function' });
      const classMatch = trimmed.match(/^(?:public|private|internal|open|final)?\s*(?:class|struct|enum|protocol)\s+(\w+)/);
      if (classMatch) classes.push({ name: classMatch[1], type: 'class' });
    }
    // ─── Dart ───
    else if (language === 'dart') {
      const importMatch = trimmed.match(/^import\s+['"](.*?)['"]/);
      if (importMatch) imports.push({ source: importMatch[1], specifiers: [] });
      const classMatch = trimmed.match(/^(?:abstract\s+)?class\s+(\w+)/);
      if (classMatch) classes.push({ name: classMatch[1], type: 'class' });
    }
    // ─── Elixir ───
    else if (language === 'elixir') {
      const importMatch = trimmed.match(/^(?:import|use|alias)\s+(\w[\w.]*)/);
      if (importMatch) imports.push({ source: importMatch[1], specifiers: [] });
      const defMatch = trimmed.match(/^def[p]?\s+(\w+)/);
      if (defMatch) functions.push({ name: defMatch[1], type: 'function' });
      const moduleMatch = trimmed.match(/^defmodule\s+(\w[\w.]*)/);
      if (moduleMatch) classes.push({ name: moduleMatch[1], type: 'module' });
    }
    // ─── C/C++ ───
    else if (language === 'c' || language === 'cpp') {
      const includeMatch = trimmed.match(/^#include\s+[<"](.*?)[>"]/);
      if (includeMatch) imports.push({ source: includeMatch[1], specifiers: [] });
      const funcMatch = trimmed.match(/^(?:static\s+|inline\s+|virtual\s+|extern\s+)?(?:void|int|float|double|char|bool|auto|string|size_t|unsigned|long|short|const\s+\w+)\s+(\w+)\s*\(/);
      if (funcMatch && !['if', 'for', 'while', 'switch', 'return'].includes(funcMatch[1])) {
        functions.push({ name: funcMatch[1], type: 'function' });
      }
      const classMatch = trimmed.match(/^(?:class|struct)\s+(\w+)/);
      if (classMatch) classes.push({ name: classMatch[1], type: 'class' });
    }
  }

  return {
    filePath,
    language,
    imports,
    functions,
    classes,
    exports: exports.length > 0 ? exports : functions.map(f => f.name).concat(classes.map(c => c.name)),
    lineCount: lines.length,
  };
}

// Lightweight Python parser (regex-based, not full AST)
function parsePythonFile(content, filePath) {
  const imports = [];
  const functions = [];
  const classes = [];

  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // imports
    const importMatch = trimmed.match(/^(?:from\s+(\S+)\s+)?import\s+(.+)/);
    if (importMatch) {
      imports.push({ source: importMatch[1] || importMatch[2].split(',')[0].trim(), specifiers: importMatch[2].split(',').map(s => s.trim()) });
    }
    // functions
    const funcMatch = trimmed.match(/^def\s+(\w+)\s*\(/);
    if (funcMatch) {
      functions.push({ name: funcMatch[1], type: 'function' });
    }
    // classes
    const classMatch = trimmed.match(/^class\s+(\w+)/);
    if (classMatch) {
      classes.push({ name: classMatch[1], type: 'class' });
    }
  }

  return {
    filePath,
    language: 'python',
    imports,
    functions,
    classes,
    exports: functions.map(f => f.name).concat(classes.map(c => c.name)),
    lineCount: lines.length
  };
}

// JS/TS AST parser using Acorn
function parseJSFile(content, filePath) {
  const imports = [];
  const functions = [];
  const classes = [];
  const exports = [];

  let ast;
  try {
    ast = acorn.parse(content, {
      sourceType: 'module',
      ecmaVersion: 'latest',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      // Skip JSX by treating < as less-than (won't crash, just won't parse JSX nodes)
      allowHashBang: true,
    });
  } catch {
    // If acorn fails (e.g. JSX/TS syntax), fall back to regex
    return parseWithRegex(content, filePath);
  }

  walk.simple(ast, {
    ImportDeclaration(node) {
      imports.push({
        source: node.source.value,
        specifiers: node.specifiers.map(s => s.local.name)
      });
    },
    FunctionDeclaration(node) {
      if (node.id) functions.push({ name: node.id.name, type: 'function', start: node.start, end: node.end });
    },
    ClassDeclaration(node) {
      if (node.id) classes.push({ name: node.id.name, type: 'class', start: node.start, end: node.end });
    },
    ExportNamedDeclaration(node) {
      if (node.declaration && node.declaration.id) exports.push(node.declaration.id.name);
      if (node.specifiers) node.specifiers.forEach(s => exports.push(s.exported.name));
    },
    ExportDefaultDeclaration(node) {
      exports.push('default');
    },
    VariableDeclaration(node) {
      node.declarations.forEach(decl => {
        if (decl.init && (decl.init.type === 'ArrowFunctionExpression' || decl.init.type === 'FunctionExpression')) {
          if (decl.id && decl.id.name) functions.push({ name: decl.id.name, type: 'arrow', start: decl.start, end: decl.end });
        }
      });
    }
  });

  const ext = path.extname(filePath);
  return {
    filePath,
    language: ext === '.ts' || ext === '.tsx' ? 'typescript' : 'javascript',
    imports,
    functions,
    classes,
    exports,
    lineCount: content.split('\n').length
  };
}

// Regex fallback for JSX/TSX files Acorn can't handle
function parseWithRegex(content, filePath) {
  const imports = [];
  const functions = [];
  const classes = [];
  const exports = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    const importMatch = trimmed.match(/^import\s+(?:(.+?)\s+from\s+)?['"](.+?)['"]/);
    if (importMatch) {
      imports.push({ source: importMatch[2], specifiers: importMatch[1] ? importMatch[1].replace(/[{}]/g, '').split(',').map(s => s.trim()) : [] });
    }
    const funcMatch = trimmed.match(/^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)/);
    if (funcMatch) functions.push({ name: funcMatch[1], type: 'function' });
    const arrowMatch = trimmed.match(/^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/);
    if (arrowMatch) functions.push({ name: arrowMatch[1], type: 'arrow' });
    const classMatch = trimmed.match(/^(?:export\s+)?(?:default\s+)?class\s+(\w+)/);
    if (classMatch) classes.push({ name: classMatch[1], type: 'class' });
    if (trimmed.startsWith('export ')) {
      const exportMatch = trimmed.match(/export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/);
      if (exportMatch) exports.push(exportMatch[1]);
    }
  }

  const ext = path.extname(filePath);
  return {
    filePath,
    language: ext === '.ts' || ext === '.tsx' ? 'typescript' : ext === '.py' ? 'python' : 'javascript',
    imports, functions, classes, exports,
    lineCount: lines.length
  };
}

// Detect language from file path
function detectLanguage(filePath) {
  const basename = path.basename(filePath);
  // Check known filenames first
  if (FILENAME_MAP[basename]) return FILENAME_MAP[basename];
  const ext = path.extname(basename).toLowerCase();
  return LANGUAGE_MAP[ext] || 'text';
}

// Check if a file is likely binary
function isBinaryFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) return true;
  const basename = path.basename(filePath);
  // Skip common binary/generated files
  if (basename === '.DS_Store' || basename === 'Thumbs.db') return true;
  return false;
}

// Recursively collect all parseable source files
function collectFiles(dirPath, files = []) {
  let entries;
  try { entries = fs.readdirSync(dirPath, { withFileTypes: true }); } catch { return files; }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    // Skip common non-source directories
    if (entry.isDirectory()) {
      if (['node_modules', '.git', '__pycache__', 'dist', 'build', '.next', 'venv', '.venv', 'env', '.idea', '.vscode', '.cache', 'coverage', '.nyc_output', 'target', 'bin', 'obj', '.gradle', '.dart_tool', '.pub-cache'].includes(entry.name)) continue;
      collectFiles(fullPath, files);
    } else {
      // Skip binary files silently
      if (isBinaryFile(fullPath)) continue;
      // Skip files larger than 500KB to avoid memory issues
      try {
        const stats = fs.statSync(fullPath);
        if (stats.size > 500 * 1024) continue;
      } catch { continue; }
      files.push(fullPath);
    }
  }
  return files;
}

// Main parse function: analyze an entire directory
export function parseRepository(repoPath) {
  const files = collectFiles(repoPath);
  const results = [];

  for (const filePath of files) {
    let content;
    try { content = fs.readFileSync(filePath, 'utf-8'); } catch { continue; }

    // Quick binary content check — skip files with null bytes
    if (content.includes('\0')) continue;

    const ext = path.extname(filePath).toLowerCase();
    const relativePath = path.relative(repoPath, filePath).replace(/\\/g, '/');
    const language = detectLanguage(filePath);

    let parsed;
    if (ext === '.py' || ext === '.pyw') {
      parsed = parsePythonFile(content, relativePath);
    } else if (SUPPORTED_EXTENSIONS.has(ext)) {
      parsed = parseJSFile(content, relativePath);
    } else {
      parsed = parseGenericFile(content, relativePath, language);
    }
    parsed.filePath = relativePath;
    parsed.content = content; // Store raw content for code viewer
    results.push(parsed);
  }

  return {
    rootPath: repoPath,
    fileCount: results.length,
    files: results,
    dependencyGraph: buildDependencyGraph(results)
  };
}

// Build import-based dependency edges
function buildDependencyGraph(parsedFiles) {
  const edges = [];
  const fileMap = new Map(parsedFiles.map(f => [f.filePath, f]));

  for (const file of parsedFiles) {
    for (const imp of file.imports) {
      // Resolve relative imports
      if (imp.source.startsWith('.')) {
        const dir = path.dirname(file.filePath);
        let resolved = path.posix.join(dir, imp.source);
        // Try to find the actual file with various extensions
        const candidates = [
          resolved,
          `${resolved}.js`, `${resolved}.jsx`, `${resolved}.ts`, `${resolved}.tsx`,
          `${resolved}.py`, `${resolved}.go`, `${resolved}.rs`,
          `${resolved}.java`, `${resolved}.kt`, `${resolved}.cs`,
          `${resolved}.rb`, `${resolved}.php`, `${resolved}.swift`, `${resolved}.dart`,
          `${resolved}.css`, `${resolved}.scss`, `${resolved}.less`,
          `${resolved}.vue`, `${resolved}.svelte`,
          `${resolved}/index.js`, `${resolved}/index.ts`, `${resolved}/index.jsx`, `${resolved}/index.tsx`,
          `${resolved}/mod.rs`, `${resolved}/main.go`,
        ];
        const match = candidates.find(c => fileMap.has(c));
        if (match) {
          edges.push({ source: file.filePath, target: match, specifiers: imp.specifiers });
        }
      }
    }
  }
  return edges;
}

// Extract lightweight signatures for token-efficient LLM context
export function extractSignatures(parsedFiles, maxFiles = 20) {
  const summaries = [];
  const subset = parsedFiles.slice(0, maxFiles);

  for (const file of subset) {
    const funcs = file.functions.map(f => f.name).join(', ');
    const cls = file.classes.map(c => c.name).join(', ');
    const imps = file.imports.map(i => i.source).join(', ');
    summaries.push(`[${file.filePath}] (${file.lineCount}L) | Fn: ${funcs || 'none'} | Cls: ${cls || 'none'} | Imports: ${imps || 'none'}`);
  }
  return summaries.join('\n');
}
