import React from 'react';
import { getBezierPath, useInternalNode, useStore, BaseEdge, EdgeLabelRenderer, type EdgeProps, type ReactFlowState } from '@xyflow/react';
import { getEdgeParams } from './floatingUtils';

export default function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  label,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Get base edge parameters
  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode,
  );

  // Detect multiple edges between same nodes for offset calculation
  const { edgeIndex, isMultiEdge } = useStore((s: ReactFlowState) => {
    const allEdges = s.edges.filter(
      (e) =>
        (e.source === source && e.target === target) ||
        (e.source === target && e.target === source),
    );

    const sameDirectionEdges = allEdges.filter(
      (e) => e.source === source && e.target === target,
    );
    const edgeIndex = sameDirectionEdges.findIndex((e) => e.id === id);
    const isMultiEdge = allEdges.length > 1;

    return { edgeIndex, isMultiEdge };
  });

  // Calculate edge path with multi-edge offset
  let edgePath;
  let labelX, labelY;

  if (source === target) {
    // Self-loop: create a nice loop above the node
    const loopRadius = 40;
    edgePath = `M ${sx} ${sy} 
      C ${sx + loopRadius} ${sy - loopRadius}, 
        ${tx - loopRadius} ${ty - loopRadius}, 
        ${tx} ${ty}`;
    labelX = sx;
    labelY = sy - loopRadius - 15;
  } else {
    // Use bezier path with potential offset for multi-edges
    const [path] = getBezierPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
      targetX: tx,
      targetY: ty,
    });

    if (isMultiEdge) {
      // Add offset for multi-edge separation
      const dx = tx - sx;
      const dy = ty - sy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const offsetMultiplier = edgeIndex % 2 === 0 ? 1 : -1;
      const offset = (edgeIndex * 15) * offsetMultiplier;
      
      const perpX = (-dy / distance) * offset;
      const perpY = (dx / distance) * offset;
      const midX = (sx + tx) / 2 + perpX;
      const midY = (sy + ty) / 2 + perpY;
      
      edgePath = `M ${sx} ${sy} Q ${midX} ${midY} ${tx} ${ty}`;
      labelX = midX;
      labelY = midY;
    } else {
      edgePath = path;
      labelX = (sx + tx) / 2;
      labelY = (sy + ty) / 2;
    }
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: '#fff',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
              pointerEvents: 'all',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
