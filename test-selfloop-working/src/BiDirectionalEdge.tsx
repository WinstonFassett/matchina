import React from 'react';
import {
  getBezierPath,
  useStore,
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  type ReactFlowState,
} from '@xyflow/react';

export type GetSpecialPathParams = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
};

export const getSpecialPath = (
  { sourceX, sourceY, targetX, targetY }: GetSpecialPathParams,
  offset: number,
) => {
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;

  // Calculate perpendicular offset for diagonal edges
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  
  // Perpendicular vector (normalized and scaled by offset)
  const perpX = (-dy / len) * offset;
  const perpY = (dx / len) * offset;

  return `M ${sourceX} ${sourceY} Q ${centerX + perpX} ${
    centerY + perpY
  } ${targetX} ${targetY}`;
};

export default function CustomEdge({
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  label,
  id,
}: EdgeProps) {
  const edgeInfo = useStore((s: ReactFlowState) => {
    // Find all edges between these two nodes (both directions)
    const allEdges = s.edges.filter(
      (e) =>
        (e.source === source && e.target === target) ||
        (e.source === target && e.target === source),
    );

    // Find this edge's index among edges in the same direction
    const sameDirectionEdges = allEdges.filter(
      (e) => e.source === source && e.target === target,
    );
    const edgeIndex = sameDirectionEdges.findIndex((e) => e.id === id);
    const totalEdges = allEdges.length;

    return { edgeIndex, totalEdges, isBiDirectional: totalEdges > 1 };
  });

  const edgePathParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };

  let path = '';
  
  // Calculate offset based on edge index for multi-edge separation
  const { edgeIndex, isBiDirectional } = edgeInfo;
  
  let labelX: number, labelY: number;
  
  if (isBiDirectional) {
    // Calculate base offset direction
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const isLeftToRight = dx > 0 || (dx === 0 && dy > 0);
    
    // Assign unique offset based on edge index
    // For multiple edges: alternate up/down with increasing distance
    const offsetMultiplier = edgeIndex % 2 === 0 ? 1 : -1;
    const offsetMagnitude = 30 + (edgeIndex * 15); // Increase separation for outer edges
    const offset = (isLeftToRight ? offsetMagnitude : -offsetMagnitude) * offsetMultiplier;
    
    path = getSpecialPath(edgePathParams, offset);
    
    // Position label along the curve
    labelX = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2 + offset * 0.8;
  } else {
    [path] = getBezierPath(edgePathParams);
    labelX = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2;
  }

  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} />
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
