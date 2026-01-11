/**
 * Circular Layout Engine with Hierarchy Support
 * Circular arrangement with proper parent-child relationships
 */

import type { Node, Edge } from '@xyflow/react';
import { z } from 'zod';
import type { LayoutEngine, LayoutResult } from '../types';
import { LayoutType } from '../types';

// Circular Layout Settings Schema
const CircularLayoutSettings = z.object({
  // Base settings
  nodeSpacing: z.number().min(20).max(500).default(120),
  edgeSpacing: z.number().min(10).max(100).default(20),
  fitPadding: z.number().min(0).max(100).default(20),
  animationDuration: z.number().min(0).max(2000).default(300),
  compactness: z.number().min(0).max(1).default(0.7),

  // Circular-specific settings
  radius: z.number().min(50).max(1000).optional(), // Auto-calculated if not set
  startAngle: z.number().min(0).max(360).default(0),
  clockwise: z.boolean().default(true),
  sortByConnections: z.boolean().default(false), // Sort by edge count
});

type CircularLayoutSettings = z.infer<typeof CircularLayoutSettings>;

export class CircularLayoutEngine implements LayoutEngine<CircularLayoutSettings> {
  readonly type = LayoutType.CIRCULAR;
  readonly name = 'Circular Layout';
  readonly description = 'Circular arrangement with hierarchy support';

  async calculateLayout(
    nodes: Node[],
    edges: Edge[],
    settings: CircularLayoutSettings
  ): Promise<LayoutResult> {
    const startTime = performance.now();
    const validatedSettings = this.validateSettings(settings);

    console.log('🔍 DEBUG: CircularLayoutEngine.calculateLayout', { 
      nodeCount: nodes.length,
      edgeCount: edges.length 
    });

    if (nodes.length === 0) {
      return this.emptyResult(startTime);
    }

    // Separate nodes by hierarchy
    const { rootNodes, childNodesMap } = this.separateHierarchy(nodes);
    
    // Layout root nodes first
    const rootLayout = this.layoutRootNodes(rootNodes, validatedSettings);
    
    // Layout child nodes inside their parents
    const childLayouts = new Map<string, LayoutResult>();
    for (const [parentId, childNodes] of childNodesMap.entries()) {
      const childLayout = this.layoutChildNodes(childNodes, nodes.find(n => n.id === parentId)!, validatedSettings);
      childLayouts.set(parentId, childLayout);
    }

    // Combine all layouts
    const allNodes = [...rootLayout.nodes];
    const allEdges = [...rootLayout.edges];

    // Add child layouts
    for (const childLayout of childLayouts.values()) {
      allNodes.push(...childLayout.nodes);
      allEdges.push(...childLayout.edges);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    return {
      nodes: allNodes,
      edges: allEdges,
      duration,
      algorithm: 'circular-hierarchy',
    };
  }

  private separateHierarchy(nodes: Node[]): { rootNodes: Node[]; childNodesMap: Map<string, Node[]> } {
    const rootNodes: Node[] = [];
    const childNodesMap = new Map<string, Node[]>();

    for (const node of nodes) {
      // Check if node has a parent
      const parentId = node.parentNode;
      if (parentId) {
        // This is a child node
        if (!childNodesMap.has(parentId)) {
          childNodesMap.set(parentId, []);
        }
        childNodesMap.get(parentId)!.push(node);
      } else {
        // This is a root node
        rootNodes.push(node);
      }
    }

    return { rootNodes, childNodesMap };
  }

  private layoutRootNodes(nodes: Node[], settings: CircularLayoutSettings): LayoutResult {
    const startTime = performance.now();
    
    // Optionally sort nodes by connection count
    let orderedNodes = [...nodes];
    if (settings.sortByConnections) {
      // This would require edge information, for now keep original order
    }

    const nodeCount = orderedNodes.length;
    const radius = settings.radius || (Math.max(100, nodeCount * settings.nodeSpacing / 2));
    
    const angleStep = (2 * Math.PI) / nodeCount;
    const startAngleRad = (settings.startAngle * Math.PI) / 180;
    const direction = settings.clockwise ? 1 : -1;

    const layoutedNodes = orderedNodes.map((node, index) => {
      const angle = startAngleRad + direction * index * angleStep;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      return {
        ...node,
        position: { x, y },
      };
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    return {
      nodes: layoutedNodes,
      edges: [], // Root layout doesn't handle edges
      duration,
      algorithm: 'circular-root',
    };
  }

  private layoutChildNodes(
    children: Node[],
    parentNode: Node,
    settings: CircularLayoutSettings
  ): LayoutResult {
    const startTime = performance.now();
    
    if (children.length === 0) {
      return {
        nodes: [],
        edges: [],
        duration: 0,
        algorithm: 'circular-empty',
      };
    }

    // Layout children in a smaller circle inside the parent
    const childCount = children.length;
    const parentRadius = 50; // Approximate parent node radius
    const childRadius = Math.max(20, (parentRadius - 20) / 2);
    
    const angleStep = (2 * Math.PI) / childCount;
    const startAngleRad = 0; // Start from top for children
    const direction = 1; // Always clockwise for children

    const layoutedNodes = children.map((child, index) => {
      const angle = startAngleRad + direction * index * angleStep;
      const x = Math.cos(angle) * childRadius;
      const y = Math.sin(angle) * childRadius;

      return {
        ...child,
        position: { x, y },
        // Ensure child is properly parented
        parentNode: parentNode.id,
        extent: 'parent' as const,
      };
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    return {
      nodes: layoutedNodes,
      edges: [], // Child layout doesn't handle edges
      duration,
      algorithm: 'circular-children',
    };
  }

  private emptyResult(startTime: number): LayoutResult {
    return {
      nodes: [],
      edges: [],
      duration: performance.now() - startTime,
      algorithm: 'circular-empty',
    };
  }

  getDefaultSettings(): CircularLayoutSettings {
    return {
      nodeSpacing: 120,
      edgeSpacing: 20,
      fitPadding: 20,
      animationDuration: 300,
      compactness: 0.7,
      radius: undefined,
      startAngle: 0,
      clockwise: true,
      sortByConnections: false,
    };
  }

  validateSettings(settings: Partial<CircularLayoutSettings>): CircularLayoutSettings {
    return CircularLayoutSettings.parse({
      ...this.getDefaultSettings(),
      ...settings,
    });
  }

  getSettingsSchema() {
    return CircularLayoutSettings;
  }
}
