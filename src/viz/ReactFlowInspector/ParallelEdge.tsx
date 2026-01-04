import React from "react";
import type { EdgeProps as ReactFlowEdgeProps } from "reactflow";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "reactflow";

// Interface for parallel edge data
interface ParallelEdgeData {
  event: string;
  isClickable: boolean;
  isEnabled?: boolean;
  isSelfTransition?: boolean;
  curvature?: number; // New: ForceGraph-style curvature
  edgeIndex?: number; // New: Index in parallel edge group
  totalEdges?: number; // New: Total edges in this group
}

interface ParallelEdgeProps extends ReactFlowEdgeProps {
  data: ParallelEdgeData;
}

/**
 * ParallelEdge - Clean slate implementation
 * 
 * Goals:
 * - Use ForceGraph curvature algorithm for parallel edge separation
 * - Preserve all current interactive behaviors (highlighting, themes, etc.)
 * - Implement modern ReactFlow patterns (BaseEdge, etc.)
 * - Handle self-transitions and advanced cases
 */
const ParallelEdge: React.FC<ParallelEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
}) => {
  // Generate curvature-based path for parallel edges
  const generateCurvedPath = (sourceX: number, sourceY: number, targetX: number, targetY: number, curvature: number): string => {
    const centerX = (sourceX + targetX) / 2;
    const centerY = (sourceY + targetY) / 2;
    
    // Calculate perpendicular offset based on curvature
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    
    // Perpendicular offset for curvature
    const perpX = (-dy / length) * curvature * 50; // Scale curvature to pixels
    const perpY = (dx / length) * curvature * 50;
    
    // Use quadratic bezier with curved control point
    return `M ${sourceX} ${sourceY} Q ${centerX + perpX} ${centerY + perpY} ${targetX} ${targetY}`;
  };

  // Generate curvature-based path and calculate label position
  let edgePath: string;
  let labelX: number;
  let labelY: number;
  
  if (data?.curvature !== undefined) {
    edgePath = generateCurvedPath(sourceX, sourceY, targetX, targetY, data.curvature);
    labelX = (sourceX + targetX) / 2; // Center for curved paths
    labelY = (sourceY + targetY) / 2;
  } else {
    [edgePath, labelX, labelY] = getBezierPath({ 
      sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, curvature: 0.25 
    });
  }

  // Placeholder: Preserve current label styling approach
  const getEdgeLabelStyle = (data: ParallelEdgeData, labelStyle?: any, labelBgStyle?: any) => {
    // TODO: Port the full styling system from CustomEdge.old.tsx
    return {
      backgroundColor: "#ffffff",
      color: "#374151",
      padding: "2px 4px",
      borderRadius: "4px",
      fontSize: "10px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      border: "1px solid rgba(0,0,0,0.05)",
    };
  };

  return (
    <>
      <BaseEdge path={edgePath || ""} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              ...getEdgeLabelStyle(data, labelStyle, labelBgStyle),
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default React.memo(ParallelEdge);
