// In-memory vector store fallback (no Docker/ChromaDB required)
// Stores file metadata with simple TF-IDF-like similarity matching

class VectorStore {
  constructor() {
    this.documents = new Map(); // id → { content, metadata, terms }
    this.idf = new Map(); // term → inverse document frequency
    this.ready = false;
  }

  // Index parsed files into the store
  async index(parsedFiles, rootPath) {
    this.documents.clear();
    this.idf.clear();

    const docFreq = new Map();

    for (const file of parsedFiles) {
      const id = file.filePath;
      const content = [
        file.filePath,
        ...file.functions.map(f => f.name),
        ...file.classes.map(c => c.name),
        ...file.imports.map(i => i.source),
        file.language
      ].join(' ').toLowerCase();

      const terms = tokenize(content);
      const termFreq = new Map();
      for (const t of terms) {
        termFreq.set(t, (termFreq.get(t) || 0) + 1);
      }

      // Track document frequency
      const uniqueTerms = new Set(terms);
      for (const t of uniqueTerms) {
        docFreq.set(t, (docFreq.get(t) || 0) + 1);
      }

      this.documents.set(id, {
        content,
        metadata: {
          filePath: file.filePath,
          language: file.language,
          lineCount: file.lineCount,
          functions: file.functions.map(f => f.name),
          classes: file.classes.map(c => c.name),
        },
        terms,
        termFreq,
      });
    }

    // Compute IDF
    const N = this.documents.size;
    for (const [term, df] of docFreq) {
      this.idf.set(term, Math.log(N / (1 + df)));
    }

    this.ready = true;
    return { indexed: this.documents.size, rootPath };
  }

  // Query by text similarity (cosine-like TF-IDF scoring)
  async query(queryText, topK = 5) {
    if (!this.ready) return [];

    const queryTerms = tokenize(queryText.toLowerCase());
    const queryVec = new Map();
    for (const t of queryTerms) {
      const idf = this.idf.get(t) || 0;
      queryVec.set(t, (queryVec.get(t) || 0) + idf);
    }

    const scores = [];
    for (const [id, doc] of this.documents) {
      let score = 0;
      for (const [term, qWeight] of queryVec) {
        const tf = doc.termFreq.get(term) || 0;
        const idf = this.idf.get(term) || 0;
        score += qWeight * tf * idf;
      }
      if (score > 0) {
        scores.push({ id, score, metadata: doc.metadata });
      }
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topK);
  }

  getHealth() {
    return {
      indexed: this.documents.size,
      ready: this.ready,
      cachePercentage: this.ready ? 99 : 0,
      mode: 'in-memory'
    };
  }
}

function tokenize(text) {
  return text
    .replace(/[^a-z0-9_]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

// Singleton
export const vectorStore = new VectorStore();
