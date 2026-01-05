import React from 'react';
import { BaseEdge, BezierEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';

export default function SelfConnecting(props: EdgeProps) {
  // we are using the default bezier edge when source and target ids are different
  if (props.source !== props.target) {
    return <BezierEdge {...props} />;
  }

  const { sourceX, sourceY, targetX, targetY, markerEnd, label } = props;
  
  // For self-loops, create a loop above the node
  // Use fixed dimensions for consistent loop appearance
  const loopWidth = 50;
  const loopHeight = 40;
  
  // Calculate the loop path - arc from right handle back to left handle, curving above
  // Start from right side, curve up and around, end at left side
  const edgePath = `M ${sourceX} ${sourceY} 
    C ${sourceX + loopWidth} ${sourceY - loopHeight}, 
      ${targetX - loopWidth} ${targetY - loopHeight}, 
      ${targetX} ${targetY}`;

  const labelX = sourceX;
  const labelY = sourceY - loopHeight - 15;

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
