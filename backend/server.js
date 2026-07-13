import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { parseRepository, extractSignatures } from './services/astParser.js';
import { generateConceptMap } from './services/conceptMapper.js';
import { initGroq, streamNarrative } from './services/groqService.js';
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

const corsOptions = {
  origin: [
    "https://amaterasux.netlify.app",
    "https://yourdomain.com",
    "http://localhost:5173"
  ],
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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

// ─── POST /api/narrative (SSE streaming) ────────────────────────
app.post('/api/narrative', async (req, res) => {
  const { action = 'Explain the overall architecture of this codebase', chatHistory = [] } = req.body || {};

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders(); // Flush headers immediately so the client knows the stream has started

  const files = currentRepo?.files || [];
  const clusters = currentConceptMap?.clusters || [];

  try {
    for await (const chunk of streamNarrative(files, action, clusters, chatHistory)) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  }
  res.end();
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

// ─── POST /api/quiz ─────────────────────────────────────────
app.post('/api/quiz', async (req, res) => {
  const { level = 'beginner' } = req.body || {};

  if (!currentRepo) {
    return res.status(400).json({ error: 'No repository analyzed yet. Please analyze a repo first.' });
  }

  const files = currentRepo.files || [];
  const clusters = currentConceptMap?.clusters || [];
  const clusterInfo = clusters.map(c => `${c.icon || ''} ${c.name} (${c.fileCount} files)`).join(', ');
  const signatures = extractSignatures(files.slice(0, 20), 15);

  const levelDesc = level === 'advanced'
    ? 'in-depth implementation and design decision questions that require understanding the actual code structure, functions, and classes'
    : 'conceptual understanding questions about project structure, file roles, and coding patterns suitable for someone new to the codebase';

  const prompt = `You are Amaterasu AI. Generate a quiz with exactly 5 multiple-choice questions about the following codebase.

Level: ${level.toUpperCase()} — ${levelDesc}.

Clusters: ${clusterInfo}

File signatures (path | lines | functions | classes | imports):
${signatures}

Return ONLY valid JSON in this exact format, no markdown, no extra text:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}`;

  try {
    const { default: Groq } = await import('groq-sdk');
    const groqClient = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'gsk_your_key_here'
      ? new Groq({ apiKey: process.env.GROQ_API_KEY })
      : null;

    if (!groqClient) {
      // Mock quiz for dev mode
      const mockQuestions = generateMockQuiz(files, clusters, level);
      return res.json({ questions: mockQuestions });
    }

    const response = await groqClient.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a technical quiz generator. Always respond with valid JSON only, no markdown.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.5,
    });

    const raw = response.choices[0]?.message?.content || '{}';
    // Strip any markdown code block if present
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { questions: generateMockQuiz(files, clusters, level) };
    }

    return res.json(parsed);
  } catch (error) {
    console.error('[Quiz] Error:', error);
    return res.json({ questions: generateMockQuiz(files, clusters, level) });
  }
});

function generateMockQuiz(files, clusters, level) {
  const fileNames = files.slice(0, 5).map(f => f.filePath.split(/[/\\]/).pop());
  const clusterNames = clusters.map(c => c.name);

  if (level === 'advanced') {
    return [
      { question: `Which file in this codebase is most likely responsible for request parsing and routing?`, options: [fileNames[0] || 'index.js', fileNames[1] || 'router.js', fileNames[2] || 'server.js', 'config.js'], correctIndex: 2, explanation: 'Server files typically handle incoming requests and route them to appropriate handlers.' },
      { question: 'What architectural pattern is commonly used when files are grouped into Auth, API, and Database clusters?', options: ['Monolithic', 'Layered/N-Tier', 'Event-driven', 'Microservices'], correctIndex: 1, explanation: 'Auth, API, and Database groupings reflect a classic layered/N-Tier architecture with separation of concerns.' },
      { question: `How many functional domains (clusters) are detected in this codebase?`, options: [`${Math.max(1, (clusters.length || 3) - 1)}`, `${clusters.length || 3}`, `${(clusters.length || 3) + 1}`, `${(clusters.length || 3) + 2}`], correctIndex: 1, explanation: `The AST analysis detected ${clusters.length || 3} distinct clusters in the codebase.` },
      { question: 'Which design principle does the clean separation between Auth and Core Logic clusters illustrate?', options: ['DRY (Don\'t Repeat Yourself)', 'SRP (Single Responsibility Principle)', 'YAGNI (You Aren\'t Gonna Need It)', 'KISS (Keep It Simple Stupid)'], correctIndex: 1, explanation: 'Single Responsibility Principle means each module or cluster should handle one responsibility.' },
      { question: 'What is the primary benefit of vector-based semantic search in a codebase intelligence tool?', options: ['Faster compilation', 'Finding semantically related code even without exact keyword matches', 'Reducing file size', 'Eliminating syntax errors'], correctIndex: 1, explanation: 'Vector search enables finding conceptually related files based on meaning, not just text.' },
    ];
  }
  return [
    { question: 'What is the purpose of analyzing a repository with Amaterasu?', options: ['To compile the code', 'To understand the codebase structure and architecture', 'To run unit tests', 'To deploy to production'], correctIndex: 1, explanation: 'Amaterasu analyzes repository structure to provide an architectural overview and intelligence.' },
    { question: `How many files are in this codebase?`, options: [`${Math.max(1, files.length - 5)}`, `${files.length}`, `${files.length + 3}`, `${files.length + 10}`], correctIndex: 1, explanation: `The AST parser detected exactly ${files.length} parseable source files.` },
    { question: `Which domain cluster represents authentication and authorization code?`, options: [clusterNames[0] || 'API', 'Auth', clusterNames[1] || 'Database', 'Config'], correctIndex: 1, explanation: 'Auth clusters contain files related to user authentication and session management.' },
    { question: 'What does AST stand for in software development?', options: ['Application State Tree', 'Abstract Syntax Tree', 'Asynchronous Service Transport', 'Automated Software Testing'], correctIndex: 1, explanation: 'AST (Abstract Syntax Tree) is a tree representation of source code structure used in parsing and analysis.' },
    { question: 'What technology does Amaterasu use for its AI analysis?', options: ['OpenAI GPT-4', 'Google Gemini', 'Groq + LLaMA', 'Anthropic Claude'], correctIndex: 2, explanation: 'Amaterasu uses Groq API with the LLaMA model for fast, high-throughput AI analysis.' },
  ];
}

// ─── POST /api/compare ──────────────────────────────────────
app.post('/api/compare', async (req, res) => {
  const { fileA, fileB } = req.body || {};

  if (!fileA || !fileB) {
    return res.status(400).json({ error: 'Missing fileA or fileB' });
  }
  if (!currentRepo) {
    return res.status(400).json({ error: 'No repository analyzed yet.' });
  }

  const fa = currentRepo.files.find(f => f.filePath === fileA);
  const fb = currentRepo.files.find(f => f.filePath === fileB);

  if (!fa) return res.status(404).json({ error: `File not found: ${fileA}` });
  if (!fb) return res.status(404).json({ error: `File not found: ${fileB}` });

  // Compute stats
  const fileAStats = { lineCount: fa.lineCount, functions: fa.functions?.length ?? 0, classes: fa.classes?.length ?? 0 };
  const fileBStats = { lineCount: fb.lineCount, functions: fb.functions?.length ?? 0, classes: fb.classes?.length ?? 0 };

  // Compute shared/unique symbols
  const symA = new Set([...fa.functions.map(f => f.name), ...fa.classes.map(c => c.name)]);
  const symB = new Set([...fb.functions.map(f => f.name), ...fb.classes.map(c => c.name)]);
  const shared = [...symA].filter(s => symB.has(s));
  const uniqueToA = [...symA].filter(s => !symB.has(s));
  const uniqueToB = [...symB].filter(s => !symA.has(s));

  // AI analysis
  const nameA = fileA.split(/[/\\]/).pop();
  const nameB = fileB.split(/[/\\]/).pop();

  const prompt = `Compare these two files from the same codebase and explain their similarities, differences, purpose, and how they relate to each other. Be concise (max 300 words).

File A: ${nameA}
- Lines: ${fa.lineCount}, Functions: ${fa.functions.map(f=>f.name).join(', ') || 'none'}, Classes: ${fa.classes.map(c=>c.name).join(', ') || 'none'}
- Imports: ${fa.imports?.join(', ') || 'none'}

File B: ${nameB}
- Lines: ${fb.lineCount}, Functions: ${fb.functions.map(f=>f.name).join(', ') || 'none'}, Classes: ${fb.classes.map(c=>c.name).join(', ') || 'none'}
- Imports: ${fb.imports?.join(', ') || 'none'}`;

  let analysis = '';
  try {
    const { default: Groq } = await import('groq-sdk');
    const groqClient = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'gsk_your_key_here'
      ? new Groq({ apiKey: process.env.GROQ_API_KEY })
      : null;

    if (groqClient) {
      const response = await groqClient.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are Amaterasu, a codebase intelligence AI. Be concise and insightful.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 512,
        temperature: 0.3,
      });
      analysis = response.choices[0]?.message?.content || '';
    } else {
      analysis = `## Comparing ${nameA} vs ${nameB}\n\n**${nameA}** has ${fa.lineCount} lines with ${fa.functions.length} functions and ${fa.classes.length} classes.\n\n**${nameB}** has ${fb.lineCount} lines with ${fb.functions.length} functions and ${fb.classes.length} classes.\n\n${shared.length > 0 ? `Both files share ${shared.length} symbol(s): ${shared.join(', ')}.` : 'These files have no overlapping symbol names.'}\n\n> ⚠️ Running in mock mode (no Groq API key). Set GROQ_API_KEY in backend .env for real AI analysis.`;
    }
  } catch (error) {
    analysis = `Comparison analysis unavailable: ${error.message}`;
  }

  res.json({ fileAStats, fileBStats, shared, uniqueToA, uniqueToB, analysis });
});

// ─── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔥 Amaterasu Backend — Port ${PORT}`);
  console.log(`   Groq SDK: ${groqReady ? '✅ Connected' : '⚠️  Mock mode (set GROQ_API_KEY in .env)'}`);
  console.log(`   Vector Store: In-memory mode\n`);
});
