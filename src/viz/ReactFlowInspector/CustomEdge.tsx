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
  edgeOffset?: number; // Perpendicular offset for parallel edge separation
}

interface CustomEdgeProps extends ReactFlowEdgeProps {
  data: CustomEdgeData;
}

// Generate ForceGraph-style symmetric curves for elegant parallel edges
// Uses simple symmetric control points like ForceGraph's linkCurvature
function getSpecialPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  offset: number
): string {
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;

  // Calculate perpendicular direction to offset the control point
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  }

  // Perpendicular offset: rotate 90 degrees
  // For clockwise onion layer, we need to flip the sign for certain directions
  let perpX = (-dy / length) * offset;
  let perpY = (dx / length) * offset;
  
  // Fix for downward flow: flip the sign to curve outward to right
  if (dy > 0) { // Going downward
    perpX = -perpX; // Flip to curve outward to right
  }

  // Use simple Quadratic Bezier like ForceGraph - single control point at center
  // ForceGraph's elegance comes from simplicity, not complex control points
  return `M ${sourceX} ${sourceY} Q ${centerX + perpX} ${centerY + perpY} ${targetX} ${targetY}`;
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

    // Use larger offset for better visibility and avoid node overlap
    const offset = 80; // Increased from 60 to avoid overlap

    // Node dimensions - use actual node size
    const nodeWidth = 150;
    const nodeHeight = 50;
    const halfWidth = nodeWidth / 2;
    const halfHeight = nodeHeight / 2;

    // Calculate actual connection points at the node edges with padding
    // This ensures self-transitions connect properly to node boundaries without overlap
    const positions = [
      // Top - position above the node
      {
        x: sourceX,
        y: sourceY - halfHeight - 5, // Add 5px padding to avoid touching node
        offsetX: 0,
        offsetY: -offset,
        labelOffsetX: 0,
        labelOffsetY: -offset - 20, // More space for label
      },
      // Right - position to the right of the node
      {
        x: sourceX + halfWidth + 5, // Add 5px padding
        y: sourceY,
        offsetX: offset,
        offsetY: 0,
        labelOffsetX: offset + 20,
        labelOffsetY: 0,
      },
      // Bottom - position below the node
      {
        x: sourceX,
        y: sourceY + halfHeight + 5, // Add 5px padding
        offsetX: 0,
        offsetY: offset,
        labelOffsetX: 0,
        labelOffsetY: offset + 20,
      },
      // Left - position to the left of the node
      {
        x: sourceX - halfWidth - 5, // Add 5px padding
        y: sourceY,
        offsetX: -offset,
        offsetY: 0,
        labelOffsetX: -offset - 20,
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

  // For regular edges between different nodes
  const edgeOffset = data?.edgeOffset ?? 0;

  let edgePath: string;

  // Label at center, offset perpendicular to edge direction
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Initialize label positions
  let labelX: number = (sourceX + targetX) / 2;
  let labelY: number = (sourceY + targetY) / 2;

  if (edgeOffset !== 0) {
    // Use ReactFlow's BiDirectional approach: Quadratic Bezier with offset control point
    edgePath = getSpecialPath(sourceX, sourceY, targetX, targetY, edgeOffset);

    // Working label positioning - use edge offset magnitude for proper separation
    if (dy > 0) { // Going downward - curve to right
      const offsetMagnitude = Math.abs(edgeOffset);
      labelX = (sourceX + targetX) / 2 + (offsetMagnitude === 80 ? 15 : 55); // 15px for first, 55px for second
      labelY = (sourceY + targetY) / 2;
    } else if (dy < 0) { // Going upward - curve to left  
      const offsetMagnitude = Math.abs(edgeOffset);
      labelX = (sourceX + targetX) / 2 - (offsetMagnitude === 200 ? 5 : 45); // 5px for first, 45px for second (keep in viewport)
      labelY = (sourceY + targetY) / 2;
    } else { // Horizontal layout
      labelX = (sourceX + targetX) / 2;
      labelY = (sourceY + targetY) / 2;
    }
    
    // LOG EDGE LABEL POSITIONS FOR DEBUGGING
    console.log(`🏷️ Edge Label Position: ${data?.event || 'unknown'}`);
    console.log(`  Source: (${sourceX.toFixed(1)}, ${sourceY.toFixed(1)}) → Target: (${targetX.toFixed(1)}, ${targetY.toFixed(1)})`);
    console.log(`  Direction: dy=${dy.toFixed(1)} (dy > 0 = downward, dy < 0 = upward)`);
    console.log(`  Edge Offset: ${edgeOffset}px`);
    console.log(`  Final Label Position: (${labelX.toFixed(1)}, ${labelY.toFixed(1)})`);
    
    // LOG NODE POSITIONS FOR LAYOUT DEBUGGING
    console.log(`📍 Node Positions for Layout Analysis:`);
    console.log(`  Source Node: (${sourceX.toFixed(1)}, ${sourceY.toFixed(1)})`);
    console.log(`  Target Node: (${targetX.toFixed(1)}, ${targetY.toFixed(1)})`);
    console.log(`  Node Distance: ${length.toFixed(1)}px`);
    console.log(`  Label Distance from Source: ${Math.sqrt(Math.pow(labelX - sourceX, 2) + Math.pow(labelY - sourceY, 2)).toFixed(1)}px`);
    console.log(`  Label Distance from Target: ${Math.sqrt(Math.pow(targetX - labelX, 2) + Math.pow(targetY - labelY, 2)).toFixed(1)}px`);
    console.log(`  ---`);
  } else {
    // Standard bezier path for non-offset edges
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.25,
    });
  }

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
