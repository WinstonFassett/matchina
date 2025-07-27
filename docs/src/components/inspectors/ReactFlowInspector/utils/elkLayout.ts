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
  // Algorithm-specific options
  thoroughness?: number;
  // aspectRatio removed as it doesn't work properly
  compactComponents?: boolean;
  separateComponents?: boolean;
  // Additional spacing controls
  edgeNodeSpacing?: number;
  componentSpacing?: number;
}

// Get working algorithms from ELK
export const getAvailableAlgorithms = (): string[] => {
  return [
    'layered',    // Works well, most options effective
    'stress',     // Works, responds to spacing
    'mrtree',     // Works, good for trees
    'force',      // Works, organic layout
    'sporeOverlap' // Works, good for overlap removal
  ];
};

const getElkOptions = (options: LayoutOptions) => {
  const baseOptions = {
    'elk.algorithm': options.algorithm,
    'elk.direction': options.direction,
    'elk.spacing.nodeNode': options.nodeSpacing.toString(),
    'elk.spacing.edgeEdge': options.edgeSpacing.toString(),
    'elk.spacing.edgeNode': (options.edgeNodeSpacing || 20).toString(),
    'elk.spacing.componentComponent': (options.componentSpacing || 40).toString(),
    'elk.separateConnectedComponents': options.separateComponents ? 'true' : 'false',
    // Aspect ratio removed as it doesn't work properly
  };

  // Algorithm-specific options that actually work
  switch (options.algorithm) {
    case 'layered':
      return {
        ...baseOptions,
        // Layer spacing - this actually works
        'elk.layered.spacing.nodeNodeBetweenLayers': options.layerSpacing.toString(),
        'elk.layered.spacing.edgeNodeBetweenLayers': (options.edgeNodeSpacing || 20).toString(),
        
        // Node placement strategy - affects layout quality
        'elk.layered.nodePlacement.strategy': options.compactComponents ? 'SIMPLE' : 'NETWORK_SIMPLEX',
        
        // Crossing minimization - thoroughness equivalent
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        'elk.layered.crossingMinimization.semiInteractive': 'true',
        
        // Cycle breaking
        'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
        
        // Edge routing
        'elk.layered.edgeRouting.selfLoopDistribution': 'EQUALLY',
        'elk.layered.edgeRouting.selfLoopOrdering': 'SEQUENCED',
        
        // Compaction
        'elk.layered.compaction.postCompaction.strategy': options.compactComponents ? 'EDGE_LENGTH' : 'NONE',
        'elk.layered.compaction.postCompaction.constraints': 'SEQUENCE',
        
        // Thoroughness - affects crossing minimization iterations
        'elk.layered.thoroughness': Math.max(1, Math.min(20, options.thoroughness || 7)).toString(),
        
        // Consider model order
        'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
        
        // Aspect ratio
        
      };

    case 'stress':
      return {
        ...baseOptions,
        // Stress-specific options that work
        'elk.stress.iterationLimit': '500',
        'elk.stress.epsilon': '0.0001',
        // Use both nodeSpacing and layerSpacing for better control
        'elk.stress.desiredEdgeLength': options.layerSpacing.toString(),
        'elk.spacing.nodeNode': options.nodeSpacing.toString(), // Override base option
        'elk.stress.dimension': 'XY',
        // Aspect ratio removed as it doesn't work properly
        // Thoroughness affects quality
        'elk.stress.quality': Math.max(1, Math.min(10, options.thoroughness || 7)).toString(),
      };

    case 'mrtree':
      return {
        ...baseOptions,
        // Tree-specific options
        'elk.mrtree.searchOrder': 'DFS',
        'elk.mrtree.weighting': 'DESCENDANTS',
        // Layer spacing affects tree levels
        'elk.layered.spacing.nodeNodeBetweenLayers': options.layerSpacing.toString(),
        // Compact components affects tree layout
        'elk.mrtree.compaction': options.compactComponents ? 'true' : 'false',
      };

    case 'force':
      return {
        ...baseOptions,
        // Force-directed options with better controls
        'elk.force.iterations': '300',
        // Node repulsion based on node spacing
        'elk.force.repulsion': (options.nodeSpacing / 10).toString(),
        // Edge attraction based on layer spacing
        'elk.force.attraction': (options.layerSpacing / 300).toString(),
        // Temperature affects convergence
        'elk.force.temperature': ((options.thoroughness || 7) / 1000).toString(),
        'elk.force.model': 'FRUCHTERMAN_REINGOLD',
        // Aspect ratio
        
        // Compact components affects force layout
        'elk.force.useCoarseGraining': options.compactComponents ? 'true' : 'false',
      };

    case 'sporeOverlap':
      return {
        ...baseOptions,
        // Spore overlap options
        'elk.sporeOverlap.overlapRemovalStrategy': 'SCAN_LINE',
        'elk.sporeOverlap.spillOverToParentHierarchyLevel': 'false',
        // Node spacing is critical for overlap removal
        'elk.spacing.nodeNode': (options.nodeSpacing * 1.5).toString(), // Override base option
      };

    default:
      return baseOptions;
  }
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
  nodeSpacing: 120,      // Increased from 80
  layerSpacing: 150,     // Increased from 120
  edgeSpacing: 30,       // Increased from 15
  thoroughness: 7,
  // aspectRatio removed as it doesn't work properly
  compactComponents: false,
  separateComponents: true, // Changed to true to better separate components
  edgeNodeSpacing: 40,    // Increased from 20
  componentSpacing: 80,   // Increased from 40
});

// Algorithm metadata for UI - only working algorithms
export const getAlgorithmInfo = (algorithm: string) => {
  const info: Record<string, { 
    name: string; 
    description: string; 
    supportsDirection: boolean; 
    hasLayerSpacing: boolean;
    hasThoroughness: boolean;
    hasAspectRatio: boolean;
    hasEdgeNodeSpacing: boolean;
  }> = {
    layered: {
      name: 'Layered (Sugiyama)',
      description: 'Hierarchical layout with clear layers - best for directed graphs',
      supportsDirection: true,
      hasLayerSpacing: true,
      hasThoroughness: true,
      hasAspectRatio: false,
      hasEdgeNodeSpacing: true,
    },
    stress: {
      name: 'Stress Minimization',
      description: 'Spring-based layout that minimizes edge stress',
      supportsDirection: false,
      hasLayerSpacing: true,
      hasThoroughness: false,
      hasAspectRatio: true,
      hasEdgeNodeSpacing: false,
    },
    mrtree: {
      name: 'Tree Layout',
      description: 'Optimized for tree structures and hierarchies',
      supportsDirection: true,
      hasLayerSpacing: true,
      hasThoroughness: false,
      hasAspectRatio: true,
      hasEdgeNodeSpacing: false,
    },
    force: {
      name: 'Force-Directed',
      description: 'Organic layout using physical simulation',
      supportsDirection: false,
      hasLayerSpacing: true, // Used as repulsion strength
      hasThoroughness: false,
      hasAspectRatio: true,
      hasEdgeNodeSpacing: false,
    },
    sporeOverlap: {
      name: 'Spore Overlap Removal',
      description: 'Removes overlaps while preserving relative positions',
      supportsDirection: false,
      hasLayerSpacing: false,
      hasThoroughness: false,
      hasAspectRatio: true,
      hasEdgeNodeSpacing: false,
    },
  };

  return info[algorithm] || {
    name: algorithm,
    description: 'Custom layout algorithm',
    supportsDirection: true,
    hasLayerSpacing: true,
    hasThoroughness: false,
    hasAspectRatio: false,
    hasEdgeNodeSpacing: false,
  };
};