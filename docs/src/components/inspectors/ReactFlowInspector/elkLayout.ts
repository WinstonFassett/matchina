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
  thoroughness?: number;
  aspectRatio?: number;
  compactComponents?: boolean;
  separateComponents?: boolean;
}

interface AlgorithmInfo {
  name: string;
  description: string;
  supportsDirection: boolean;
}

// Get available layout algorithms
export const getAvailableAlgorithms = (): string[] => {
  return ['layered', 'force', 'stress', 'mrtree', 'radial', 'disco'];
};

// Get information about a specific algorithm
export const getAlgorithmInfo = (algorithm: string): AlgorithmInfo => {
  const algorithms: Record<string, AlgorithmInfo> = {
    layered: {
      name: 'Layered (Default)',
      description: 'Hierarchical layout with layers - best for state machines',
      supportsDirection: true,
    },
    force: {
      name: 'Force',
      description: 'Force-directed layout - good for connected graphs',
      supportsDirection: false,
    },
    stress: {
      name: 'Stress',
      description: 'Stress-minimizing layout - good for dense graphs',
      supportsDirection: false,
    },
    mrtree: {
      name: 'MR Tree',
      description: 'Tree layout - good for hierarchical structures',
      supportsDirection: true,
    },
    radial: {
      name: 'Radial',
      description: 'Radial layout - nodes arranged in concentric circles',
      supportsDirection: false,
    },
    disco: {
      name: 'Disco',
      description: 'Disconnected graph layout - good for separated components',
      supportsDirection: false,
    },
  };

  return algorithms[algorithm] || {
    name: algorithm,
    description: 'Custom layout algorithm',
    supportsDirection: true,
  };
};

export const getDefaultLayoutOptions = (): LayoutOptions => ({
  direction: 'DOWN',
  algorithm: 'layered',
  nodeSpacing: 40,
  layerSpacing: 40,
  edgeSpacing: 20,
  thoroughness: 7,
  aspectRatio: 1.6,
  compactComponents: true,
  separateComponents: true,
});

const getElkOptions = (options: LayoutOptions): Record<string, any> => {
  const baseOptions: Record<string, any> = {
    'elk.algorithm': options.algorithm,
    'elk.spacing.nodeNode': options.nodeSpacing.toString(),
    'elk.layered.spacing.nodeNodeBetweenLayers': options.layerSpacing.toString(),
    'elk.edgeRouting': 'ORTHOGONAL',
  };

  // Only add direction for algorithms that support it
  if (getAlgorithmInfo(options.algorithm).supportsDirection) {
    baseOptions['elk.direction'] = options.direction;
  }

  // Algorithm-specific options
  if (options.algorithm === 'layered') {
    baseOptions['elk.layered.spacing.edgeEdge'] = options.edgeSpacing.toString();
    if (options.separateComponents !== undefined) {
      baseOptions['elk.separateConnectedComponents'] = options.separateComponents;
    }
    if (options.compactComponents !== undefined) {
      baseOptions['elk.layered.compaction.connectedComponents'] = options.compactComponents;
    }
  } else if (options.algorithm === 'stress' || options.algorithm === 'force') {
    if (options.aspectRatio !== undefined) {
      baseOptions['elk.aspectRatio'] = options.aspectRatio;
    }
    if (options.thoroughness !== undefined) {
      // Higher means more accurate but slower layout
      baseOptions['elk.stress.desiredEdgeLength'] = options.thoroughness * 100;
    }
  }

  return baseOptions;
};

export const getLayoutedElements = async (
  nodes: Node[],
  edges: Edge[],
  layoutOptions: LayoutOptions = getDefaultLayoutOptions()
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
      width: nodeWidth,
      height: nodeHeight,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  try {
    const layoutedGraph = await elk.layout(graph);
    
    return {
      nodes: layoutedGraph.children?.map((node) => ({
        ...node,
        position: { x: node.x || 0, y: node.y || 0 },
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      })) || [],
      edges: edges,
    };
  } catch (error) {
    console.error('ELK layout error:', error);
    return { nodes, edges };
  }
};
