import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import fs from 'fs';
import path from 'path';

const SUPPORTED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

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

// Recursively collect all parseable source files
function collectFiles(dirPath, files = []) {
  let entries;
  try { entries = fs.readdirSync(dirPath, { withFileTypes: true }); } catch { return files; }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    // Skip common non-source directories
    if (entry.isDirectory()) {
      if (['node_modules', '.git', '__pycache__', 'dist', 'build', '.next', 'venv', '.venv', 'env'].includes(entry.name)) continue;
      collectFiles(fullPath, files);
    } else {
      const ext = path.extname(entry.name);
      if (SUPPORTED_EXTENSIONS.has(ext) || ext === '.py') {
        files.push(fullPath);
      }
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

    const ext = path.extname(filePath);
    const relativePath = path.relative(repoPath, filePath).replace(/\\/g, '/');

    let parsed;
    if (ext === '.py') {
      parsed = parsePythonFile(content, relativePath);
    } else {
      parsed = parseJSFile(content, relativePath);
    }
    parsed.filePath = relativePath;
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
        // Try to find the actual file
        const candidates = [resolved, `${resolved}.js`, `${resolved}.jsx`, `${resolved}.ts`, `${resolved}.tsx`, `${resolved}/index.js`, `${resolved}/index.ts`];
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
