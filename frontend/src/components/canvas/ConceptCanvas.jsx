import { useMemo, useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ConceptNode from './ConceptNode';
import FileNode from './FileNode';
import StepwiseView from './StepwiseView';
import { LayoutGrid, GitBranch } from 'lucide-react';

const nodeTypes = {
  conceptNode: ConceptNode,
  fileNode: FileNode,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: {
    strokeWidth: 1.5,
    stroke: '#3f3f46',
  },
  markerEnd: {
    type: 'arrowclosed',
    color: '#52525b',
    width: 14,
    height: 14,
  },
};

export default function ConceptCanvas({ nodes: inputNodes, edges: inputEdges, highlightedNodes, onNodeClick }) {
  const [viewMode, setViewMode] = useState('graph');

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

  useEffect(() => {
    setNodes((currentNodes) => {
      const positionMap = new Map(currentNodes.map(n => [n.id, n.position]));
      return processedNodes.map(node => {
        const currentPos = positionMap.get(node.id);
        return { ...node, position: currentPos || node.position };
      });
    });
  }, [processedNodes, setNodes]);

  useEffect(() => {
    setEdges(inputEdges || []);
  }, [inputEdges, setEdges]);

  const handleNodeClick = useCallback((event, node) => {
    if (node.type === 'fileNode' && node.data.fullPath && onNodeClick) {
      onNodeClick(node.data.fullPath);
    }
  }, [onNodeClick]);

  const isEmpty = !inputNodes || inputNodes.length === 0;

  if (isEmpty) {
    return (
      <div className="panel-canvas">
        <div className="canvas-empty-state">
          <div className="canvas-empty-orbit">
            <div className="canvas-empty-icon">🔮</div>
            <div className="canvas-orbit-ring canvas-orbit-ring--1" />
            <div className="canvas-orbit-ring canvas-orbit-ring--2" />
            <div className="canvas-orbit-ring canvas-orbit-ring--3" />
          </div>
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
      {/* View Toggle */}
      <div className="canvas-view-toggle">
        <button
          className={`canvas-view-btn ${viewMode === 'graph' ? 'active' : ''}`}
          onClick={() => setViewMode('graph')}
          title="Graph View"
        >
          <GitBranch size={12} />
          Graph
        </button>
        <button
          className={`canvas-view-btn ${viewMode === 'steps' ? 'active' : ''}`}
          onClick={() => setViewMode('steps')}
          title="Step View"
        >
          <LayoutGrid size={12} />
          Steps
        </button>
      </div>

      {viewMode === 'graph' ? (
        <div className="panel-canvas-inner">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.05}
            maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
            style={{ background: 'transparent' }}
          >
            {/* Multi-layer background */}
            <Background
              id="bg-dots"
              variant={BackgroundVariant.Dots}
              gap={28}
              size={1.2}
              color="#27272a"
              style={{ opacity: 0.7 }}
            />

            <Controls
              showInteractive={false}
              position="bottom-left"
              className="canvas-controls"
            />



            {/* Node count badge */}
            <Panel position="top-left" className="canvas-info-panel">
              <span className="canvas-info-badge">
                <span className="canvas-info-dot" />
                {inputNodes.filter(n => n.type === 'conceptNode').length} clusters
              </span>
              <span className="canvas-info-badge">
                {inputNodes.filter(n => n.type === 'fileNode').length} files
              </span>
              <span className="canvas-info-badge">
                {(inputEdges || []).length} edges
              </span>
            </Panel>
          </ReactFlow>
        </div>
      ) : (
        <StepwiseView
          nodes={inputNodes}
          edges={inputEdges}
          highlightedNodes={highlightedNodes}
          onNodeClick={onNodeClick}
        />
      )}
    </div>
  );
}
