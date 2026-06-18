import { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ConceptNode from './ConceptNode';
import FileNode from './FileNode';

const nodeTypes = {
  conceptNode: ConceptNode,
  fileNode: FileNode,
};

const defaultEdgeOptions = {
  type: 'default',
  style: { strokeWidth: 1 },
};

export default function ConceptCanvas({ nodes: inputNodes, edges: inputEdges, highlightedNodes, highlightedEdges, onNodesChange, onEdgesChange }) {
  // Inject highlight state into node data
  const processedNodes = useMemo(() => {
    if (!inputNodes) return [];
    return inputNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        highlighted: highlightedNodes?.has(node.id) || false,
      }
    }));
  }, [inputNodes, highlightedNodes]);

  const [nodes, setNodes, handleNodesChange] = useNodesState(processedNodes);
  const [edges, setEdges, handleEdgesChange] = useEdgesState(inputEdges || []);

  // Sync external state changes into ReactFlow's internal state while preserving dragged positions
  useEffect(() => {
    setNodes((currentNodes) => {
      const positionMap = new Map(currentNodes.map(n => [n.id, n.position]));
      return processedNodes.map(node => {
        const currentPos = positionMap.get(node.id);
        return {
          ...node,
          position: currentPos || node.position,
        };
      });
    });
  }, [processedNodes, setNodes]);

  useEffect(() => {
    setEdges(inputEdges || []);
  }, [inputEdges]);

  const isEmpty = !inputNodes || inputNodes.length === 0;

  if (isEmpty) {
    return (
      <div className="panel-canvas">
        <div className="canvas-empty-state">
          <div className="canvas-empty-icon">🔮</div>
          <div className="canvas-empty-text">
            <h3>Concept Canvas</h3>
            <p>Analyze a repository to visualize its architecture as an interactive concept map</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-canvas">
      <div className="panel-canvas-inner">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          style={{ background: 'var(--bg-canvas-matte)' }}
        >
          <Background
            variant="dots"
            gap={20}
            size={1}
            color="#27272a"
          />
          <Controls
            showInteractive={false}
            position="bottom-left"
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.highlighted) return '#ea580c';
              return node.data?.color || '#27272a';
            }}
            maskColor="rgba(9, 9, 11, 0.85)"
            style={{ width: 140, height: 100 }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
