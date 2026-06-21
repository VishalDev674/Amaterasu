import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { parseRepository, extractSignatures } from './services/astParser.js';
import { generateConceptMap } from './services/conceptMapper.js';
import { initGroq, streamNarrative, summarizeConcept } from './services/groqService.js';
import { traceFlow, getAvailableActions } from './services/flowTracer.js';
import { vectorStore } from './services/vectorStore.js';

const execPromise = promisify(exec);
const cloneDir = path.resolve('./temp_cloned_repos');

const isGitUrl = (str) => {
  if (!str) return false;
  const s = str.trim();
  return s.startsWith('https://') || s.startsWith('http://') || s.startsWith('git@') || s.includes('github.com');
};

const getRepoName = (url) => {
  const parts = url.replace(/\.git$/, '').split('/');
  return parts[parts.length - 1] || 'cloned-repo';
};

const cleanTempRepos = () => {
  try {
    if (fs.existsSync(cloneDir)) {
      const items = fs.readdirSync(cloneDir);
      for (const item of items) {
        const itemPath = path.join(cloneDir, item);
        fs.rmSync(itemPath, { recursive: true, force: true });
      }
    }
  } catch (err) {
    console.error('[Clean] Error cleaning temp repos:', err);
  }
};

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Groq
const groqReady = initGroq(process.env.GROQ_API_KEY);

// In-memory state for the current analyzed repo
let currentRepo = null;
let currentConceptMap = null;

// ─── POST /api/analyze ─────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { path: repoPath } = req.body;
  if (!repoPath) return res.status(400).json({ error: 'Missing path field' });

  try {
    let absPath;
    if (isGitUrl(repoPath)) {
      cleanTempRepos();
      if (!fs.existsSync(cloneDir)) {
        fs.mkdirSync(cloneDir, { recursive: true });
      }
      const repoName = getRepoName(repoPath);
      absPath = path.join(cloneDir, `${repoName}-${Date.now()}`);
      console.log(`[Analyze] Cloning git repository: ${repoPath} into ${absPath}`);
      await execPromise(`git clone --depth 1 "${repoPath}" "${absPath}"`);
      console.log(`[Analyze] Clone complete.`);
    } else {
      absPath = path.resolve(repoPath);
      console.log(`[Analyze] Parsing repository: ${absPath}`);
    }

    // 1. Parse AST
    currentRepo = parseRepository(absPath);
    console.log(`[Analyze] Found ${currentRepo.fileCount} files, ${currentRepo.dependencyGraph.length} dependencies`);

    if (currentRepo.fileCount === 0) {
      throw new Error('No parseable source files found in the repository. Make sure the path points to a valid project directory.');
    }

    // 2. Generate concept map
    currentConceptMap = generateConceptMap(currentRepo);
    console.log(`[Analyze] Generated ${currentConceptMap.totalClusters} clusters`);

    // 3. Index in vector store
    await vectorStore.index(currentRepo.files, absPath);
    console.log(`[Analyze] Vector store indexed ${currentRepo.fileCount} documents`);

    // Build a file list without raw content (keep response lightweight)
    const fileList = currentRepo.files.map(f => ({
      filePath: f.filePath,
      language: f.language,
      lineCount: f.lineCount,
      functions: f.functions,
      classes: f.classes,
    }));

    res.json({
      success: true,
      ...currentConceptMap,
      fileList,
      telemetry: {
        clusters: currentConceptMap.totalClusters,
        files: currentConceptMap.totalFiles,
        dependencies: currentRepo.dependencyGraph.length,
        vectorHealth: vectorStore.getHealth(),
        groqReady,
      }
    });
  } catch (error) {
    console.error('[Analyze] Error:', error);
    let errorMsg = error.message;
    if (error.message && error.message.includes('git clone')) {
      errorMsg = 'Failed to clone the Git repository. Please verify that the URL is correct, public, and that Git is installed.';
    }
    res.status(500).json({ error: errorMsg });
  }
});

// ─── GET /api/narrative (SSE streaming) ─────────────────────────
app.get('/api/narrative', async (req, res) => {
  const action = req.query.action || 'Explain the overall architecture of this codebase';

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const files = currentRepo?.files || [];
  const clusters = currentConceptMap?.clusters || [];

  try {
    for await (const chunk of streamNarrative(files, action, clusters)) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  }
  res.end();
});

// ─── POST /api/trace ────────────────────────────────────────────
app.post('/api/trace', (req, res) => {
  const { action } = req.body;
  if (!currentRepo) return res.status(400).json({ error: 'No repository analyzed yet' });
  if (!action) return res.status(400).json({ error: 'Missing action field' });

  const result = traceFlow(action, currentRepo);
  res.json(result);
});

// ─── GET /api/actions ───────────────────────────────────────────
app.get('/api/actions', (req, res) => {
  res.json(getAvailableActions());
});

// ─── GET /api/telemetry ─────────────────────────────────────────
app.get('/api/telemetry', (req, res) => {
  res.json({
    clusters: currentConceptMap?.totalClusters || 0,
    files: currentConceptMap?.totalFiles || 0,
    dependencies: currentRepo?.dependencyGraph?.length || 0,
    vectorHealth: vectorStore.getHealth(),
    groqReady,
    activeTrace: null,
    throughput: groqReady ? '500+ T/s' : 'Mock Mode',
  });
});

// ─── GET /api/file-content ───────────────────────────────────────
app.get('/api/file-content', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'Missing path query parameter' });
  if (!currentRepo) return res.status(400).json({ error: 'No repository analyzed yet' });

  const file = currentRepo.files.find(f => f.filePath === filePath);
  if (!file) return res.status(404).json({ error: `File not found: ${filePath}` });

  res.json({
    filePath: file.filePath,
    language: file.language,
    lineCount: file.lineCount,
    content: file.content || '// Content not available',
    functions: file.functions,
    classes: file.classes,
    imports: file.imports,
  });
});

// ─── POST /api/query ────────────────────────────────────────────
app.post('/api/query', async (req, res) => {
  const { query, topK } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing query field' });

  const results = await vectorStore.query(query, topK || 5);
  res.json(results);
});

// ─── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔥 Amaterasu Backend — Port ${PORT}`);
  console.log(`   Groq SDK: ${groqReady ? '✅ Connected' : '⚠️  Mock mode (set GROQ_API_KEY in .env)'}`);
  console.log(`   Vector Store: In-memory mode\n`);
});
