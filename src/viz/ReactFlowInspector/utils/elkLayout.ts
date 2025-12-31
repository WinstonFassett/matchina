import ELK from "elkjs/lib/elk.bundled.js";
import { Position } from "reactflow";
import type { Node, Edge } from "reactflow";

const elk = new ELK();

export interface LayoutOptions {
  direction: "DOWN" | "RIGHT" | "UP" | "LEFT";
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
    "layered", // Works well, most options effective
    "stress", // Works, responds to spacing
    "mrtree", // Works, good for trees
    "force", // Works, organic layout
    "sporeOverlap", // Works, good for overlap removal
  ];
};

const getElkOptions = (options: LayoutOptions) => {
  const baseOptions = {
    "elk.algorithm": options.algorithm,
    "elk.direction": options.direction,
    "elk.spacing.nodeNode": options.nodeSpacing.toString(),
    "elk.spacing.edgeEdge": options.edgeSpacing.toString(),
    "elk.spacing.edgeNode": (options.edgeNodeSpacing || 20).toString(),
    "elk.spacing.componentComponent": (
      options.componentSpacing || 40
    ).toString(),
    "elk.separateConnectedComponents": options.separateComponents
      ? "true"
      : "false",
    // HIERARCHICAL LAYOUT OPTIONS - Important for compound nodes
    "elk.hierarchyHandling": "INCLUDE_CHILDREN",
    "elk.layered.considerModelOrder.hierarchy": "true",
    "elk.layered.thoroughness": "7", // Better layout quality
    // Compound node sizing
    "elk.padding": "[top=20,left=20,bottom=20,right=20]",
  };

  // Algorithm-specific options that actually work
  switch (options.algorithm) {
    case "layered":
      return {
        ...baseOptions,
        // Layer spacing - this actually works
        "elk.layered.spacing.nodeNodeBetweenLayers":
          options.layerSpacing.toString(),
        "elk.layered.spacing.edgeNodeBetweenLayers": (
          options.edgeNodeSpacing || 20
        ).toString(),

        // Node placement strategy - affects layout quality
        "elk.layered.nodePlacement.strategy": options.compactComponents
          ? "SIMPLE"
          : "NETWORK_SIMPLEX",

        // Crossing minimization - thoroughness equivalent
        "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
        "elk.layered.crossingMinimization.semiInteractive": "true",

        // Cycle breaking
        "elk.layered.cycleBreaking.strategy": "DEPTH_FIRST",

        // Edge routing
        "elk.layered.edgeRouting.selfLoopDistribution": "EQUALLY",
        "elk.layered.edgeRouting.selfLoopOrdering": "SEQUENCED",

        // Compaction
        "elk.layered.compaction.postCompaction.strategy":
          options.compactComponents ? "EDGE_LENGTH" : "NONE",
        "elk.layered.compaction.postCompaction.constraints": "SEQUENCE",

        // Thoroughness - affects crossing minimization iterations
        "elk.layered.thoroughness": Math.max(
          1,
          Math.min(20, options.thoroughness || 7)
        ).toString(),

        // Consider model order
        "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",

        // Aspect ratio
      };

    case "stress":
      return {
        ...baseOptions,
        // Stress-specific options that work
        "elk.stress.iterationLimit": "500",
        "elk.stress.epsilon": "0.0001",
        // Use both nodeSpacing and layerSpacing for better control
        "elk.stress.desiredEdgeLength": options.layerSpacing.toString(),
        "elk.spacing.nodeNode": options.nodeSpacing.toString(), // Override base option
        "elk.stress.dimension": "XY",
        // Aspect ratio removed as it doesn't work properly
        // Thoroughness affects quality
        "elk.stress.quality": Math.max(
          1,
          Math.min(10, options.thoroughness || 7)
        ).toString(),
      };

    case "mrtree":
      return {
        ...baseOptions,
        // Tree-specific options
        "elk.mrtree.searchOrder": "DFS",
        "elk.mrtree.weighting": "DESCENDANTS",
        // Layer spacing affects tree levels
        "elk.layered.spacing.nodeNodeBetweenLayers":
          options.layerSpacing.toString(),
        // Compact components affects tree layout
        "elk.mrtree.compaction": options.compactComponents ? "true" : "false",
      };

    case "force":
      return {
        ...baseOptions,
        // Force-directed options with better controls
        "elk.force.iterations": "300",
        // Node repulsion based on node spacing
        "elk.force.repulsion": (options.nodeSpacing / 10).toString(),
        // Edge attraction based on layer spacing
        "elk.force.attraction": (options.layerSpacing / 300).toString(),
        // Temperature affects convergence
        "elk.force.temperature": (
          (options.thoroughness || 7) / 1000
        ).toString(),
        "elk.force.model": "FRUCHTERMAN_REINGOLD",
        // Aspect ratio

        // Compact components affects force layout
        "elk.force.useCoarseGraining": options.compactComponents
          ? "true"
          : "false",
      };

    case "sporeOverlap":
      return {
        ...baseOptions,
        // Spore overlap options
        "elk.sporeOverlap.overlapRemovalStrategy": "SCAN_LINE",
        "elk.sporeOverlap.spillOverToParentHierarchyLevel": "false",
        // Node spacing is critical for overlap removal
        "elk.spacing.nodeNode": (options.nodeSpacing * 1.5).toString(), // Override base option
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
  const groupPadding = 40; // Padding inside group nodes for children
  const direction = layoutOptions.direction;

  const isHorizontal = direction === "RIGHT" || direction === "LEFT";
  const elkOptions = getElkOptions(layoutOptions);

  // Build hierarchical ELK graph structure
  // Children must be nested INSIDE their parent for ELK to handle hierarchy
  const nodeMap = new Map<string, any>();
  const rootChildren: any[] = [];

  // First pass: create all ELK nodes
  for (const node of nodes) {
    const elkNode: any = {
      id: node.id,
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      width: node.type === 'group' ? nodeWidth * 2 : nodeWidth,
      height: node.type === 'group' ? nodeHeight * 3 : nodeHeight,
      // Preserve original data for later
      _originalNode: node,
    };

    // Group nodes need padding and layout options for children
    if (node.type === 'group') {
      elkNode.layoutOptions = {
        ...elkOptions,
        "elk.padding": `[top=${groupPadding + 20},left=${groupPadding},bottom=${groupPadding},right=${groupPadding}]`,
      };
      elkNode.children = [];
    }

    nodeMap.set(node.id, elkNode);
  }

  // Second pass: build hierarchy by nesting children inside parents
  for (const node of nodes) {
    const elkNode = nodeMap.get(node.id);
    const parentId = node.parentId;

    if (parentId && nodeMap.has(parentId)) {
      // This is a child - add to parent's children array
      const parentNode = nodeMap.get(parentId);
      if (parentNode.children) {
        parentNode.children.push(elkNode);
      }
    } else {
      // This is a root-level node
      rootChildren.push(elkNode);
    }
  }

  const graph = {
    id: "root",
    layoutOptions: elkOptions,
    children: rootChildren,
    edges: edges.map((edge) => ({
      ...edge,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  try {
    const layoutedGraph = await elk.layout(graph);

    // Recursively extract all nodes with their positions
    // For ReactFlow: root nodes need absolute positions, child nodes need positions relative to parent
    const extractNodes = (elkNodes: any[], isRoot = true): Node[] => {
      const result: Node[] = [];
      for (const elkNode of elkNodes) {
        const originalNode = elkNode._originalNode;

        // Create the ReactFlow node with position
        // ELK positions for nested children are already relative to parent - perfect for ReactFlow
        const rfNode: Node = {
          ...originalNode,
          position: { x: elkNode.x || 0, y: elkNode.y || 0 },
          // Update width/height if ELK computed them (important for group nodes)
          ...(elkNode.width && elkNode.height && {
            style: {
              ...originalNode?.style,
              width: elkNode.width,
              height: elkNode.height,
            }
          }),
          targetPosition: isHorizontal ? Position.Left : Position.Top,
          sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        };
        result.push(rfNode);

        // Recursively process children
        if (elkNode.children && elkNode.children.length > 0) {
          result.push(...extractNodes(elkNode.children, false));
        }
      }
      return result;
    };

    return {
      nodes: extractNodes(layoutedGraph.children || []),
      edges: edges,
    };
  } catch (error) {
    console.error("ELK layout failed:", error);
    // Fallback to simple grid layout
    const fallbackNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % 3) * 200,
        y: Math.floor(index / 3) * 100,
      },
    }));
    return { nodes: fallbackNodes, edges };
  }
};

export const getDefaultLayoutOptions = (): LayoutOptions => ({
  direction: "DOWN", // Changed from RIGHT for better hierarchical visualization
  algorithm: "layered",
  nodeSpacing: 100, // Reduced for more compact layout
  layerSpacing: 120, // Reduced for tighter vertical spacing
  edgeSpacing: 20, // Reduced for cleaner edges
  thoroughness: 7,
  // aspectRatio removed as it doesn't work properly
  compactComponents: false,
  separateComponents: false, // Changed to false for better component integration
  edgeNodeSpacing: 30, // Reduced for cleaner edges
  componentSpacing: 60, // Reduced for more compact layout
});

// Algorithm metadata for UI - only working algorithms
export const getAlgorithmInfo = (algorithm: string) => {
  const info: Record<
    string,
    {
      name: string;
      description: string;
      supportsDirection: boolean;
      hasLayerSpacing: boolean;
      hasThoroughness: boolean;
      hasAspectRatio: boolean;
      hasEdgeNodeSpacing: boolean;
    }
  > = {
    layered: {
      name: "Layered (Sugiyama)",
      description:
        "Hierarchical layout with clear layers - best for directed graphs",
      supportsDirection: true,
      hasLayerSpacing: true,
      hasThoroughness: true,
      hasAspectRatio: false,
      hasEdgeNodeSpacing: true,
    },
    stress: {
      name: "Stress Minimization",
      description: "Spring-based layout that minimizes edge stress",
      supportsDirection: false,
      hasLayerSpacing: true,
      hasThoroughness: false,
      hasAspectRatio: true,
      hasEdgeNodeSpacing: false,
    },
    mrtree: {
      name: "Tree Layout",
      description: "Optimized for tree structures and hierarchies",
      supportsDirection: true,
      hasLayerSpacing: true,
      hasThoroughness: false,
      hasAspectRatio: true,
      hasEdgeNodeSpacing: false,
    },
    force: {
      name: "Force-Directed",
      description: "Organic layout using physical simulation",
      supportsDirection: false,
      hasLayerSpacing: true, // Used as repulsion strength
      hasThoroughness: false,
      hasAspectRatio: true,
      hasEdgeNodeSpacing: false,
    },
    sporeOverlap: {
      name: "Spore Overlap Removal",
      description: "Removes overlaps while preserving relative positions",
      supportsDirection: false,
      hasLayerSpacing: false,
      hasThoroughness: false,
      hasAspectRatio: true,
      hasEdgeNodeSpacing: false,
    },
  };

  return (
    info[algorithm] || {
      name: algorithm,
      description: "Custom layout algorithm",
      supportsDirection: true,
      hasLayerSpacing: true,
      hasThoroughness: false,
      hasAspectRatio: false,
      hasEdgeNodeSpacing: false,
    }
  );
};
