import type { Node, Edge } from 'reactflow';

/**
 * Calculate the bounding box of edge labels by querying the DOM
 * This is the correct approach - get actual label bounds instead of estimating
 */
export function calculateLabelBounds(edges: Edge[], nodes: Node[]): DOMRect[] {
  const labelBounds: DOMRect[] = [];
  
  edges.forEach(edge => {
    if (!edge.label) return;
    
    // Find the label element in the DOM
    const labelElement = document.querySelector(`[data-edge-id="${edge.id}"] .react-flow__edge-text`);
    if (labelElement) {
      const rect = labelElement.getBoundingClientRect();
      labelBounds.push(rect);
    }
  });
  
  return labelBounds;
}

/**
 * Calculate expanded bounds that include both nodes and edge labels
 */
export function calculateBoundsWithLabels(
  nodes: Node[], 
  edges: Edge[], 
  padding: number = 0.1
): { x: number; y: number; width: number; height: number } | null {
  if (nodes.length === 0) return null;
  
  // Start with node bounds
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  // Include node boundaries
  nodes.forEach(node => {
    const x = node.position.x;
    const y = node.position.y;
    const width = node.width || 120;
    const height = node.height || 80;
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });
  
  // Include edge label bounds
  const labelBounds = calculateLabelBounds(edges, nodes);
  labelBounds.forEach(rect => {
    minX = Math.min(minX, rect.left);
    minY = Math.min(minY, rect.top);
    maxX = Math.max(maxX, rect.right);
    maxY = Math.max(maxY, rect.bottom);
  });
  
  // Apply padding
  const width = maxX - minX;
  const height = maxY - minY;
  const paddingX = width * padding;
  const paddingY = height * padding;
  
  return {
    x: minX - paddingX,
    y: minY - paddingY,
    width: width + (paddingX * 2),
    height: height + (paddingY * 2)
  };
}
