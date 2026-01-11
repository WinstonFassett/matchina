/**
 * ELK Layout Engine
 * Powerful hierarchical layout using ELK.js layered algorithm
 * Research: elk-options-reference.json
 */

import type { Node, Edge } from '@xyflow/react';
import { z } from 'zod';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode, ElkExtendedEdge } from 'elkjs';
import type { LayoutEngine, LayoutResult, BaseLayoutSettings } from '../types';
import { LayoutType } from '../types';

// ELK Layout Settings Schema - matches V1 options that actually work
const ELKLayoutSettings = z.object({
  // Base settings
  nodeSpacing: z.number().min(20).max(500).default(120),
  edgeSpacing: z.number().min(10).max(100).default(20),
  fitPadding: z.number().min(0).max(100).default(20),
  animationDuration: z.number().min(0).max(2000).default(300),
  compactness: z.number().min(0).max(1).default(0),

  // ELK algorithm - can be passed from LayoutManager for different layout types
  // Options: layered (Sugiyama), mrtree (Tree), force, stress, disco, org.eclipse.elk.graphviz.circo
  // REMOVED: radial - causes "not a tree" errors, replaced with Graphviz circo
  algorithm: z.enum(['layered', 'force', 'stress', 'mrtree', 'box', 'disco', 'org.eclipse.elk.graphviz.circo']).default('layered'),

  // Direction (works for layered and mrtree)
  direction: z.enum(['DOWN', 'UP', 'LEFT', 'RIGHT']).default('DOWN'),
  
  // Layer/level spacing (between layers in layered/mrtree)
  layerSpacing: z.number().min(40).max(400).default(180),
  
  // Edge routing style
  edgeRouting: z.enum(['ORTHOGONAL', 'POLYLINE', 'SPLINES']).default('ORTHOGONAL'),
  
  // Node alignment within layers
  alignment: z.enum(['CENTER', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM']).default('CENTER'),

  // Edge-node spacing
  edgeNodeSpacing: z.number().min(5).max(100).default(30),
  edgeEdgeSpacing: z.number().min(5).max(100).default(20),
  
  // CRITICAL MISSING SETTINGS - Phase 1 Remediations
  // Hierarchy handling - essential for HSM
  hierarchyHandling: z.enum(['INCLUDE_CHILDREN', 'SEPARATE_CHILDREN', 'INHERIT']).default('INCLUDE_CHILDREN'),
  
  // Padding for containers - important for ReactFlow
  paddingTop: z.number().min(0).max(100).default(50),
  paddingLeft: z.number().min(0).max(100).default(50),
  paddingBottom: z.number().min(0).max(100).default(50),
  paddingRight: z.number().min(0).max(100).default(50),
  
  // Algorithm-specific performance controls
  thoroughness: z.number().min(1).max(20).default(7), // For layered algorithm
  iterationLimit: z.number().min(50).max(500).default(150), // For stress algorithm
  forceIterations: z.number().min(50).max(1000).default(300), // For force algorithm
  
  // Component handling (V1 parity)
  compactComponents: z.boolean().default(false),
  separateComponents: z.boolean().default(false),
  componentSpacing: z.number().min(20).max(200).default(60),

  // Feedback edges (cycle handling)
  feedbackEdges: z.boolean().default(true),
  
  // Alternating direction - EXPERIMENTAL FEATURE
  alternatingDirection: z.boolean().default(false), // OFF by default
  primaryDirection: z.enum(['DOWN', 'RIGHT']).default('DOWN'),
  secondaryDirection: z.enum(['DOWN', 'RIGHT']).default('RIGHT'),
  
  // Advanced ELK options for fine-tuning (V1 parity)
  nodePlacementStrategy: z.enum(['SIMPLE', 'NETWORK_SIMPLEX', 'BRANDES_KOEPF']).default('NETWORK_SIMPLEX'),
  edgeRoutingStrategy: z.enum(['ORTHOGONAL', 'POLYLINE', 'SPLINES', 'STRAIGHT']).default('ORTHOGONAL'),
  compactionStrategy: z.enum(['NONE', 'EDGE_LENGTH', 'NODE_DIMENSIONS']).default('NONE'),
  cycleBreakingStrategy: z.enum(['GREEDY', 'DEPTH_FIRST', 'INTERACTIVE']).default('DEPTH_FIRST'),
});

type ELKLayoutSettings = z.infer<typeof ELKLayoutSettings>;

export class ELKLayoutEngine implements LayoutEngine<ELKLayoutSettings> {
  readonly type = LayoutType.HIERARCHICAL;
  readonly name = 'Hierarchical (ELK)';
  readonly description = 'Layer-based layout optimized for state machines and flowcharts';

  private elk: InstanceType<typeof ELK>;

  constructor() {
    this.elk = new ELK();
  }

  private async calculateLayoutAsync(
    nodes: Node[],
    edges: Edge[],
    settings: ELKLayoutSettings
  ): Promise<LayoutResult> {
    const startTime = performance.now();
    const validatedSettings = this.validateSettings(settings);
    
    console.log('🔍 DEBUG: ELKLayoutEngine.calculateLayout', { 
      algorithm: validatedSettings.algorithm,
      nodeCount: nodes.length,
      edgeCount: edges.length 
    });

    try {
      const elkGraph = this.toElkGraph(nodes, edges, validatedSettings);
      
      // DEBUG: Log V2 ELK options for comparison with V1
      console.log('[V2 ELK] layoutOptions:', JSON.stringify(elkGraph.layoutOptions, null, 2));
      console.log('[V2 ELK] node count:', elkGraph.children?.length);
      console.log('[V2 ELK] first node dimensions:', elkGraph.children?.[0] ? { w: elkGraph.children[0].width, h: elkGraph.children[0].height } : 'none');
      
      // Run ELK layout
      const layoutedGraph = await this.elk.layout(elkGraph);
      
      // Convert back to ReactFlow format
      const positionedNodes = this.extractNodePositions(nodes, layoutedGraph);
      const bounds = this.calculateBounds(positionedNodes, validatedSettings.fitPadding);

      return {
        nodes: positionedNodes,
        edges, // ELK positions edges automatically
        bounds,
        metadata: {
          layoutType: this.type,
          nodeCount: nodes.length,
          edgeCount: edges.length,
          calculationTime: performance.now() - startTime,
          converged: true,
        },
      };
    } catch (error) {
      console.error('ELK layout failed:', error);
      // Fallback to simple positioning
      return this.fallbackLayout(nodes, edges, validatedSettings, startTime);
    }
  }

  // Synchronous wrapper for interface compatibility
  async calculateLayout(
    nodes: Node[],
    edges: Edge[],
    settings: ELKLayoutSettings
  ): Promise<LayoutResult> {
    // Use async ELK layout for proper group sizing in all cases
    return this.calculateLayoutAsync(nodes, edges, this.validateSettings(settings));
  }

  private buildLayoutOptions(
    algorithm: string,
    settings: ELKLayoutSettings,
    nodeSpacing: number,
    layerSpacing: number
  ): Record<string, string> {
    // Use EXACT working code from V1's getElkOptions()
    const baseOptions = {
      "elk.algorithm": algorithm,
      "elk.direction": settings.direction,
      "elk.spacing.nodeNode": nodeSpacing.toString(),
      "elk.spacing.edgeEdge": settings.edgeSpacing.toString(),
      "elk.spacing.edgeNode": (settings.edgeNodeSpacing || 20).toString(),
      "elk.spacing.componentComponent": (settings.componentSpacing || 40).toString(),
      "elk.separateConnectedComponents": settings.separateComponents ? "true" : "false",
      // HIERARCHICAL LAYOUT OPTIONS - Important for compound nodes
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.layered.considerModelOrder.hierarchy": "true",
      "elk.layered.thoroughness": "7", // Better layout quality
      // Compound node sizing
      "elk.padding": "[top=50,left=50,bottom=50,right=50]",
    };

    // Algorithm-specific options that actually work (EXACT copy from V1)
    switch (algorithm) {
      case "layered":
        return {
          ...baseOptions,
          // Layer spacing - this actually works
          "elk.layered.spacing.nodeNodeBetweenLayers": layerSpacing.toString(),
          "elk.layered.spacing.edgeNodeBetweenLayers": (settings.edgeNodeSpacing || 20).toString(),

          // Node placement strategy - affects layout quality
          "elk.layered.nodePlacement.strategy": settings.compactComponents
            ? "SIMPLE"
            : "NETWORK_SIMPLEX",

          // Cycle breaking
          "elk.layered.cycleBreaking.strategy": "DEPTH_FIRST",

          // Edge routing - Basic orthogonal routing
          "elk.layered.edgeRouting.selfLoopDistribution": "EQUALLY",
          "elk.layered.edgeRouting.selfLoopOrdering": "SEQUENCED",
          "elk.layered.edgeRouting.strategy": "ORTHOGONAL",
          "elk.layered.spacing.edgeNodeSpacing": "20",
          "elk.layered.spacing.edgeEdgeSpacing": "15",

          // Compaction
          "elk.layered.compaction.postCompaction.strategy":
            settings.compactComponents ? "EDGE_LENGTH" : "NONE",
          "elk.layered.compaction.postCompaction.constraints": "SEQUENCE",

          // Thoroughness - affects crossing minimization iterations
          "elk.layered.thoroughness": Math.max(
            1,
            Math.min(20, settings.thoroughness || 7)
          ).toString(),

          // Consider model order
          "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
        };

      case "stress":
        return {
          ...baseOptions,
          // Stress-specific options that work
          "elk.stress.iterationLimit": "500",
          "elk.stress.epsilon": "0.0001",
          // Use both nodeSpacing and layerSpacing for better control
          "elk.stress.desiredEdgeLength": layerSpacing.toString(),
          "elk.spacing.nodeNode": nodeSpacing.toString(), // Override base option
          "elk.stress.dimension": "XY",
          // Thoroughness affects quality
          "elk.stress.quality": Math.max(
            1,
            Math.min(10, settings.thoroughness || 7)
          ).toString(),
        };

      case "mrtree":
        return {
          ...baseOptions,
          // Tree-specific options
          "elk.mrtree.searchOrder": "DFS",
          "elk.mrtree.weighting": "DESCENDANTS",
          // Layer spacing affects tree levels
          "elk.layered.spacing.nodeNodeBetweenLayers": layerSpacing.toString(),
          // Compact components affects tree layout
          "elk.mrtree.compaction": settings.compactComponents ? "true" : "false",
        };

      case "force":
        return {
          ...baseOptions,
          // Force-directed options with better controls
          "elk.force.iterations": "300",
          // Node repulsion based on node spacing
          "elk.force.repulsion": (nodeSpacing / 10).toString(),
          // Edge attraction based on layer spacing
          "elk.force.attraction": (layerSpacing / 300).toString(),
          // Temperature affects convergence
          "elk.force.temperature": (
            (settings.thoroughness || 7) / 1000
          ).toString(),
          "elk.force.model": "FRUCHTERMAN_REINGOLD",
          // Compact components affects force layout
          "elk.force.useCoarseGraining": settings.compactComponents
            ? "true"
            : "false",
        };

      case "disco":
        return {
          ...baseOptions,
          // DisCo (Disjoint Component) layout for grid-like arrangement
          "elk.disco.compaction": "COMPACTION_ON",
          "elk.disco.compactionStrategy": "MAX_COMPACTION",
          "elk.disco.threshold": "4",
          "elk.disco.expandNodes": "false",
        };

      case "org.eclipse.elk.graphviz.circo":
        return {
          ...baseOptions,
          // Graphviz circo algorithm for circular layout
          "org.eclipse.elk.graphviz.circo.ranksep": layerSpacing.toString(),
          "org.eclipse.elk.graphviz.circo.nodesep": nodeSpacing.toString(),
          "org.eclipse.elk.graphviz.circo.margin": "16",
          "org.eclipse.elk.graphviz.circo.smoothing": "spring",
          "org.eclipse.elk.graphviz.circo.splines": "true",
        };

      default:
        return baseOptions;
    }
  }

  private toElkGraph(
    nodes: Node[],
    edges: Edge[],
    settings: ELKLayoutSettings
  ): ElkNode {
    // Apply compactness to spacing
    const spacingMultiplier = 1 - settings.compactness * 0.3;
    const nodeSpacing = settings.nodeSpacing * spacingMultiplier;
    const layerSpacing = settings.layerSpacing * spacingMultiplier;
    const groupPadding = 50; // Match V1
    const isHorizontal = settings.direction === 'LEFT' || settings.direction === 'RIGHT';
    
    // Use algorithm from settings (now properly typed)
    const algorithm = settings.algorithm;

    // Build hierarchy - children must be nested inside parents for ELK to handle sizing
    const nodeMap = new Map<string, any>();
    const rootChildren: any[] = [];

    // First pass: create all ELK nodes with hierarchy info
    for (const node of nodes) {
      const isGroup = node.type === 'group';
      // V1 uses FIXED dimensions - this is critical for consistent layouts
      const nodeWidth = 150;
      const nodeHeight = 50;
      const elkNode: any = {
        id: node.id,
        width: isGroup ? nodeWidth * 3 : nodeWidth, // Match V1: groups are 3x wider
        height: isGroup ? nodeHeight * 4 : nodeHeight, // Match V1: groups are 4x taller
        targetPosition: isHorizontal ? 'left' : 'top',
        sourcePosition: isHorizontal ? 'right' : 'bottom',
        _originalNode: node, // Preserve for later
        // Store hierarchy level for alternating direction
        _hierarchyLevel: this.calculateHierarchyLevel(node, nodes, edges),
      };

      // Group nodes need padding and layout options for children
      // IMPORTANT: Group nodes must inherit the SAME algorithm as the root graph
      // This allows ALL layout types (force, stress, mrtree, etc.) to work with hierarchy
      if (isGroup) {
        // V1 passes ALL elkOptions to groups, not a subset
        // This is critical for consistent nested layouts
        const groupLayoutOptions = this.buildLayoutOptions(algorithm, settings, nodeSpacing, layerSpacing);
        
        // Apply alternating direction - EXPERIMENTAL FEATURE
        if (settings.alternatingDirection) {
          const level = elkNode._hierarchyLevel;
          const childDirection = (level % 2 === 0) ? settings.secondaryDirection : settings.primaryDirection;
          
          // Override the direction in the layout options
          groupLayoutOptions['elk.direction'] = childDirection;
          
          // CRITICAL: For layered algorithm, try using tree algorithm for nested groups
          if (algorithm === 'layered') {
            // For layered, try switching to tree algorithm for nested groups to enable alternation
            groupLayoutOptions['elk.algorithm'] = 'mrtree';
            groupLayoutOptions['elk.layered.considerModelOrder.hierarchy'] = 'true';
            groupLayoutOptions['elk.hierarchyHandling'] = 'INCLUDE_CHILDREN';
          }
          
          // DEBUG: Log what direction we're applying
          console.log(`[ALTERNATING] Level ${level} (${node.id}) using direction: ${childDirection} for algorithm ${algorithm}`);
          console.log(`[ALTERNATING] Group layoutOptions:`, JSON.stringify(groupLayoutOptions, null, 2));
        }
        
        elkNode.layoutOptions = {
          ...groupLayoutOptions,
          'elk.padding': `[top=${groupPadding + 35},left=${groupPadding + 20},bottom=${groupPadding + 35},right=${groupPadding + 20}]`,
          // Enable dynamic sizing around children
          'elk.nodeSize.fixedSize': 'false',
          'elk.nodeSize.constraints': 'MINIMUM_SIZE',
          'elk.nodeSize.minimum': '[width=150,height=50]',
        };
        elkNode.children = [];
      }

      nodeMap.set(node.id, elkNode);
    }

    // Second pass: build hierarchy by nesting children inside parents
    for (const node of nodes) {
      const elkNode = nodeMap.get(node.id);
      const parentId = (node as any).parentId;

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

    const elkEdges: ElkExtendedEdge[] = edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    }));

    // Use the same layout options for root graph (like V1)
    const layoutOptions = this.buildLayoutOptions(algorithm, settings, nodeSpacing, layerSpacing);

    // Apply alternating direction to root - EXPERIMENTAL FEATURE
    if (settings.alternatingDirection) {
      layoutOptions['elk.direction'] = settings.primaryDirection;
    }
    
    // CRITICAL: For layered algorithm, ensure proper hierarchy handling for nested groups
    if (algorithm === 'layered') {
      layoutOptions['elk.hierarchyHandling'] = 'INCLUDE_CHILDREN';
    }

    // V1 adds elk.edgeRouting at graph level
    return {
      id: 'root',
      layoutOptions: {
        ...layoutOptions,
        'elk.edgeRouting': 'ORTHOGONAL', // V1 has this at graph level
      },
      children: rootChildren,
      edges: elkEdges,
    };
  }

  private calculateHierarchyLevel(node: Node, allNodes: Node[], edges: Edge[]): number {
    // Calculate hierarchy level based on parent-child relationships, not graph traversal
    // This follows the actual nesting structure: root=0, children=1, grandchildren=2, etc.
  
    let level = 0;
    let currentNode = node;
  
    // Walk up the parent chain to calculate depth
    while (true) {
      const parentId = (currentNode as any).parentId;
      if (!parentId) {
        break; // Reached root level
      }
      
      // Find the parent node
      const parentNode = allNodes.find(n => n.id === parentId);
      if (!parentNode) {
        break; // Parent not found, treat as root
      }
      
      level++;
      currentNode = parentNode;
      
      // Prevent infinite loops in malformed data
      if (level > 10) {
        break;
      }
    }
  
    return level;
  }

  private extractNodePositions(nodes: Node[], elkGraph: ElkNode): Node[] {
    // Recursively extract all nodes with their positions
    // For ReactFlow: child nodes need positions relative to parent (which ELK already provides)
    const extractNodes = (elkNodes: any[]): Node[] => {
      const result: Node[] = [];
      for (const elkNode of elkNodes) {
        const originalNode = elkNode._originalNode;

        // Create the ReactFlow node with position
        // ELK positions for nested children are already relative to parent - perfect for ReactFlow
        const x = elkNode.x || 0;
        const y = elkNode.y || 0;
        
                
        const rfNode: Node = {
          ...originalNode,
          position: { x, y },
          // Update width/height if ELK computed them (important for group nodes)
          // ReactFlow uses style.width/height for group node sizing
          ...(elkNode.width && elkNode.height && {
            style: {
              ...originalNode?.style,
              width: elkNode.width,
              height: elkNode.height,
            }
          }),
        };

        result.push(rfNode);

        // Recursively process children
        if (elkNode.children && elkNode.children.length > 0) {
          result.push(...extractNodes(elkNode.children));
        }
      }
      return result;
    };

    return extractNodes(elkGraph.children || []);
  }

  private fallbackLayout(
    nodes: Node[],
    edges: Edge[],
    settings: ELKLayoutSettings,
    startTime: number
  ): LayoutResult {
    // Simple hierarchical fallback when async not available
    const isHorizontal = settings.direction === 'LEFT' || settings.direction === 'RIGHT';
    const spacingMultiplier = 1 - settings.compactness * 0.3;
    const nodeSpacing = settings.nodeSpacing * spacingMultiplier;
    const layerSpacing = settings.layerSpacing * spacingMultiplier;

    // Build adjacency for level assignment
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, string[]>();

    for (const node of nodes) {
      outgoing.set(node.id, []);
      incoming.set(node.id, []);
    }

    for (const edge of edges) {
      outgoing.get(edge.source)?.push(edge.target);
      incoming.get(edge.target)?.push(edge.source);
    }

    // Find roots (nodes with no incoming edges)
    const roots = nodes.filter((n) => incoming.get(n.id)?.length === 0);
    if (roots.length === 0 && nodes.length > 0) {
      roots.push(nodes[0]); // Use first node as root if no clear root
    }

    // Assign levels using BFS
    const levels = new Map<string, number>();
    const queue = roots.map((r) => ({ id: r.id, level: 0 }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      levels.set(id, level);

      for (const targetId of outgoing.get(id) || []) {
        if (!visited.has(targetId)) {
          queue.push({ id: targetId, level: level + 1 });
        }
      }
    }

    // Handle disconnected nodes
    for (const node of nodes) {
      if (!levels.has(node.id)) {
        levels.set(node.id, 0);
      }
    }

    // Group nodes by level
    const levelGroups = new Map<number, Node[]>();
    for (const node of nodes) {
      const level = levels.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    }

    // Position nodes
    const positionedNodes = nodes.map((node) => {
      const level = levels.get(node.id) || 0;
      const levelNodes = levelGroups.get(level) || [node];
      const indexInLevel = levelNodes.indexOf(node);
      const levelWidth = (levelNodes.length - 1) * nodeSpacing;

      let x: number, y: number;

      if (isHorizontal) {
        x = level * layerSpacing;
        y = indexInLevel * nodeSpacing - levelWidth / 2;
        if (settings.direction === 'LEFT') {
          x = -x;
        }
      } else {
        x = indexInLevel * nodeSpacing - levelWidth / 2;
        y = level * layerSpacing;
        if (settings.direction === 'UP') {
          y = -y;
        }
      }

      return { ...node, position: { x, y } };
    });

    const bounds = this.calculateBounds(positionedNodes, settings.fitPadding);

    return {
      nodes: positionedNodes,
      edges,
      bounds,
      metadata: {
        layoutType: this.type,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        calculationTime: performance.now() - startTime,
        converged: true,
      },
    };
  }

  private emptyResult(startTime: number): LayoutResult {
    return {
      nodes: [],
      edges: [],
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      metadata: {
        layoutType: this.type,
        nodeCount: 0,
        edgeCount: 0,
        calculationTime: performance.now() - startTime,
        converged: true,
      },
    };
  }

  private calculateBounds(nodes: Node[], padding: number) {
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const xs = nodes.map((n) => n.position.x);
    const ys = nodes.map((n) => n.position.y);

    const minX = Math.min(...xs) - padding;
    const minY = Math.min(...ys) - padding;
    const maxX = Math.max(...xs) + padding;
    const maxY = Math.max(...ys) + padding;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  getDefaultSettings(): ELKLayoutSettings {
    return {
      // CRITICAL: Spacing for edge labels (75-100% of node width)
      // For 132px nodes: 99-132px for edge labels + nodes = 363-396px center-to-center
      nodeSpacing: 400,    // ~3.0x node width for edge labels (was 150)
      edgeSpacing: 20,
      fitPadding: 20,
      animationDuration: 300,
      compactness: 0,
      algorithm: 'layered',
      direction: 'DOWN',
      layerSpacing: 300,    // Increased for edge labels between layers (was 200)
      edgeRouting: 'ORTHOGONAL',
      alignment: 'CENTER',
      edgeNodeSpacing: 60,    // Increased for edge label clearance (was 40)
      edgeEdgeSpacing: 30,    // Increased for multiple edge labels (was 20)
      
      // Hierarchy settings for HSM support
      hierarchyHandling: 'INCLUDE_CHILDREN',
      paddingTop: 80,        // Increased for larger spacing (was 60)
      paddingLeft: 80,
      paddingBottom: 80,
      paddingRight: 80,
      
      // Algorithm-specific settings (keep for completeness)
      iterationLimit: 150,
      forceIterations: 300,
      
      compactComponents: false,
      separateComponents: false,
      componentSpacing: 80,   // Increased for edge labels (was 60)
      thoroughness: 7,
      feedbackEdges: true,
      alternatingDirection: false, // OFF by default
      primaryDirection: 'DOWN',
      secondaryDirection: 'RIGHT',
      
      // Advanced settings (kept for potential future use)
      nodePlacementStrategy: 'NETWORK_SIMPLEX',
      edgeRoutingStrategy: 'ORTHOGONAL',
      compactionStrategy: 'NONE',
      cycleBreakingStrategy: 'DEPTH_FIRST',
    };
  }

  validateSettings(settings: Partial<ELKLayoutSettings>): ELKLayoutSettings {
    return ELKLayoutSettings.parse({
      ...this.getDefaultSettings(),
      ...settings,
    });
  }

  getSettingsSchema() {
    return ELKLayoutSettings;
  }
}
