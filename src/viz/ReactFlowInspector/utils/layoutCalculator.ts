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

  // For single edges, ALWAYS use different terminals for cleaner routing
  let sourceHandle: string;
  let targetHandle: string;

  // Determine primary direction
  const isHorizontalPrimary = Math.abs(dx) > Math.abs(dy);
  
  if (isHorizontalPrimary) {
    // Horizontal flow - use top/bottom terminals
    if (dy > 0) {
      // Target is below - source exits bottom, target enters top
      sourceHandle = "bottom";
      targetHandle = "top";
    } else if (dy < 0) {
      // Target is above - source exits top, target enters bottom
      sourceHandle = "top";
      targetHandle = "bottom";
    } else {
      // Perfectly horizontal - use different terminals
      sourceHandle = "top";
      targetHandle = "bottom";
    }
  } else {
    // Vertical flow - use left/right terminals
    if (dx > 0) {
      // Target is to the right - source exits right, target enters left
      sourceHandle = "right";
      targetHandle = "left";
    } else if (dx < 0) {
      // Target is to the left - source exits left, target enters right
      sourceHandle = "left";
      targetHandle = "right";
    } else {
      // Perfectly vertical - use different terminals
      sourceHandle = "left";
      targetHandle = "right";
    }
  }

  return {
    source: sourceHandle,
    target: targetHandle,
  };
};
