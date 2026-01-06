import React from 'react';
import {
  getBezierPath,
  useInternalNode,
  useStore,
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  type ReactFlowState,
} from '@xyflow/react';
import { getEdgeParams } from './floatingUtils';

interface FloatingEdgeData {
  event?: string;
  isClickable?: boolean;
  isActive?: boolean;
}

/**
 * FloatingEdge - Enhanced edge component with self-loop and bidirectional support
 *
 * Features:
 * - Circular self-loops with proper stacking for multiple loops
 * - Bidirectional edge spacing to prevent overlap
 * - Clean label positioning
 */
export default function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  label,
  style,
  data,
}: EdgeProps<FloatingEdgeData>) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Get base edge parameters - with fallback for self-loops
  let sx: number, sy: number, tx: number, ty: number, sourcePos: any, targetPos: any;

  if (source === target) {
    // Self-loop fallback: use node center coordinates
    const measured = sourceNode.measured || { width: 100, height: 40 };
    sx = sourceNode.internals.positionAbsolute.x + measured.width / 2;
    sy = sourceNode.internals.positionAbsolute.y + measured.height / 2;
    tx = sx;
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
        (e.source === target && e.target === source)
    );

    // Get edges in THIS direction only
    const sameDirectionEdges = allBidirectionalEdges.filter(
      (e) => e.source === source && e.target === target
    );

    // Calculate indices for bidirectional spacing
    const edgeIndex = sameDirectionEdges.findIndex((e) => e.id === id);
    const totalSameDirection = sameDirectionEdges.length;
    const totalBidirectional = allBidirectionalEdges.length;
    const isMultiEdge = totalBidirectional > 1;

    return { edgeIndex, isMultiEdge, totalSameDirection, totalBidirectional };
  });

  const { isMultiEdge, totalBidirectional } = edgeInfo;

  // Calculate edge path with multi-edge offset
  let edgePath: string;
  let labelX: number, labelY: number;

  if (source === target) {
    // Calculate self-loop index for multiple self-loops
    const selfLoopIndex = useStore((s: ReactFlowState) => {
      const selfLoops = s.edges.filter((e) => e.source === source && e.target === target);
      return selfLoops.findIndex((e) => e.id === id);
    });

    const measured = sourceNode.measured || { width: 100, height: 40 };
    const nodeWidth = measured.width;
    const nodeHeight = measured.height;
    const halfWidth = nodeWidth / 2;
    const halfHeight = nodeHeight / 2;

    // CIRCULAR SELF-LOOP: Nice round loop in top-right corner with spread start/end
    const loopRadius = 28 + selfLoopIndex * 16;

    // Start point: on top edge, near corner
    const startX = sx + halfWidth - 8 - selfLoopIndex * 2;
    const startY = sy - halfHeight;

    // End point: on right edge, near corner
    const endX = sx + halfWidth;
    const endY = sy - halfHeight + 8 + selfLoopIndex * 2;

    // Control points for smooth quarter-circle arc
    const cp1x = startX;
    const cp1y = startY - loopRadius;
    const cp2x = endX + loopRadius;
    const cp2y = endY;

    edgePath = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

    // Label positioned outside the loop, stacked vertically with good spacing
    labelX = sx + halfWidth + loopRadius + 20;
    labelY = sy - halfHeight - 10 + selfLoopIndex * 16;
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
      let spacing: number;
      if (Math.abs(dy) > Math.abs(dx)) {
        // VERTICAL orientation - need MORE separation for label width
        spacing = 35;
      } else {
        // HORIZONTAL or diagonal orientation - normal spacing
        spacing = 25;
      }
      const maxOffset = ((totalBidirectional - 1) * spacing) / 2;

      // Calculate global edge index (considering both directions)
      const globalEdgeIndex = useStore((s: ReactFlowState) => {
        const allBidirectionalEdges = s.edges.filter(
          (e) =>
            (e.source === source && e.target === target) ||
            (e.source === target && e.target === source)
        );

        const sameDirectionEdges = allBidirectionalEdges.filter(
          (e) => e.source === source && e.target === target
        );
        const oppositeDirectionEdges = allBidirectionalEdges.filter(
          (e) => e.source === target && e.target === source
        );

        if (sameDirectionEdges.some((e) => e.id === id)) {
          return sameDirectionEdges.findIndex((e) => e.id === id);
        } else {
          return sameDirectionEdges.length + oppositeDirectionEdges.findIndex((e) => e.id === id);
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

  // Edge styling based on active state
  const isActive = data?.isActive;
  const edgeStyle = {
    ...style,
    stroke: isActive ? '#3b82f6' : (style?.stroke || '#64748b'),
    strokeWidth: isActive ? 2 : (style?.strokeWidth || 1.5),
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: isActive ? '#dbeafe' : '#fff',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
              pointerEvents: 'all',
              border: isActive ? '1px solid #3b82f6' : '1px solid #e2e8f0',
              cursor: data?.isClickable ? 'pointer' : 'default',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
