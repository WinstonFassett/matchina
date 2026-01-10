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
  const isClickable = data?.isClickable;
  const isActive = data?.isActive; // Possible exits from current state
  const isExactTransition = data?.isExactTransition; // The exact transition taken
  const isPossibleExit = isActive; // Possible exits from current state
  const isActuallyActive = isExactTransition; // Only the exact transition is active
  
  const edgeStyle: React.CSSProperties = {
    ...(style as React.CSSProperties || {}),
    // Use the style passed from ReactFlowInspector (already has V1 colors)
    stroke: (style as React.CSSProperties)?.stroke || '#64748b',
    strokeWidth: (style as React.CSSProperties)?.strokeWidth || 1.5,
    strokeDasharray: (style as React.CSSProperties)?.strokeDasharray,
    opacity: (style as React.CSSProperties)?.opacity,
    cursor: (style as React.CSSProperties)?.cursor,
    // Add animation for exact transitions (from ReactFlowInspectorV2)
    ...(data?.isExactTransition && {
      animation: 'dash 1s linear infinite',
    }),
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      {label && (
        <EdgeLabelRenderer>
          <button
            type="button"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 600,
              pointerEvents: 'all',
              cursor: isClickable ? 'pointer' : 'default',
              // Active edges: filled button style matching nodes (only the exact transition)
              ...(isActuallyActive ? {
                background: '#2563eb', // Same blue as active nodes
                color: '#fff', // White text like active nodes
                border: 'none', // No border like nodes
                transition: 'all 150ms ease',
                // Hover state: darker blue
                ':hover': {
                  background: '#1d4ed8', // Darker blue on hover
                },
                // Active state: even darker blue
                ':active': {
                  background: '#1e40af', // Even darker blue
                },
              } : isPossibleExit ? {
                // Possible exits: subtle exit styling (not active)
                background: isDarkTheme 
                  ? 'rgba(59, 130, 246, 0.1)'  // Very subtle blue background
                  : 'rgba(59, 130, 246, 0.08)', // Very subtle blue background
                color: 'rgb(59, 130, 246)', // Blue text to indicate it's an exit
                border: '1px solid rgba(59, 130, 246, 0.3)', // Subtle blue border
              } : {
                // Inactive edges: theme background color, no border
                background: isDarkTheme 
                  ? 'rgb(31, 41, 55)'  // Dark theme background
                  : 'rgb(255, 255, 255)', // Light theme background
                color: isDarkTheme ? 'rgb(209, 213, 219)' : 'rgb(31, 41 55)', // Theme text color
                border: 'none', // No border to differentiate from nodes
              }),
              // Ensure labels are above edge lines
              zIndex: isActuallyActive ? 1000 : (isPossibleExit ? 900 : 100),
              // No shadows for clean flat design
              boxShadow: 'none',
              // Prevent layout shifts
              transformOrigin: 'center',
            }}
            className="nodrag nopan"
            disabled={!isClickable}
            onMouseEnter={(e) => {
              if (isActuallyActive) {
                e.currentTarget.style.background = '#1d4ed8'; // Darker blue on hover
              } else if (isPossibleExit) {
                e.currentTarget.style.background = isDarkTheme 
                  ? 'rgba(59, 130, 246, 0.2)'  // Slightly more blue on hover
                  : 'rgba(59, 130, 246, 0.15)'; // Slightly more blue on hover
              }
            }}
            onMouseLeave={(e) => {
              if (isActuallyActive) {
                e.currentTarget.style.background = '#2563eb'; // Back to normal blue
              } else if (isPossibleExit) {
                e.currentTarget.style.background = isDarkTheme 
                  ? 'rgba(59, 130, 246, 0.1)'  // Back to subtle blue
                  : 'rgba(59, 130, 246, 0.08)'; // Back to subtle blue
              }
            }}
            onMouseDown={(e) => {
              if (isActuallyActive) {
                e.currentTarget.style.background = '#1e40af'; // Even darker blue on active
              }
            }}
            onMouseUp={(e) => {
              if (isActuallyActive) {
                e.currentTarget.style.background = '#2563eb'; // Back to normal blue
              }
            }}
          >
            {label}
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
