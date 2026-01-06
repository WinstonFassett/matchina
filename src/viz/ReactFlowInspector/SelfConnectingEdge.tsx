import React from 'react';
import { BaseEdge, BezierEdge, type EdgeProps } from '@xyflow/react';

export default function SelfConnecting(props: EdgeProps) {
  // we are using the default bezier edge when source and target ids are different
  if (props.source !== props.target) {
    return <BezierEdge {...props} />;
  }

  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, id, markerEnd } = props;
  
  // For self-loops, use a fixed radius to ensure visible arc
  const radiusX = 60; // Fixed radius for self-loops
  const radiusY = 50;
  
  // Handle different positioning schemes
  let edgePath: string;
  
  if (sourcePosition === 'bottom' && targetPosition === 'top') {
    // Vertical layout - arc around the top
    edgePath = `M ${sourceX} ${sourceY + 5} A ${radiusX} ${radiusY} 0 1 0 ${targetX} ${targetY - 2}`;
  } else if (sourcePosition === 'right' && targetPosition === 'left') {
    // Horizontal layout - arc around the left side  
    edgePath = `M ${sourceX - 5} ${sourceY} A ${radiusX} ${radiusY} 0 1 0 ${targetX + 2} ${targetY}`;
  } else {
    // Default fallback
    edgePath = `M ${sourceX - 5} ${sourceY} A ${radiusX} ${radiusY} 0 1 0 ${targetX + 2} ${targetY}`;
  }

  console.log('SelfConnectingEdge actual:', {
    source: props.source,
    target: props.target,
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    radiusX, radiusY, edgePath
  });

  return (
    <BaseEdge 
      path={edgePath} 
      markerEnd={markerEnd}
      style={{
        strokeWidth: 3,
        stroke: '#2563eb'
      }}
    />
  );
}
