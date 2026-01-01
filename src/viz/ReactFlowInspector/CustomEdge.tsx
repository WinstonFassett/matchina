import React from "react";
import type { EdgeProps as ReactFlowEdgeProps } from "reactflow";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "reactflow";

interface CustomEdgeData {
  event: string;
  isClickable: boolean;
  isEnabled?: boolean;
  isSelfTransition?: boolean;
  selfLoopOffset?: number;
  selfLoopIndex?: number;
}

interface CustomEdgeProps extends ReactFlowEdgeProps {
  data: CustomEdgeData;
}

// Helper function to get edge label styling based on state and theme
const getEdgeLabelStyle = (data: CustomEdgeData, labelStyle?: any, labelBgStyle?: any) => {
  const isDarkMode = typeof window !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  
  // Base styles
  const baseStyle: {
    backgroundColor: string;
    color: string;
    padding: string;
    borderRadius: string;
    fontWeight: any;
    fontSize: string;
    boxShadow: string;
    border: string;
    opacity?: string;
  } = {
    backgroundColor: labelBgStyle?.fill || (isDarkMode ? "#374151" : "#ffffff"),
    color: labelStyle?.fill || (isDarkMode ? "#d1d5db" : "#374151"),
    padding: "2px 4px",
    borderRadius: "4px",
    fontWeight: labelStyle?.fontWeight || "normal",
    fontSize: labelStyle?.fontSize || "10px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    border: isDarkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.05)",
  };

  // Override for clickable edges
  if (data?.isClickable) {
    baseStyle.backgroundColor = isDarkMode ? "#4b5563" : "#f3f4f6";
    baseStyle.color = isDarkMode ? "#e5e7eb" : "#111827";
    baseStyle.fontWeight = "500";
  }

  // Override for disabled/inactive edges
  if (!data?.isEnabled) {
    baseStyle.backgroundColor = isDarkMode ? "#1f2937" : "#f9fafb";
    baseStyle.color = isDarkMode ? "#6b7280" : "#9ca3af";
    baseStyle.opacity = "0.7";
  }

  return baseStyle;
};

const CustomEdge: React.FC<CustomEdgeProps> = ({
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
  // Handle self-transitions with a special loop path
  if (data?.isSelfTransition) {
    // Get the index of this self-transition to distribute around the node
    const loopIndex = data.selfLoopIndex || 0;

    // Use larger offset for better visibility
    const offset = 60;

    // Node dimensions - use actual node size
    const nodeWidth = 150;
    const nodeHeight = 50;
    const halfWidth = nodeWidth / 2;
    const halfHeight = nodeHeight / 2;

    // Calculate actual connection points at the node edges
    // This ensures self-transitions connect properly to node boundaries
    const positions = [
      // Top
      {
        x: sourceX,
        y: sourceY - halfHeight,
        offsetX: 0,
        offsetY: -offset,
        labelOffsetX: 0,
        labelOffsetY: -offset - 15,
      },
      // Right
      {
        x: sourceX + halfWidth,
        y: sourceY,
        offsetX: offset,
        offsetY: 0,
        labelOffsetX: offset + 15,
        labelOffsetY: 0,
      },
      // Bottom
      {
        x: sourceX,
        y: sourceY + halfHeight,
        offsetX: 0,
        offsetY: offset,
        labelOffsetX: 0,
        labelOffsetY: offset + 15,
      },
      // Left
      {
        x: sourceX - halfWidth,
        y: sourceY,
        offsetX: -offset,
        offsetY: 0,
        labelOffsetX: -offset - 15,
        labelOffsetY: 0,
      },
    ];

    // Get position based on index
    const pos = positions[loopIndex % positions.length];

    // Calculate control points for a circular loop
    // Start from the exact edge of the node
    const startX = pos.x;
    const startY = pos.y;

    // Control points for a circular curve
    const cp1x = startX + pos.offsetX - pos.offsetY * 0.5;
    const cp1y = startY + pos.offsetY + pos.offsetX * 0.5;

    const cp2x = startX + pos.offsetX + pos.offsetY * 0.5;
    const cp2y = startY + pos.offsetY - pos.offsetX * 0.5;

    // Create a circular path that returns to the same point
    const selfLoopPath = `
      M ${startX} ${startY}
      C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${startX} ${startY}
    `;

    // Position label outside the loop
    const labelX = sourceX + pos.labelOffsetX;
    const labelY = sourceY + pos.labelOffsetY;

    return (
      <>
        <path
          d={selfLoopPath}
          style={style}
          markerEnd={markerEnd}
          fill="none"
        />
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
  }

  // For regular edges between different nodes - always use bezier curves
  // Vary the curvature slightly based on the edge ID to distinguish multiple edges
  const curvature =
    id.includes("-") && id.split("-")[2]?.charCodeAt(0) % 2 === 0 ? 0.3 : 0.2;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature,
  });

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

export default React.memo(CustomEdge);
