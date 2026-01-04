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

  // For single edges, use nearest/best terminals (not same-terminal logic)
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
      // Perfectly horizontal - use top for left->right, bottom for right->left
      if (dx > 0) {
        sourceHandle = "top";
        targetHandle = "top";
      } else {
        sourceHandle = "bottom";
        targetHandle = "bottom";
      }
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
      // Perfectly vertical - use right for top->bottom, left for bottom->top
      if (dy > 0) {
        sourceHandle = "right";
        targetHandle = "right";
      } else {
        sourceHandle = "left";
        targetHandle = "left";
      }
    }
  }

  return {
    source: sourceHandle,
    target: targetHandle,
  };
};
