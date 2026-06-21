// Domain classification rules: keyword patterns → conceptual clusters
const DOMAIN_RULES = [
  { domain: 'Authentication', keywords: ['auth', 'login', 'logout', 'session', 'jwt', 'token', 'passport', 'oauth', 'signup', 'register', 'password', 'credential'], icon: '🔐', color: '#ea580c' },
  { domain: 'API Routing', keywords: ['route', 'router', 'api', 'endpoint', 'controller', 'handler', 'middleware', 'request', 'response', 'rest', 'graphql'], icon: '🔀', color: '#f59e0b' },
  { domain: 'Database', keywords: ['db', 'database', 'model', 'schema', 'migration', 'query', 'sequelize', 'mongoose', 'prisma', 'knex', 'sql', 'orm', 'entity', 'repository'], icon: '🗄️', color: '#8b5cf6' },
  { domain: 'Telemetry', keywords: ['log', 'logger', 'metric', 'monitor', 'telemetry', 'analytics', 'trace', 'observ', 'sentry', 'datadog'], icon: '📡', color: '#06b6d4' },
  { domain: 'UI Components', keywords: ['component', 'page', 'view', 'layout', 'widget', 'modal', 'form', 'button', 'card', 'header', 'footer', 'sidebar', 'nav'], icon: '🎨', color: '#ec4899' },
  { domain: 'State Management', keywords: ['store', 'state', 'redux', 'context', 'provider', 'reducer', 'action', 'slice', 'zustand', 'recoil', 'hook'], icon: '⚡', color: '#10b981' },
  { domain: 'Utilities', keywords: ['util', 'helper', 'lib', 'common', 'shared', 'format', 'parse', 'validate', 'sanitize', 'transform'], icon: '🔧', color: '#64748b' },
  { domain: 'Testing', keywords: ['test', 'spec', 'mock', 'fixture', 'jest', 'mocha', 'cypress', 'vitest', 'playwright', 'e2e'], icon: '🧪', color: '#a855f7' },
  { domain: 'Configuration', keywords: ['config', 'env', 'setting', 'constant', 'setup', 'init', 'bootstrap', '.env', 'toml', 'yaml', 'yml', 'ini', 'editorconfig', 'prettierrc', 'eslintrc', 'babelrc'], icon: '⚙️', color: '#78716c' },
  { domain: 'Styles', keywords: ['css', 'scss', 'sass', 'less', 'style', 'theme', 'tailwind', 'font', 'animation', 'color', 'gradient', 'responsive', 'media'], icon: '🎭', color: '#f472b6' },
  { domain: 'Markup & Templates', keywords: ['html', 'htm', 'template', 'ejs', 'pug', 'handlebars', 'hbs', 'mustache', 'xml', 'svg', 'xsl'], icon: '📄', color: '#fb923c' },
  { domain: 'Documentation', keywords: ['readme', 'changelog', 'license', 'contributing', 'docs', '.md', '.txt', 'guide', 'tutorial', 'wiki'], icon: '📖', color: '#38bdf8' },
  { domain: 'Data & Schemas', keywords: ['json', 'yaml', 'yml', 'toml', 'csv', 'graphql', 'proto', 'protobuf', 'openapi', 'swagger', 'fixture', 'seed', 'data'], icon: '📊', color: '#34d399' },
  { domain: 'DevOps & CI', keywords: ['docker', 'dockerfile', 'compose', 'kubernetes', 'k8s', 'helm', 'terraform', 'ansible', 'ci', 'cd', 'pipeline', 'workflow', 'github', 'gitlab', 'jenkins', 'makefile', 'deploy', 'nginx', 'procfile'], icon: '🚀', color: '#818cf8' },
  { domain: 'Build & Tooling', keywords: ['webpack', 'vite', 'rollup', 'esbuild', 'babel', 'tsconfig', 'package.json', 'cargo', 'gradle', 'maven', 'pom', 'build', 'compile', 'bundle', 'script'], icon: '🔨', color: '#fbbf24' },
];

const DEFAULT_DOMAIN = { domain: 'Core Logic', icon: '💡', color: '#f97316' };

// Classify a single file into a domain
function classifyFile(file) {
  const searchText = (file.filePath + ' ' + file.functions.map(f => f.name).join(' ') + ' ' + file.classes.map(c => c.name).join(' ') + ' ' + file.imports.map(i => i.source).join(' ')).toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  for (const rule of DOMAIN_RULES) {
    const score = rule.keywords.reduce((acc, kw) => acc + (searchText.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule;
    }
  }

  return bestScore > 0 ? bestMatch : DEFAULT_DOMAIN;
}

// Generate React Flow nodes and edges from parsed repository data
export function generateConceptMap(repoData) {
  const { files, dependencyGraph } = repoData;
  const clusters = new Map(); // domain → files[]

  // 1. Classify each file
  for (const file of files) {
    const domain = classifyFile(file);
    if (!clusters.has(domain.domain)) {
      clusters.set(domain.domain, { ...domain, files: [] });
    }
    clusters.get(domain.domain).files.push(file);
  }

  // 2. Build React Flow nodes
  const nodes = [];
  const fileToCluster = new Map();
  let clusterIndex = 0;
  const clusterPositions = calculateClusterPositions(clusters.size);

  for (const [domainName, cluster] of clusters) {
    const pos = clusterPositions[clusterIndex];

    // Cluster parent node
    nodes.push({
      id: `cluster-${domainName}`,
      type: 'conceptNode',
      position: { x: pos.x, y: pos.y },
      data: {
        label: domainName,
        icon: cluster.icon,
        color: cluster.color,
        fileCount: cluster.files.length,
        files: cluster.files.map(f => ({
          path: f.filePath,
          language: f.language,
          lineCount: f.lineCount,
          functions: f.functions.map(fn => fn.name),
          classes: f.classes.map(c => c.name),
        }))
      }
    });

    // File nodes positioned around cluster
    cluster.files.forEach((file, i) => {
      const angle = (2 * Math.PI * i) / Math.max(cluster.files.length, 1);
      const radius = 120 + cluster.files.length * 8;
      const fileNodeId = `file-${file.filePath}`;
      fileToCluster.set(file.filePath, `cluster-${domainName}`);

      nodes.push({
        id: fileNodeId,
        type: 'fileNode',
        position: { x: pos.x + Math.cos(angle) * radius, y: pos.y + Math.sin(angle) * radius },
        data: {
          label: file.filePath.split('/').pop(),
          fullPath: file.filePath,
          language: file.language,
          lineCount: file.lineCount,
          functions: file.functions.length,
          classes: file.classes.length,
          parentCluster: domainName,
          color: cluster.color,
        }
      });
    });

    clusterIndex++;
  }

  // 3. Build React Flow edges
  const edges = [];

  // File → cluster membership edges
  for (const [filePath, clusterId] of fileToCluster) {
    edges.push({
      id: `member-${filePath}`,
      source: clusterId,
      target: `file-${filePath}`,
      type: 'default',
      style: { stroke: '#27272a', strokeWidth: 1 },
      animated: false,
    });
  }

  // Dependency edges between files
  for (const dep of dependencyGraph) {
    edges.push({
      id: `dep-${dep.source}-${dep.target}`,
      source: `file-${dep.source}`,
      target: `file-${dep.target}`,
      type: 'default',
      style: { stroke: '#9a3412', strokeWidth: 1.5 },
      animated: false,
      label: dep.specifiers.length <= 2 ? dep.specifiers.join(', ') : `${dep.specifiers.length} imports`,
      labelStyle: { fill: '#78716c', fontSize: 10 },
    });
  }

  return {
    nodes,
    edges,
    clusters: Array.from(clusters.entries()).map(([name, c]) => ({
      name,
      icon: c.icon,
      color: c.color,
      fileCount: c.files.length
    })),
    totalFiles: files.length,
    totalClusters: clusters.size
  };
}

// Circular layout for cluster centers
function calculateClusterPositions(count) {
  const positions = [];
  const centerX = 400;
  const centerY = 300;
  const radius = 250 + count * 30;

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    positions.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  }
  return positions;
}
