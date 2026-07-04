import { useState, useCallback, useRef, useEffect } from 'react';
import { analyzeRepo, streamNarrative, fetchFileContent } from '../services/api';

export function useAmaterasu() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [telemetry, setTelemetry] = useState({
    clusters: 0,
    files: 0,
    cacheHealth: 0,
    throughput: '—',
    activeTrace: null,
  });
  const [narrative, setNarrative] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState(new Set());
  const [error, setError] = useState(null);
  const [repoPath, setRepoPath] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const streamCleanupRef = useRef(null);
  // Always keep a ref to the latest chatHistory so generateNarrative closure never goes stale
  const chatHistoryRef = useRef(chatHistory);
  useEffect(() => { chatHistoryRef.current = chatHistory; }, [chatHistory]);

  // Analyze a repository
  const analyze = useCallback(async (path) => {
    setIsAnalyzing(true);
    setError(null);
    setNarrative('');
    setHighlightedNodes(new Set());
    setHighlightedEdges(new Set());

    try {
      const result = await analyzeRepo(path);
      setNodes(result.nodes || []);
      setEdges(result.edges || []);
      setClusters(result.clusters || []);
      setRepoPath(path);

      setTelemetry({
        clusters: result.totalClusters || 0,
        files: result.totalFiles || 0,
        dependencies: result.telemetry?.dependencies || 0,
        cacheHealth: result.telemetry?.vectorHealth?.cachePercentage || 99,
        throughput: result.telemetry?.groqReady ? '500+ T/s' : 'Mock',
        activeTrace: null,
      });


      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Stream an architectural narrative
  const generateNarrative = useCallback((action) => {
    // Cleanup previous stream
    if (streamCleanupRef.current) streamCleanupRef.current();

    const entryId = Date.now();
    const timestamp = new Date();

    setIsStreaming(true);
    setNarrative('');
    setError(null);

    // Add a new entry for this command immediately
    setChatHistory(prev => [
      ...prev,
      { id: entryId, command: action, response: '', isStreaming: true, timestamp },
    ]);

    const cleanup = streamNarrative(
      action,
      (chunk) => {
        setNarrative(prev => prev + chunk);
        setChatHistory(prev => prev.map(entry =>
          entry.id === entryId
            ? { ...entry, response: entry.response + chunk }
            : entry
        ));
      },
      () => {
        setIsStreaming(false);
        setChatHistory(prev => prev.map(entry =>
          entry.id === entryId ? { ...entry, isStreaming: false } : entry
        ));
      },
      (err) => {
        setError(err);
        setIsStreaming(false);
        setChatHistory(prev => prev.map(entry =>
          entry.id === entryId
            ? { ...entry, isStreaming: false, error: err }
            : entry
        ));
      },
      chatHistoryRef.current, // pass history for conversational memory (always fresh via ref)
    );

    streamCleanupRef.current = cleanup;
  }, []);


  // Select a file to view its code
  const selectFile = useCallback(async (filePath) => {
    if (!filePath) {
      setSelectedFile(null);
      setFileContent(null);
      return;
    }
    setSelectedFile(filePath);
    setIsLoadingFile(true);
    try {
      const result = await fetchFileContent(filePath);
      setFileContent(result);
    } catch (err) {
      setError(`Failed to load file: ${err.message}`);
      setFileContent(null);
    } finally {
      setIsLoadingFile(false);
    }
  }, []);

  const closeFileViewer = useCallback(() => {
    setSelectedFile(null);
    setFileContent(null);
  }, []);

  return {
    // State
    nodes, edges, clusters, telemetry, narrative,
    isAnalyzing, isStreaming, highlightedNodes, highlightedEdges,
    error, repoPath,
    selectedFile, fileContent, isLoadingFile,
    chatHistory,
    // Actions
    analyze, generateNarrative,
    selectFile, closeFileViewer,
    setNodes, setEdges, setError,
  };
}
