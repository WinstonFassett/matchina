import React, { useEffect } from 'react';
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

// Add CSS animation for dashed edges (client-side only)
const addDashAnimation = () => {
  if (typeof document === 'undefined') return;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes dash {
      to {
        stroke-dashoffset: -10;
      }
    }
  `;
  if (!document.head.querySelector('style[data-floating-edge-animation]')) {
    style.setAttribute('data-floating-edge-animation', 'true');
    document.head.appendChild(style);
  }
};

interface FloatingEdgeData extends Record<string, unknown> {
  event?: string;
  isClickable?: boolean;
  isActive?: boolean;
  isTransitionFromPrevious?: boolean;
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
}: EdgeProps<any>) {
  // Detect theme for styling
  const isDarkTheme = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  
  // Add CSS animation for dashed edges (client-side only)
  useEffect(() => {
    addDashAnimation();
  }, []);
  const sourceNode = useInternalNode(source as string);
  const targetNode = useInternalNode(target as string);

  if (!sourceNode || !targetNode) {
    console.warn('🚨 FloatingEdge: Missing nodes', { id, source, target, sourceNode: !!sourceNode, targetNode: !!targetNode });
    return null;
  }

  // Debug logging for node positions
  const sourcePositionAbsolute = sourceNode.internals.positionAbsolute;
  const targetPositionAbsolute = targetNode.internals.positionAbsolute;
  
  if (Number.isNaN(sourcePositionAbsolute.x) || Number.isNaN(sourcePositionAbsolute.y) || Number.isNaN(targetPositionAbsolute.x) || Number.isNaN(targetPositionAbsolute.y)) {
    console.error('🚨 FloatingEdge NaN coordinates:', {
      id,
      source,
      target,
      sourcePositionAbsolute,
      targetPositionAbsolute,
      sourceNodeMeasured: sourceNode.measured,
      targetNodeMeasured: targetNode.measured
    });
  }

  // Get base edge parameters - with fallback for self-loops
  let sx: number, sy: number, tx: number, ty: number, sourcePos: any, targetPos: any;

  if (source === target) {
    // Self-loop fallback: use node center coordinates
    const measured = sourceNode.measured || { width: 100, height: 40 };
    const posX = sourceNode.internals.positionAbsolute.x;
    const posY = sourceNode.internals.positionAbsolute.y;
    // Guard against NaN positions
    sx = (Number.isNaN(posX) ? 0 : posX) + ((measured.width || 100) / 2);
    sy = (Number.isNaN(posY) ? 0 : posY) + ((measured.height || 40) / 2);
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
    const nodeWidth = measured.width!;
    const nodeHeight = measured.height!;
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

      // Guard against division by zero when nodes are at same position
      // This can happen during initial layout before ELK positions nodes
      if (distance === 0) {
        edgePath = path;
        labelX = sx;
        labelY = sy;
      } else {
      // Calculate perpendicular direction (normalized)
      const perpX = -dy / distance;
      const perpY = dx / distance;

      // SMOOTH INTERPOLATION for bi-directional spacing (no snapping!)
      // Interpolate between horizontal and vertical spacing based on angle
      const angle = Math.atan2(dy, dx);
      const normalizedAngle = Math.abs(angle); // 0 to π
      
      // Calculate interpolation factor (0 = horizontal, π/2 = vertical, π = horizontal)
      let verticalFactor: number;
      if (normalizedAngle <= Math.PI / 2) {
        // 0 to π/2: horizontal to vertical
        verticalFactor = normalizedAngle / (Math.PI / 2);
      } else {
        // π/2 to π: vertical to horizontal
        verticalFactor = (Math.PI - normalizedAngle) / (Math.PI / 2);
      }
      
      // Smooth interpolation between horizontal (40px) and vertical (120px) spacing
      const horizontalSpacing = 40;
      const verticalSpacing = 120;
      const spacing = horizontalSpacing + (verticalSpacing - horizontalSpacing) * verticalFactor;
      
      const maxOffset = ((totalBidirectional - 1) * spacing) / 2;

      // Calculate global edge index (considering both directions)
      const globalEdgeIndex = useStore((s: ReactFlowState) => {
        const allBidirectionalEdges = s.edges.filter(
          (e) =>
            (e.source === source && e.target === target) ||
            (e.source === target && e.target === source)
        );
        
        // Find position of this edge among all bidirectional edges
        // Edges going same direction come first, then opposite direction (mirroring)
        const sameDirectionEdges = allBidirectionalEdges.filter(
          (e) => e.source === source && e.target === target,
        );
        const oppositeDirectionEdges = allBidirectionalEdges.filter(
          (e) => e.source === target && e.target === source,
        );
        
        // This edge's global index
        if (sameDirectionEdges.some((e) => e.id === id)) {
          return sameDirectionEdges.findIndex((e) => e.id === id);
        } else {
          return sameDirectionEdges.length + oppositeDirectionEdges.findIndex((e) => e.id === id);
        }
      });

      // Calculate offset for this specific edge (centered spread)
      const edgeOffset = globalEdgeIndex * spacing - maxOffset;

      // Apply perpendicular offset - this creates the mirroring effect
      const offsetX = perpX * edgeOffset;
      const offsetY = perpY * edgeOffset;

      // Create curved path with offset - each edge curves away from center
      const midX = (sx + tx) / 2 + offsetX;
      const midY = (sy + ty) / 2 + offsetY;

      edgePath = `M ${sx} ${sy} Q ${midX} ${midY} ${tx} ${ty}`;
      // Position label ON the actual curve at t=0.5 (midpoint of the curve)
      // For quadratic Bezier: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
      const t = 0.5;
      labelX = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * midX + t * t * tx;
      labelY = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * midY + t * t * ty;
      }
    } else {
      edgePath = path;
      labelX = (sx + tx) / 2;
      labelY = (sy + ty) / 2;
    }
  }

  // Edge styling based on V1 highlighting logic
  const isActive = data?.isActive;
  const isTransitionFromPrevious = data?.isTransitionFromPrevious;
  
  const edgeStyle: React.CSSProperties = {
    ...(style as React.CSSProperties || {}),
    // Use the style passed from ReactFlowInspector (already has V1 colors)
    stroke: (style as React.CSSProperties)?.stroke || '#64748b',
    strokeWidth: (style as React.CSSProperties)?.strokeWidth || 1.5,
    strokeDasharray: (style as React.CSSProperties)?.strokeDasharray,
    opacity: (style as React.CSSProperties)?.opacity,
    cursor: (style as React.CSSProperties)?.cursor,
    // Add animation for previous→current transitions
    ...(isTransitionFromPrevious && {
      animation: 'dash 1s linear infinite',
    }),
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
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
              pointerEvents: 'all',
              cursor: data?.isClickable ? 'pointer' : 'default',
              // Theme-aware label styling
              background: isActive ? 'rgb(30 58 138)' : (isDarkTheme ? 'rgb(31 41 55)' : 'rgb(255 255 255)'),
              border: isActive ? '2px solid rgb(59 130 246)' : `1px solid ${isDarkTheme ? 'rgb(75 85 99)' : 'rgb(229 231 235)'}`,
              color: isActive ? 'rgb(147 197 253)' : (isDarkTheme ? 'rgb(229 231 235)' : 'rgb(31 41 55)'),
              // Ensure labels are above edge lines
              zIndex: isActive ? 1000 : 100,
              // Make clickable labels more prominent
              boxShadow: data?.isClickable ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
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
