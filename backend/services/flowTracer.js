// Flow tracer: given an action type and parsed repo, trace the execution path

const ACTION_TEMPLATES = {
  'User Login': {
    keywords: ['login', 'auth', 'session', 'jwt', 'token', 'password', 'credential', 'signin'],
    description: 'User authentication and session establishment flow',
    stages: ['Route Handler', 'Authentication Logic', 'Database Query', 'Token Generation', 'Response']
  },
  'API Request': {
    keywords: ['route', 'api', 'controller', 'handler', 'middleware', 'request', 'response', 'endpoint'],
    description: 'Standard API request processing pipeline',
    stages: ['Middleware', 'Route Match', 'Controller', 'Service Layer', 'Data Access', 'Response']
  },
  'Data Query': {
    keywords: ['db', 'query', 'model', 'schema', 'find', 'select', 'repository', 'orm'],
    description: 'Database read operation and data transformation',
    stages: ['Service Request', 'Query Builder', 'Database Call', 'Result Mapping', 'Return']
  },
  'File Upload': {
    keywords: ['upload', 'file', 'multer', 'stream', 'buffer', 'storage', 'media', 'asset'],
    description: 'File upload processing and storage pipeline',
    stages: ['Multipart Parse', 'Validation', 'Processing', 'Storage Write', 'Metadata Save']
  },
  'Error Handling': {
    keywords: ['error', 'exception', 'catch', 'throw', 'handler', 'middleware', 'log', 'sentry'],
    description: 'Error capture, logging, and recovery flow',
    stages: ['Error Thrown', 'Error Middleware', 'Logging', 'User Notification', 'Recovery']
  }
};

export function getAvailableActions() {
  return Object.entries(ACTION_TEMPLATES).map(([name, template]) => ({
    name,
    description: template.description,
    stages: template.stages
  }));
}

// Trace a specific action through the codebase
export function traceFlow(actionName, repoData) {
  const template = ACTION_TEMPLATES[actionName];
  if (!template) {
    return { error: `Unknown action: ${actionName}. Available: ${Object.keys(ACTION_TEMPLATES).join(', ')}` };
  }

  const { files, dependencyGraph } = repoData;
  const matchedFiles = [];

  // Score each file by keyword relevance to the action
  for (const file of files) {
    const searchText = (
      file.filePath + ' ' +
      file.functions.map(f => f.name).join(' ') +
      file.classes.map(c => c.name).join(' ') +
      file.imports.map(i => i.source).join(' ')
    ).toLowerCase();

    let score = 0;
    const matchedKeywords = [];
    for (const kw of template.keywords) {
      if (searchText.includes(kw)) {
        score++;
        matchedKeywords.push(kw);
      }
    }

    if (score > 0) {
      matchedFiles.push({ ...file, score, matchedKeywords });
    }
  }

  // Sort by relevance
  matchedFiles.sort((a, b) => b.score - a.score);

  // Build trace path (top files become the "lit up" path)
  const tracePath = matchedFiles.slice(0, 10).map(f => f.filePath);

  // Find edges along the trace path
  const traceEdges = dependencyGraph.filter(
    edge => tracePath.includes(edge.source) || tracePath.includes(edge.target)
  );

  // Map to highlight data for React Flow
  const highlightedNodes = tracePath.map(fp => `file-${fp}`);
  const highlightedEdges = traceEdges.map(e => `dep-${e.source}-${e.target}`);

  return {
    action: actionName,
    description: template.description,
    stages: template.stages,
    tracePath: matchedFiles.slice(0, 10).map(f => ({
      filePath: f.filePath,
      score: f.score,
      matchedKeywords: f.matchedKeywords,
      functions: f.functions.map(fn => fn.name),
    })),
    highlightedNodes,
    highlightedEdges,
    totalMatches: matchedFiles.length,
  };
}
