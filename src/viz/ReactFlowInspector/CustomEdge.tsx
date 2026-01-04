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
  
  // Add "stem" curvature for perfectly aligned nodes to prevent straight lines
  // This ensures organic flow even when terminals are at same x/y coordinates
  const alignmentThreshold = 5; // pixels threshold for "perfect alignment"
  const stemCurvature = 15; // minimum curvature for organic appearance
  
  if (Math.abs(dx) < alignmentThreshold) {
    // Perfect vertical alignment - add horizontal stem curvature
    perpX = perpX === 0 ? (offset > 0 ? stemCurvature : -stemCurvature) : perpX;
  } else if (Math.abs(dy) < alignmentThreshold) {
    // Perfect horizontal alignment - add vertical stem curvature  
    perpY = perpY === 0 ? (offset > 0 ? stemCurvature : -stemCurvature) : perpY;
  }
  
  // Determine if this is primarily vertical or horizontal flow
  const isVerticalFlow = Math.abs(dy) > Math.abs(dx);
  
    
  if (isVerticalFlow) {
    // Vertical flow: flip for downward direction to curve outward to right
    if (dy > 0) {
      perpX = -perpX;
    }
  } else {
    // Only apply diagonal logic for BUNDLED edges (offset != 0)
    // For single edges, use standard horizontal behavior
    if (offset !== 0) {
      const isDiagonal = Math.abs(dx) > 10 && Math.abs(dy) > 10;
      
      if (isDiagonal) {
        // Diagonal flow: ensure curves bow outward along the perpendicular axis
        // For clockwise onion layering, we want edges to curve outward from the center
        const shouldFlip = (dx > 0 && dy > 0) || (dx < 0 && dy < 0);
        
        if (shouldFlip) {
          // Flip the perpendicular to point outward
          perpX = -perpX;
          perpY = -perpY;
        }
        
        // Increase curvature for diagonal flow to make it more visible
        const curvatureBoost = 1.3; // 30% more curvature for diagonal
        perpX *= curvatureBoost;
        perpY *= curvatureBoost;
      } else {
        // Pure horizontal flow: flip for bottom terminals to curve outward downward
        if (offset > 0) {
          perpY = -perpY;
        }
      }
    }
  }

  // Use simple Quadratic Bezier like ForceGraph - single control point at center
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
  
  // Initialize label positions
  let labelX: number = (sourceX + targetX) / 2;
  let labelY: number = (sourceY + targetY) / 2;

  if (edgeOffset !== 0) {
    // Use ReactFlow's BiDirectional approach: Quadratic Bezier with offset control point
    edgePath = getSpecialPath(sourceX, sourceY, targetX, targetY, edgeOffset);

    // Symmetrical label positioning based on edge offset magnitude
    const offsetMagnitude = Math.abs(edgeOffset);
    
    const centerX = (sourceX + targetX) / 2;
    const centerY = (sourceY + targetY) / 2;
    
    // Determine if this is the first or second edge (based on offset magnitude)
    const isSecondEdge = offsetMagnitude > 100; // 140px > 100, 80px < 100
    
    // Use consistent label offsets for both sides
    // First edge: 25px offset, Second edge: 55px offset
    const labelOffset = isSecondEdge ? 55 : 25;
    
    // Determine if this is primarily vertical or horizontal flow
    const isVerticalFlow = Math.abs(dy) > Math.abs(dx);
    
    if (isVerticalFlow) {
      if (dy > 0) { // Going downward - curve to right, label on right
        labelX = centerX + labelOffset;
        labelY = centerY;
      } else { // Going upward - curve to left, label on left
        labelX = centerX - labelOffset;
        // Stack labels vertically when they would be clamped to same position
        labelY = centerY + (isSecondEdge ? 20 : -20);
      }
      // Only clamp right-side labels to stay within viewport
      // Left-side labels should be positioned naturally
      if (dy > 0) {
        labelX = Math.max(50, labelX);
      }
    } else {
      // Only apply special diagonal logic for BUNDLED edges
      // For single edges, use standard ReactFlow behavior
      if (edgeOffset !== 0) {
        // Check if this is diagonal flow for bundled edges only
        const isDiagonal = Math.abs(dx) > 10 && Math.abs(dy) > 10;
        
        if (isDiagonal) {
          // Diagonal flow: position labels perpendicular to edge direction
          // Calculate perpendicular direction for label placement
          const edgeLength = Math.sqrt(dx * dx + dy * dy);
          const perpX = (-dy / edgeLength) * labelOffset;
          const perpY = (dx / edgeLength) * labelOffset;
          
          // For diagonal flow, stack labels along the perpendicular axis
          const stackOffset = isSecondEdge ? 15 : -15;
          labelX = centerX + perpX + (stackOffset * dx / edgeLength);
          labelY = centerY + perpY + (stackOffset * dy / edgeLength);
        } else {
          // Pure horizontal flow for bundled edges: labels above/below the edges
          labelX = centerX;
          if (dx > 0) { // Going rightward - top edges bow up, label above
            labelY = centerY - labelOffset;
          } else { // Going leftward - bottom edges bow down, label below
            labelY = centerY + labelOffset;
          }
        }
      } else {
        // Single edges: use standard ReactFlow label positioning
        labelX = centerX;
        labelY = centerY;
      }
    }
  } else {
    // Standard bezier path for non-offset edges with stem curvature
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    
    // Add stem curvature for perfectly aligned nodes
    const alignmentThreshold = 5;
    const stemCurvature = 0.15; // curvature multiplier for organic appearance
    
    let curvature = 0.25;
    if (Math.abs(dx) < alignmentThreshold || Math.abs(dy) < alignmentThreshold) {
      curvature = Math.max(curvature, stemCurvature);
    }
    
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature,
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
