import Groq from 'groq-sdk';
import { extractSignatures } from './astParser.js';
import { vectorStore } from './vectorStore.js';

let groq = null;

export function initGroq(apiKey) {
  if (!apiKey || apiKey === 'gsk_your_key_here') {
    console.warn('[Groq] No valid API key — AI features will use mock responses.');
    return false;
  }
  groq = new Groq({ apiKey });
  console.log('[Groq] Initialized with llama-3.1-8b-instant');
  return true;
}

// Strict system prompt: always answer the user's actual question grounded in the codebase
const SYSTEM_PROMPT = `You are Amaterasu, a codebase intelligence assistant.

STRICT RULES:
1. Read the user's question carefully and answer EXACTLY what they asked — do not drift to generic architecture explanations unless that is what was asked.
2. Ground every statement in the file signatures and cluster data provided. Do not invent functionality.
3. If the question is about a specific file, function, or feature — focus only on that. Ignore unrelated files.
4. If the question asks for an overall architecture overview, describe the actual clusters, files, and their relationships shown in the context.
5. Use markdown with clear headers. Be concise and direct. Max 700 tokens.
6. If you are unsure, say so honestly rather than guessing.
7. NEVER say you don't have enough information if cluster data and file signatures were provided — use what you have.`;

// Generate a streaming architectural narrative (SSE), with optional conversation history
export async function* streamNarrative(parsedFiles, action, clusterSummary, chatHistory = []) {
  // Retrieve relevant files via vector search for specific questions
  let relevantFiles = parsedFiles;

  if (action && action !== 'Explain the overall architecture of this codebase') {
    try {
      const searchResults = await vectorStore.query(action, 10);
      if (searchResults && searchResults.length > 0) {
        const matchedPaths = new Set(searchResults.map(r => r.id));
        relevantFiles = parsedFiles.filter(f => matchedPaths.has(f.filePath));
        if (relevantFiles.length === 0) relevantFiles = parsedFiles;
      }
    } catch (err) {
      console.error('[Groq RAG] Vector store query failed, falling back to all files:', err);
    }
  }

  const signatures = extractSignatures(relevantFiles, 20);
  const clusterInfo = clusterSummary
    ? clusterSummary.map(c => `${c.icon} ${c.name} (${c.fileCount} files)`).join(', ')
    : 'No cluster data';

  // Put the user's question FIRST so the model focuses on it
  const userPrompt = `**User question:** ${action}

---
**Codebase context (answer the question above using this data):**
Total files analyzed: ${parsedFiles.length}
Clusters/domains: ${clusterInfo}

Relevant file signatures (path | lines | functions | classes | imports):
${signatures}`;

  if (!groq) {
    const mockText = generateMockNarrative(clusterSummary, action, parsedFiles);
    for (const char of mockText) {
      yield char;
      await sleep(8);
    }
    return;
  }

  // Build message array: system + prior conversation turns + current question
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  // Inject up to last 6 turns of chat history for conversational memory
  const recentHistory = chatHistory.slice(-6);
  for (const entry of recentHistory) {
    if (entry.command) messages.push({ role: 'user', content: entry.command });
    if (entry.response) messages.push({ role: 'assistant', content: entry.response });
  }

  // Add the current user question with codebase context
  messages.push({ role: 'user', content: userPrompt });

  try {
    const stream = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.3,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) yield content;
    }
  } catch (error) {
    yield `\n\n⚠️ Groq API Error: ${error.message}`;
  }
}

// Non-streaming concept summary
export async function summarizeConcept(files, domainName) {
  const signatures = extractSignatures(files, 8);
  const prompt = `Summarize the "${domainName}" domain in 2-3 sentences. Files:\n${signatures}`;

  if (!groq) return `The ${domainName} domain contains ${files.length} file(s) handling ${domainName.toLowerCase()} functionality.`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 256,
      temperature: 0.3,
    });
    return response.choices[0]?.message?.content || 'No summary available.';
  } catch (error) {
    return `Summary unavailable: ${error.message}`;
  }
}

function generateMockNarrative(clusters, action, parsedFiles) {
  const header = `## 🏗️ Architectural Analysis\n\n`;
  const intro = `> Analyzing: *${action}*\n\n`;

  if (!clusters || clusters.length === 0) {
    if (!parsedFiles || parsedFiles.length === 0) {
      return `${header}${intro}No repository data available. Please analyze a repository first.\n`;
    }
    // No clusters but we have files — describe files directly
    let body = `${header}${intro}### Repository Overview\n\nFound **${parsedFiles.length} files** in the repository:\n\n`;
    for (const f of parsedFiles.slice(0, 10)) {
      const fns = f.functions.map(fn => fn.name).join(', ') || 'none';
      const cls = f.classes.map(c => c.name).join(', ') || 'none';
      body += `- \`${f.filePath}\` (${f.lineCount} lines) — Functions: ${fns} | Classes: ${cls}\n`;
    }
    if (parsedFiles.length > 10) body += `- ... and ${parsedFiles.length - 10} more files\n`;
    body += `\n> ⚠️ Running in mock mode (no Groq API key). Set GROQ_API_KEY in backend .env for real AI analysis.\n`;
    return body;
  }

  let body = `${header}${intro}### System Overview\n\nThis codebase is organized into **${clusters.length} functional domains**:\n\n`;

  for (const c of clusters) {
    body += `- ${c.icon} **${c.name}** — ${c.fileCount} file(s) forming the ${c.name.toLowerCase()} layer\n`;
  }

  body += `\n### Execution Flow\n\n`;
  body += `The system follows a layered architecture where requests flow through the API Routing layer, `;
  body += `are authenticated via the Authentication domain, processed by Core Logic, `;
  body += `and persisted through the Database infrastructure.\n\n`;
  body += `### 💡 Key Insight\n\n`;
  body += `The dependency graph reveals a clean separation of concerns with minimal cross-cutting between domains. `;
  body += `Each cluster maintains its own internal cohesion while exposing well-defined interfaces to adjacent layers.\n`;
  body += `\n> ⚠️ Running in mock mode (no Groq API key). Set GROQ_API_KEY in backend .env for real AI analysis.\n`;

  return body;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
