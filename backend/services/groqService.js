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

// System prompt kept ultra-minimal to save tokens (~120 tokens)
const SYSTEM_PROMPT = `You are Amaterasu, a codebase intelligence engine. Analyze code architecture concisely. Use technical language. Structure output with clear headers. Keep responses under 800 tokens.`;

// Generate a streaming architectural narrative (SSE)
export async function* streamNarrative(parsedFiles, action, clusterSummary) {
  // Build a token-efficient context using vector store query if query is specific
  let relevantFiles = parsedFiles;

  if (action && action !== 'Explain the overall architecture of this codebase') {
    try {
      const searchResults = await vectorStore.query(action, 10);
      if (searchResults && searchResults.length > 0) {
        const matchedPaths = new Set(searchResults.map(r => r.id));
        relevantFiles = parsedFiles.filter(f => matchedPaths.has(f.filePath));
        if (relevantFiles.length === 0) {
          relevantFiles = parsedFiles;
        }
      }
    } catch (err) {
      console.error('[Groq RAG] Vector store query failed, falling back to sequential files:', err);
    }
  }

  const signatures = extractSignatures(relevantFiles, 15);
  const clusterInfo = clusterSummary
    ? `Clusters: ${clusterSummary.map(c => `${c.icon} ${c.name} (${c.fileCount} files)`).join(', ')}`
    : '';

  const userPrompt = `${action}

Codebase snapshot:
${clusterInfo}

File signatures:
${signatures}

Provide a clear architectural narrative.`;

  if (!groq) {
    // Mock streaming for demo when no API key
    const mockText = generateMockNarrative(clusterSummary, action);
    for (const char of mockText) {
      yield char;
      await sleep(8);
    }
    return;
  }

  try {
    const stream = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      stream: true,
      max_tokens: 1024,
      temperature: 0.4,
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

function generateMockNarrative(clusters, action) {
  const header = `## 🏗️ Architectural Analysis\n\n`;
  const intro = `> Analyzing: *${action}*\n\n`;

  if (!clusters || clusters.length === 0) {
    return `${header}${intro}No clusters detected. Please analyze a repository first to generate architectural narratives.\n`;
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

  return body;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
