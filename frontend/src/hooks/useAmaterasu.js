import { useState, useCallback, useRef } from 'react';
import { analyzeRepo, streamNarrative, traceFlow as traceFlowApi, getAvailableActions, fetchFileContent } from '../services/api';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState(new Set());
  const [error, setError] = useState(null);
  const [repoPath, setRepoPath] = useState('');
  const [actions, setActions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const streamCleanupRef = useRef(null);

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

      // Fetch available actions
      try {
        const acts = await getAvailableActions();
        setActions(acts);
      } catch { /* ignore */ }

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

    setIsStreaming(true);
    setNarrative('');
    setError(null);

    const cleanup = streamNarrative(
      action,
      (chunk) => setNarrative(prev => prev + chunk),
      () => setIsStreaming(false),
      (err) => {
        setError(err);
        setIsStreaming(false);
      }
    );

    streamCleanupRef.current = cleanup;
  }, []);

  // Trace an execution flow
  const traceFlow = useCallback(async (actionName) => {
    setError(null);
    try {
      const result = await traceFlowApi(actionName);
      if (result.error) {
        setError(result.error);
        return;
      }

      setHighlightedNodes(new Set(result.highlightedNodes || []));
      setHighlightedEdges(new Set(result.highlightedEdges || []));

      setTelemetry(prev => ({
        ...prev,
        activeTrace: actionName,
      }));

      // Update edge styles for highlighting
      setEdges(prev => prev.map(edge => {
        const isHighlighted = result.highlightedEdges?.includes(edge.id);
        return {
          ...edge,
          animated: isHighlighted,
          style: isHighlighted
            ? { stroke: '#ea580c', strokeWidth: 2.5 }
            : { stroke: edge.id.startsWith('dep-') ? '#9a3412' : '#27272a', strokeWidth: edge.id.startsWith('dep-') ? 1.5 : 1 },
        };
      }));

      return result;
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Clear trace highlighting
  const clearTrace = useCallback(() => {
    setHighlightedNodes(new Set());
    setHighlightedEdges(new Set());
    setTelemetry(prev => ({ ...prev, activeTrace: null }));
    setEdges(prev => prev.map(edge => ({
      ...edge,
      animated: false,
      style: { stroke: edge.id.startsWith('dep-') ? '#9a3412' : '#27272a', strokeWidth: edge.id.startsWith('dep-') ? 1.5 : 1 },
    })));
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
    error, repoPath, actions,
    selectedFile, fileContent, isLoadingFile,
    // Actions
    analyze, generateNarrative, traceFlow, clearTrace,
    selectFile, closeFileViewer,
    setNodes, setEdges, setError,
  };
}
