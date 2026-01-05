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
    console.log(`FloatingEdge: Missing nodes for ${source} -> ${target}`, { sourceNode, targetNode });
    return null;
  }

  // Get base edge parameters - with fallback for self-loops
  let sx, sy, tx, ty, sourcePos, targetPos;
  
  if (source === target) {
    // Self-loop fallback: use node center coordinates
    sx = sourceNode.internals.positionAbsolute.x + (sourceNode.measured.width || 100) / 2;
    sy = sourceNode.internals.positionAbsolute.y + (sourceNode.measured.height || 40) / 2;
    tx = sx; // Same point for self-loop
    ty = sy;
    sourcePos = 'right';
    targetPos = 'left';
  } else {
    // Normal edge parameters
    const params = getEdgeParams(sourceNode, targetNode);
    sx = params.sx;
    sy = params.sy;
    tx = params.tx;
    ty = params.ty;
    sourcePos = params.sourcePos;
    targetPos = params.targetPos;
  }

  // Detect multiple edges between same nodes for BIDIRECTIONAL spacing
  const edgeInfo = useStore((s: ReactFlowState) => {
    // Get ALL edges between these two nodes (both directions)
    const allBidirectionalEdges = s.edges.filter(
      (e) =>
        (e.source === source && e.target === target) ||
        (e.source === target && e.target === source),
    );

    // Get edges in THIS direction only
    const sameDirectionEdges = allBidirectionalEdges.filter(
      (e) => e.source === source && e.target === target,
    );
    
    // Calculate indices for bidirectional spacing
    const edgeIndex = sameDirectionEdges.findIndex((e) => e.id === id);
    const totalSameDirection = sameDirectionEdges.length;
    const totalBidirectional = allBidirectionalEdges.length;
    const isMultiEdge = totalBidirectional > 1;

    return { edgeIndex, isMultiEdge, totalSameDirection, totalBidirectional };
  });

  // Extract edge info
  const { edgeIndex, isMultiEdge, totalSameDirection, totalBidirectional } = edgeInfo;

  // Calculate edge path with multi-edge offset
  let edgePath;
  let labelX, labelY;

  if (source === target) {
    // Calculate self-loop index properly for multiple self-loops
    const selfLoopIndex = useStore((s: ReactFlowState) => {
      const selfLoops = s.edges.filter(e => e.source === source && e.target === target);
      return selfLoops.findIndex(e => e.id === id);
    });
    
    const nodeWidth = sourceNode.measured.width || 100;
    const nodeHeight = sourceNode.measured.height || 40;
    const halfWidth = nodeWidth / 2;
    const halfHeight = nodeHeight / 2;

    // CIRCULAR SELF-LOOP: Nice round loop in top-right corner with spread start/end
    const loopRadius = 28 + (selfLoopIndex * 16); // Size of the loop
    
    // Start point: on top edge, near corner
    const startX = sx + halfWidth - 8 - (selfLoopIndex * 2);
    const startY = sy - halfHeight;
    
    // End point: on right edge, near corner  
    const endX = sx + halfWidth;
    const endY = sy - halfHeight + 8 + (selfLoopIndex * 2);
    
    // Control points for smooth quarter-circle arc
    const cp1x = startX;
    const cp1y = startY - loopRadius;
    const cp2x = endX + loopRadius;
    const cp2y = endY;
    
    edgePath = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
    
    // Label positioned outside the loop, stacked vertically with good spacing
    labelX = sx + halfWidth + loopRadius + 20;
    labelY = sy - halfHeight - 10 + (selfLoopIndex * 16);
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
      // BIDIRECTIONAL spacing: consider both directions together
      const dx = tx - sx;
      const dy = ty - sy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate perpendicular direction (normalized)
      const perpX = -dy / distance;
      const perpY = dx / distance;
      
      // ORIENTATION-AWARE spacing: more separation for vertical orientation
      let spacing;
      if (Math.abs(dy) > Math.abs(dx)) {
        // VERTICAL orientation - need MORE separation for label width
        spacing = 35; // Increased spacing for vertical connections
      } else {
        // HORIZONTAL or diagonal orientation - normal spacing
        spacing = 25; // Normal spacing for horizontal/diagonal
      }
      const maxOffset = (totalBidirectional - 1) * spacing / 2; // Center ALL edges
      
      // Calculate global edge index (considering both directions)
      // Need to find this edge's position among ALL bidirectional edges
      const globalEdgeIndex = useStore((s: ReactFlowState) => {
        const allBidirectionalEdges = s.edges.filter(
          (e) =>
            (e.source === source && e.target === target) ||
            (e.source === target && e.target === source),
        );
        
        // Find position of this edge among all bidirectional edges
        // Edges going same direction come first, then opposite direction
        const sameDirectionEdges = allBidirectionalEdges.filter(
          (e) => e.source === source && e.target === target,
        );
        const oppositeDirectionEdges = allBidirectionalEdges.filter(
          (e) => e.source === target && e.target === source,
        );
        
        // This edge's global index
        if (sameDirectionEdges.some(e => e.id === id)) {
          return sameDirectionEdges.findIndex(e => e.id === id);
        } else {
          return sameDirectionEdges.length + oppositeDirectionEdges.findIndex(e => e.id === id);
        }
      });
      
      // Calculate offset for this specific edge (centered spread)
      const edgeOffset = globalEdgeIndex * spacing - maxOffset;
      
      // Apply perpendicular offset
      const offsetX = perpX * edgeOffset;
      const offsetY = perpY * edgeOffset;
      
      // Create curved path with offset
      const midX = (sx + tx) / 2 + offsetX;
      const midY = (sy + ty) / 2 + offsetY;
      
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
