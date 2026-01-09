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
  compactness: z.number().min(0).max(1).default(0.7),

  // ELK algorithm - can be passed from LayoutManager for different layout types
  // Options: layered (Sugiyama), mrtree (Tree), force, stress
  algorithm: z.enum(['layered', 'force', 'stress', 'mrtree', 'box', 'radial']).default('layered'),

  // Direction (works for layered and mrtree)
  direction: z.enum(['DOWN', 'UP', 'LEFT', 'RIGHT']).default('DOWN'),
  
  // Layer/level spacing (between layers in layered/mrtree)
  layerSpacing: z.number().min(40).max(300).default(100),
  
  // Edge routing style
  edgeRouting: z.enum(['ORTHOGONAL', 'POLYLINE', 'SPLINES']).default('ORTHOGONAL'),
  
  // Node alignment within layers
  alignment: z.enum(['CENTER', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM']).default('CENTER'),

  // Edge-node spacing
  edgeNodeSpacing: z.number().min(5).max(100).default(20),
  edgeEdgeSpacing: z.number().min(5).max(100).default(15),
  
  // Component handling (V1 parity)
  compactComponents: z.boolean().default(false),
  separateComponents: z.boolean().default(false),
  componentSpacing: z.number().min(20).max(200).default(60),

  // Layout quality (affects crossing minimization iterations)
  thoroughness: z.number().min(1).max(20).default(7),
  
  // Feedback edges (cycle handling)
  feedbackEdges: z.boolean().default(true),
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
    
    try {
      const elkGraph = this.toElkGraph(nodes, edges, validatedSettings);
      
      // Debug logging for ELK graph structure
      console.log('🔧 ELK Graph structure:', {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        algorithm: (validatedSettings as any).algorithm || 'layered',
        hasGroupNodes: nodes.some(n => n.type === 'group'),
        elkGraphChildren: elkGraph.children?.length || 0,
        elkGraphEdges: elkGraph.edges?.length || 0,
        settings: validatedSettings
      });

      // Run ELK layout
      const layoutedGraph = await this.elk.layout(elkGraph);
      
      // Debug logging for ELK results
      console.log('🔍 ELK layout result:', {
        hasChildren: !!layoutedGraph.children,
        childCount: layoutedGraph.children?.length || 0,
        firstChild: layoutedGraph.children?.[0] ? {
          id: layoutedGraph.children[0].id,
          x: layoutedGraph.children[0].x,
          y: layoutedGraph.children[0].y,
          width: layoutedGraph.children[0].width,
          height: layoutedGraph.children[0].height,
          hasChildren: !!layoutedGraph.children[0].children
        } : null
      });

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

  private toElkGraph(
    nodes: Node[],
    edges: Edge[],
    settings: ELKLayoutSettings
  ): ElkNode {
    // Apply compactness to spacing
    const spacingMultiplier = 1 - settings.compactness * 0.3;
    const nodeSpacing = settings.nodeSpacing * spacingMultiplier;
    const layerSpacing = settings.layerSpacing * spacingMultiplier;
    const groupPadding = 20;
    const isHorizontal = settings.direction === 'LEFT' || settings.direction === 'RIGHT';
    
    // Use algorithm from settings (now properly typed)
    const algorithm = settings.algorithm;

    // Build hierarchy - children must be nested inside parents for ELK to handle sizing
    const nodeMap = new Map<string, any>();
    const rootChildren: any[] = [];

    // First pass: create all ELK nodes with hierarchy info
    for (const node of nodes) {
      const isGroup = node.type === 'group';
      const elkNode: any = {
        id: node.id,
        width: isGroup ? 300 : (node.measured?.width || node.width || 150),
        height: isGroup ? 200 : (node.measured?.height || node.height || 40),
        targetPosition: isHorizontal ? 'left' : 'top',
        sourcePosition: isHorizontal ? 'right' : 'bottom',
        _originalNode: node, // Preserve for later
      };

      // Group nodes need padding and layout options for children
      // IMPORTANT: Group nodes must inherit the SAME algorithm as the root graph
      // This allows ALL layout types (force, stress, mrtree, etc.) to work with hierarchy
      if (isGroup) {
        elkNode.layoutOptions = {
          // Inherit algorithm and hierarchy handling
          'elk.algorithm': algorithm,
          'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
          // Spacing inside groups - inherit from parent settings
          'elk.spacing.nodeNode': String(nodeSpacing),
          'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
          // Extra top padding for group header label, generous side padding
          'elk.padding': `[top=${groupPadding + 40},left=${groupPadding + 30},bottom=${groupPadding + 20},right=${groupPadding + 30}]`,
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

    // Build algorithm-specific options (matching V1 approach)
    const layoutOptions: Record<string, string> = {
      // Core algorithm
      'elk.algorithm': algorithm,
      'elk.direction': settings.direction,
      
      // Spacing
      'elk.spacing.nodeNode': String(nodeSpacing),
      'elk.spacing.edgeNode': String(settings.edgeNodeSpacing),
      'elk.spacing.edgeEdge': String(settings.edgeEdgeSpacing),
      'elk.spacing.componentComponent': String(settings.componentSpacing),
      
      // Edge routing
      'elk.edgeRouting': settings.edgeRouting,
      
      // Hierarchy handling
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      
      // Component handling (V1 parity)
      'elk.separateConnectedComponents': String(settings.separateComponents),
    };

    // Algorithm-specific options (matching V1's getElkOptions)
    switch (algorithm) {
      case 'layered':
        Object.assign(layoutOptions, {
          'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
          'elk.layered.spacing.edgeNodeBetweenLayers': String(settings.edgeNodeSpacing),
          'elk.layered.nodePlacement.strategy': settings.compactComponents ? 'SIMPLE' : 'NETWORK_SIMPLEX',
          'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
          'elk.layered.edgeRouting.strategy': settings.edgeRouting,
          'elk.layered.thoroughness': String(settings.thoroughness),
          'elk.layered.feedbackEdges': String(settings.feedbackEdges),
          'elk.layered.mergeEdges': 'true',
          'elk.layered.compaction.postCompaction.strategy': settings.compactComponents ? 'EDGE_LENGTH' : 'NONE',
          'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
        });
        break;
      case 'mrtree':
        Object.assign(layoutOptions, {
          'elk.mrtree.searchOrder': 'DFS',
          'elk.mrtree.weighting': 'DESCENDANTS',
          'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
          'elk.mrtree.compaction': String(settings.compactComponents),
        });
        break;
      case 'stress':
        Object.assign(layoutOptions, {
          'elk.stress.iterationLimit': '500',
          'elk.stress.epsilon': '0.0001',
          'elk.stress.desiredEdgeLength': String(layerSpacing),
          'elk.stress.dimension': 'XY',
        });
        break;
      case 'force':
        Object.assign(layoutOptions, {
          'elk.force.iterations': '300',
          'elk.force.repulsion': String(nodeSpacing / 10),
          'elk.force.attraction': String(layerSpacing / 300),
          'elk.force.model': 'FRUCHTERMAN_REINGOLD',
        });
        break;
    }

    return {
      id: 'root',
      layoutOptions,
      children: rootChildren,
      edges: elkEdges,
    };
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
        
        // Debug logging for NaN coordinates
        if (Number.isNaN(x) || Number.isNaN(y)) {
          console.error('🚨 ELK NaN coordinates for node:', elkNode.id, { x, y, elkNode });
        }
        
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
      nodeSpacing: 120,
      edgeSpacing: 20,
      fitPadding: 20,
      animationDuration: 300,
      compactness: 0.7,
      algorithm: 'layered',
      direction: 'DOWN',
      layerSpacing: 100,
      edgeRouting: 'ORTHOGONAL',
      alignment: 'CENTER',
      edgeNodeSpacing: 20,
      edgeEdgeSpacing: 15,
      compactComponents: false,
      separateComponents: false,
      componentSpacing: 60,
      thoroughness: 7,
      feedbackEdges: true,
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
