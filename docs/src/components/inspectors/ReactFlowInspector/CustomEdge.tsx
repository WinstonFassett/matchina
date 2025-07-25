import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath } from 'reactflow';
import type { EdgeProps as ReactFlowEdgeProps } from 'reactflow';

interface CustomEdgeData {
  event: string;
  isClickable: boolean;
  isSelfTransition?: boolean;
  selfLoopOffset?: number;
  selfLoopIndex?: number;
}

interface CustomEdgeProps extends ReactFlowEdgeProps {
  data: CustomEdgeData;
}

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
    const offset = data.selfLoopOffset || 30;
    
    // Define directions for self-loops: top, right, bottom, left
    const directions = [
      { x: 0, y: -1, label: { x: 0, y: -1.5 } },     // top
      { x: 1, y: 0, label: { x: 1.5, y: 0 } },       // right
      { x: 0, y: 1, label: { x: 0, y: 1.5 } },       // bottom
      { x: -1, y: 0, label: { x: -1.5, y: 0 } },     // left
    ];
    
    // Pick a direction based on the index
    const direction = directions[loopIndex % directions.length];
    
    // Calculate control points for the loop - make them more circular
    const radius = offset * 0.8; // Smaller radius to keep loops closer to node edges
    const nodeSize = 75; // More accurate node size
    
    // Start point at the edge of the node in the given direction
    // Use exact node edge positions rather than center offset
    const startX = sourceX + direction.x * (nodeSize / 2);
    const startY = sourceY + direction.y * (nodeSize / 2);
    
    // Control points for a circular curve
    // Use cubic bezier curves to create a more circular loop
    const cp1x = startX + direction.x * radius + direction.y * radius;
    const cp1y = startY + direction.y * radius - direction.x * radius;
    
    const cp2x = startX + direction.x * radius - direction.y * radius;
    const cp2y = startY + direction.y * radius + direction.x * radius;
    
    // SVG path for a self-loop in the given direction
    const selfLoopPath = `
      M ${startX} ${startY}
      C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${startX} ${startY}
    `;
    
    // Calculate label position for self-loop
    const labelX = sourceX + direction.label.x * radius * 2;
    const labelY = sourceY + direction.label.y * radius * 2;
    
    return (
      <>
        <path d={selfLoopPath} style={style} markerEnd={markerEnd} fill="none" />
        {label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: 'all',
                backgroundColor: labelBgStyle?.fill || '#ffffff',
                color: labelStyle?.fill || 'inherit',
                padding: `${labelBgPadding?.[1] || 2}px ${labelBgPadding?.[0] || 4}px`,
                borderRadius: labelBgBorderRadius || 4,
                fontWeight: labelStyle?.fontWeight || 'normal',
                fontSize: labelStyle?.fontSize || '10px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.05)',
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
  const curvature = id.includes('-') && id.split('-')[2]?.charCodeAt(0) % 2 === 0 ? 0.3 : 0.2;
  
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
      <BaseEdge path={edgePath || ''} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              backgroundColor: labelBgStyle?.fill || '#ffffff',
              color: labelStyle?.fill || 'inherit',
              padding: `${labelBgPadding?.[1] || 2}px ${labelBgPadding?.[0] || 4}px`,
              borderRadius: labelBgBorderRadius || 4,
              fontWeight: labelStyle?.fontWeight || 'normal',
              fontSize: labelStyle?.fontSize || '10px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)',
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