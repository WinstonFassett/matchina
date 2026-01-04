export interface Position {
  x: number;
  y: number;
}

export interface ConnectionPoints {
  source: string;
  target: string;
}

export interface EdgeInfo {
  from: string;
  to: string;
  fromPos: Position;
  toPos: Position;
}

export interface DistributedEdge extends EdgeInfo {
  sourceHandle: string;
  targetHandle: string;
}

/**
 * Calculate the angle between two points in degrees
 */
export const calculateAngle = (source: Position, target: Position): number => {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  return Math.atan2(dy, dx) * (180 / Math.PI);
};

/**
 * Determine if a curve would be clockwise or counter-clockwise
 */
export const getCurveDirection = (
  source: Position, 
  target: Position, 
  sourceTerminal: string, 
  targetTerminal: string
): 'clockwise' | 'counter-clockwise' | 'straight' => {
  // Simplified: determine if the curve bends clockwise or counter-clockwise
  // This is a heuristic - in reality, the curve direction depends on the specific
  // Bezier curve parameters, but we can estimate based on terminal positions
  
  const angle = calculateAngle(source, target);
  
  // Normalize angle to 0-360
  const normalizedAngle = (angle + 360) % 360;
  
  // Determine approximate curve direction based on angle and terminals
  if (sourceTerminal === 'right' && targetTerminal === 'top') {
    return normalizedAngle < 180 ? 'clockwise' : 'counter-clockwise';
  }
  if (sourceTerminal === 'left' && targetTerminal === 'top') {
    return normalizedAngle > 180 ? 'clockwise' : 'counter-clockwise';
  }
  if (sourceTerminal === 'bottom' && targetTerminal === 'right') {
    return normalizedAngle > 90 && normalizedAngle < 270 ? 'clockwise' : 'counter-clockwise';
  }
  if (sourceTerminal === 'bottom' && targetTerminal === 'left') {
    return normalizedAngle < 90 || normalizedAngle > 270 ? 'clockwise' : 'counter-clockwise';
  }
  
  return 'straight';
};

/**
 * Enhanced terminal selection that considers curve directionality
 */
export const optimizeEdgeConnectionsWithDirectionality = (
  sourcePos: Position,
  targetPos: Position
): ConnectionPoints => {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const angle = calculateAngle(sourcePos, targetPos);
  const normalizedAngle = (angle + 360) % 360;

  // Apply curve directionality heuristics for diagonal relationships
  if (Math.abs(dx) > 20 && Math.abs(dy) > 20) {
    // This is a diagonal relationship - apply directionality logic
    
    // Upper-left to lower-right quadrant (315-45 degrees, crossing 0)
    if ((normalizedAngle >= 315 && normalizedAngle <= 360) || (normalizedAngle >= 0 && normalizedAngle < 45)) {
      // Prefer clockwise arc: right -> top
      return { source: "right", target: "top" };
    }
    // Upper-right to lower-right quadrant (45-135 degrees)
    else if (normalizedAngle >= 45 && normalizedAngle < 135) {
      // Prefer clockwise arc: bottom -> right
      return { source: "bottom", target: "right" };
    }
    // Lower-right to lower-left quadrant (135-225 degrees)
    else if (normalizedAngle >= 135 && normalizedAngle < 225) {
      // Prefer clockwise arc: left -> bottom
      return { source: "left", target: "bottom" };
    }
    // Lower-left to upper-left quadrant (225-315 degrees)
    else {
      // Prefer clockwise arc: top -> left
      return { source: "top", target: "left" };
    }
  }

  // Non-diagonal edges - use basic logic
  const isHorizontalPrimary = Math.abs(dx) > Math.abs(dy);
  
  if (isHorizontalPrimary) {
    // Horizontal flow - use top/bottom terminals
    if (dy > 0) {
      return { source: "bottom", target: "top" };
    } else if (dy < 0) {
      return { source: "top", target: "bottom" };
    } else {
      // Perfectly horizontal - use different terminals
      return { source: "top", target: "bottom" };
    }
  } else {
    // Vertical flow - prefer straight vertical connection (bottom/top)
    if (dy > 0) {
      // Target is below source - go straight down
      return { source: "bottom", target: "top" };
    } else if (dy < 0) {
      // Target is above source - go straight up
      return { source: "top", target: "bottom" };
    } else {
      // Perfectly horizontal edge that somehow got here - use side terminals
      if (dx > 0) {
        return { source: "right", target: "left" };
      } else {
        return { source: "left", target: "right" };
      }
    }
  }
};

/**
 * Distribute terminals for multiple edges leaving the same source node.
 * This prevents zig-zag patterns when a node has multiple outgoing edges.
 */
export const distributeOutgoingEdges = (
  edges: EdgeInfo[],
): DistributedEdge[] => {
  // Group edges by source node
  const edgesBySource = new Map<string, EdgeInfo[]>();
  for (const edge of edges) {
    const existing = edgesBySource.get(edge.from) || [];
    existing.push(edge);
    edgesBySource.set(edge.from, existing);
  }

  const result: DistributedEdge[] = [];

  for (const [, outgoingEdges] of edgesBySource) {
    if (outgoingEdges.length === 1) {
      // Single outgoing edge - use standard algorithm
      const edge = outgoingEdges[0];
      const connectionPoints = optimizeEdgeConnectionsWithDirectionality(edge.fromPos, edge.toPos);
      result.push({
        ...edge,
        sourceHandle: connectionPoints.source,
        targetHandle: connectionPoints.target,
      });
    } else {
      // Multiple outgoing edges - distribute by angle to targets
      const sourcePos = outgoingEdges[0].fromPos;
      
      // Sort edges by angle to target (clockwise from top)
      const sortedEdges = [...outgoingEdges].sort((a, b) => {
        const angleA = calculateAngle(sourcePos, a.toPos);
        const angleB = calculateAngle(sourcePos, b.toPos);
        return angleA - angleB;
      });

      // Assign terminals based on target position relative to source
      for (const edge of sortedEdges) {
        const dx = edge.toPos.x - edge.fromPos.x;
        const dy = edge.toPos.y - edge.fromPos.y;
        const angle = calculateAngle(edge.fromPos, edge.toPos);
        const normalizedAngle = (angle + 360) % 360;

        // Determine best source terminal based on target direction
        let sourceHandle: string;
        let targetHandle: string;

        // Use quadrant-based assignment for source terminal
        // This spreads edges around the source node
        if (normalizedAngle >= 315 || normalizedAngle < 45) {
          // Target is to the right
          sourceHandle = "right";
          targetHandle = dy > 20 ? "top" : dy < -20 ? "bottom" : "left";
        } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
          // Target is below
          sourceHandle = "bottom";
          targetHandle = dx > 20 ? "left" : dx < -20 ? "right" : "top";
        } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
          // Target is to the left
          sourceHandle = "left";
          targetHandle = dy > 20 ? "top" : dy < -20 ? "bottom" : "right";
        } else {
          // Target is above
          sourceHandle = "top";
          targetHandle = dx > 20 ? "left" : dx < -20 ? "right" : "bottom";
        }

        result.push({
          ...edge,
          sourceHandle,
          targetHandle,
        });
      }
    }
  }

  return result;
};
