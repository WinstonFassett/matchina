interface Position {
  x: number;
  y: number;
}

interface ConnectionPoints {
  source: string;
  target: string;
}

export const optimizeEdgeConnections = (
  sourcePos: Position,
  targetPos: Position
): ConnectionPoints => {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  
  // Determine the best connection points based on relative positions
  let sourceHandle: string;
  let targetHandle: string;
  
  // If nodes are more horizontally separated
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      // Target is to the right of source
      sourceHandle = 'right';
      targetHandle = 'left';
    } else {
      // Target is to the left of source
      sourceHandle = 'left';
      targetHandle = 'right';
    }
  } else {
    // Nodes are more vertically separated
    if (dy > 0) {
      // Target is below source
      sourceHandle = 'bottom';
      targetHandle = 'top';
    } else {
      // Target is above source
      sourceHandle = 'top';
      targetHandle = 'bottom';
    }
  }
  
  return {
    source: sourceHandle,
    target: targetHandle
  };
};