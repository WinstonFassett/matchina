import type { ReactFlowInstance, Node, Edge } from 'reactflow';
import { calculateBoundsWithLabels } from './edgeBoundsCalculator';

/**
 * Simple enhanced fitView that includes edge labels
 * Uses actual DOM measurements instead of estimation
 */
export async function simpleEnhancedFitView(
  reactFlowInstance: ReactFlowInstance,
  options: {
    padding?: number;
    duration?: number;
    includeLabels?: boolean;
  } = {}
): Promise<void> {
  const {
    padding = 0.1,
    duration = 800,
    includeLabels = true
  } = options;
  
  const nodes = reactFlowInstance.getNodes();
  const edges = reactFlowInstance.getEdges();
  
  console.log('🔍 [simpleEnhancedFitView] Nodes:', nodes.length, 'Edges:', edges.length);
  console.log('🔍 [simpleEnhancedFitView] Edges with labels:', edges.filter(e => e.label).length);
  
  // Calculate bounds
  const bounds = includeLabels 
    ? calculateBoundsWithLabels(nodes, edges, padding)
    : calculateNodeBoundsOnly(nodes, padding);
  
  if (!bounds) {
    console.log('🔍 [simpleEnhancedFitView] No bounds calculated');
    return;
  }
  
  console.log('🔍 [simpleEnhancedFitView] Calculated bounds:', bounds);
  
  // Use ReactFlow's fitBounds with calculated bounds
  await reactFlowInstance.fitBounds(bounds, { duration });
  
  console.log('🔍 [simpleEnhancedFitView] Completed');
}

/**
 * Fallback that only considers nodes (ReactFlow default behavior)
 */
function calculateNodeBoundsOnly(nodes: Node[], padding: number): { x: number; y: number; width: number; height: number } | null {
  if (nodes.length === 0) return null;
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
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
