import ELK from 'elkjs/lib/elk.bundled.js';
import { Position } from 'reactflow';
import type { Node, Edge } from 'reactflow';

const elk = new ELK();

export interface LayoutOptions {
  direction: 'DOWN' | 'RIGHT' | 'UP' | 'LEFT';
  algorithm: string;
  nodeSpacing: number;
  layerSpacing: number;
  edgeSpacing: number;
}

const getElkOptions = (options: LayoutOptions) => {
  const baseOptions = {
    'elk.algorithm': options.algorithm,
    'elk.direction': options.direction,
    'elk.spacing.nodeNode': options.nodeSpacing.toString(),
    'elk.spacing.edgeEdge': options.edgeSpacing.toString(),
    'elk.layered.spacing.nodeNodeBetweenLayers': options.layerSpacing.toString(),
  };

  return baseOptions;
};

export const getLayoutedElements = async (
  nodes: Node[],
  edges: Edge[],
  layoutOptions: LayoutOptions
): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  const nodeWidth = 150;
  const nodeHeight = 50;
  const direction = layoutOptions.direction;

  const isHorizontal = direction === 'RIGHT' || direction === 'LEFT';
  const elkOptions = getElkOptions(layoutOptions);
  
  const graph = {
    id: 'root',
    layoutOptions: elkOptions,
    children: nodes.map((node) => ({
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      width: nodeWidth,
      height: nodeHeight,
    })),
    edges: edges.map((edge) => ({
      ...edge,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  try {
    const layoutedGraph = await elk.layout(graph);
    
    return {
      nodes: layoutedGraph.children?.map((node_1) => ({
        ...node_1,
        position: { x: node_1.x || 0, y: node_1.y || 0 },
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      })) || [],
      edges: edges,
    };
  } catch (error) {
    console.error('ELK layout failed:', error);
    // Fallback to simple grid layout
    const fallbackNodes = nodes.map((node, index) => ({
      ...node,
      position: { 
        x: (index % 3) * 200, 
        y: Math.floor(index / 3) * 100 
      }
    }));
    return { nodes: fallbackNodes, edges };
  }
};

export const getDefaultLayoutOptions = (): LayoutOptions => ({
  direction: 'RIGHT',
  algorithm: 'layered',
  nodeSpacing: 80,
  layerSpacing: 120,
  edgeSpacing: 15,
});
