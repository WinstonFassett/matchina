import { Position } from '@xyflow/react';
import type { InternalNode } from '@xyflow/react';

/**
 * Helper function to calculate intersection point between node center and target node
 * Used for floating edges that connect at the optimal point on node boundaries
 */
function getNodeIntersection(intersectionNode: InternalNode, targetNode: InternalNode) {
  const { width: intersectionNodeWidth, height: intersectionNodeHeight } = intersectionNode.measured || { width: 100, height: 40 };
  const intersectionNodePosition = intersectionNode.internals.positionAbsolute;
  const targetPosition = targetNode.internals.positionAbsolute;
  const targetMeasured = targetNode.measured || { width: 100, height: 40 };

  const w = intersectionNodeWidth / 2;
  const h = intersectionNodeHeight / 2;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + targetMeasured.width / 2;
  const y1 = targetPosition.y + targetMeasured.height / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

/**
 * Returns the position (top, right, bottom or left) of the edge based on intersection point
 */
function getEdgePosition(node: InternalNode, intersectionPoint: { x: number; y: number }) {
  const n = { ...node.internals.positionAbsolute, ...node };
  const measured = node.measured || { width: 100, height: 40 };
  const nx = Math.round(n.x);
  const ny = Math.round(n.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + measured.width - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= n.y + measured.height - 1) {
    return Position.Bottom;
  }

  return Position.Top;
}

/**
 * Returns the parameters needed to create a floating edge between two nodes
 */
export function getEdgeParams(source: InternalNode, target: InternalNode) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}
