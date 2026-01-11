/**
 * Circular Layout Engine
 * Radial arrangement of nodes in a circle
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
  readonly description = 'Radial arrangement around a center point';

  calculateLayout(
    nodes: Node[],
    edges: Edge[],
    settings: CircularLayoutSettings
  ): LayoutResult {
    const startTime = performance.now();
    const validatedSettings = this.validateSettings(settings);

    if (nodes.length === 0) {
      return this.emptyResult(startTime);
    }

    // Separate nodes by hierarchy
    const { rootNodes, childNodesMap } = this.separateHierarchy(nodes);
    
    // Layout root nodes first
    const rootLayout = this.layoutRootNodes(rootNodes, validatedSettings);
    
    // Layout child nodes relative to their parents
    const positionedChildNodes: Node[] = [];
    for (const [parentId, children] of childNodesMap.entries()) {
      const parentNode = rootLayout.nodes.find(n => n.id === parentId);
      if (parentNode) {
        const childLayout = this.layoutChildNodes(children, parentNode, validatedSettings);
        positionedChildNodes.push(...childLayout.nodes);
        
        // Update parent size to contain children
        const childBounds = this.calculateBounds(childLayout.nodes, 20); // 20px padding
        const parentIndex = rootLayout.nodes.findIndex(n => n.id === parentId);
        if (parentIndex >= 0) {
          rootLayout.nodes[parentIndex] = {
            ...rootLayout.nodes[parentIndex],
            style: {
              ...rootLayout.nodes[parentIndex].style,
              width: Math.max(150, childBounds.width + 40), // Min width + padding
              height: Math.max(50, childBounds.height + 40), // Min height + padding
            },
          };
        }
      }
    }
    
    const allPositionedNodes = [...rootLayout.nodes, ...positionedChildNodes];

    const bounds = this.calculateBounds(allPositionedNodes, validatedSettings.fitPadding);

    return {
      nodes: allPositionedNodes,
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

  private separateHierarchy(nodes: Node[]): { rootNodes: Node[], childNodesMap: Map<string, Node[]> } {
    const rootNodes: Node[] = [];
    const childNodesMap: Map<string, Node[]> = new Map();

    for (const node of nodes) {
      if (!node.parent) {
        rootNodes.push(node);
      } else {
        const children = childNodesMap.get(node.parent) || [];
        children.push(node);
        childNodesMap.set(node.parent, children);
      }
    }

    return { rootNodes, childNodesMap };
  }

  private layoutRootNodes(nodes: Node[], settings: CircularLayoutSettings): LayoutResult {
    const startTime = performance.now();
    // Optionally sort nodes by connection count
    let orderedNodes = [...nodes];
    if (settings.sortByConnections) {
      const connectionCount = this.countConnections(nodes, []); // Simplified for root nodes
      orderedNodes = orderedNodes.sort(
        (a, b) => (connectionCount.get(b.id) || 0) - (connectionCount.get(a.id) || 0)
      );
    }

    // Calculate radius based on node count and spacing with edge label consideration
    const nodeWidth = 150; // Average node width
    const edgeLabelSpacing = nodeWidth * 0.875; // 87.5% = midpoint of 75-100%
    const spacingMultiplier = 1 - settings.compactness * 0.3;
    const effectiveSpacing = Math.max(edgeLabelSpacing, settings.nodeSpacing) * spacingMultiplier;
    const circumference = orderedNodes.length * effectiveSpacing;
    const autoRadius = circumference / (2 * Math.PI);
    const radius = settings.radius || Math.max(autoRadius, 100);

    // Calculate positions
    const startAngleRad = (settings.startAngle * Math.PI) / 180;
    const angleStep = (2 * Math.PI) / orderedNodes.length;
    const direction = settings.clockwise ? 1 : -1;

    const positionedNodes = orderedNodes.map((node, index) => {
      const angle = startAngleRad + direction * index * angleStep;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      return {
        ...node,
        position: { x, y },
      };
    });

    const bounds = this.calculateBounds(positionedNodes, settings.fitPadding);

    return {
      nodes: positionedNodes,
      edges: [],
      bounds,
      metadata: {
        layoutType: this.type,
        nodeCount: nodes.length,
        edgeCount: 0,
        calculationTime: performance.now() - startTime,
        converged: true,
      },
    };
  }

  private layoutChildNodes(
    children: Node[],
    parentNode: Node,
    settings: CircularLayoutSettings
  ): LayoutResult {
    const childCount = children.length;
    if (childCount === 0) {
      return { nodes: [], edges: [], bounds: { x: 0, y: 0, width: 0, height: 0 }, metadata: { layoutType: this.type, nodeCount: 0, edgeCount: 0, calculationTime: 0 } };
    }

    // Calculate spacing for edge labels
    const nodeWidth = 150;
    const edgeLabelSpacing = nodeWidth * 0.875;
    const spacingMultiplier = 1 - settings.compactness * 0.3;
    const childSpacing = Math.max(edgeLabelSpacing, settings.nodeSpacing) * spacingMultiplier;

    // Arrange children in a smaller circle around parent
    const circumference = childCount * childSpacing;
    const radius = Math.max(circumference / (2 * Math.PI), 60); // Minimum radius for children

    const startAngleRad = (settings.startAngle * Math.PI) / 180;
    const angleStep = (2 * Math.PI) / childCount;
    const direction = settings.clockwise ? 1 : -1;

    const positionedChildren = children.map((child, index) => {
      const angle = startAngleRad + direction * index * angleStep;
      const x = parentNode.position.x + radius * Math.cos(angle);
      const y = parentNode.position.y + radius * Math.sin(angle);

      return {
        ...child,
        position: { x, y },
      };
    });

    const bounds = this.calculateBounds(positionedChildren, 0);

    return {
      nodes: positionedChildren,
      edges: [],
      bounds,
      metadata: {
        layoutType: this.type,
        nodeCount: childCount,
        edgeCount: 0,
        calculationTime: 0,
        converged: true,
      },
    };
  }

  private countConnections(nodes: Node[], edges: Edge[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const node of nodes) {
      counts.set(node.id, 0);
    }
    for (const edge of edges) {
      counts.set(edge.source, (counts.get(edge.source) || 0) + 1);
      counts.set(edge.target, (counts.get(edge.target) || 0) + 1);
    }
    return counts;
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

  getDefaultSettings(): CircularLayoutSettings {
    return {
      nodeSpacing: 120,
      edgeSpacing: 20,
      fitPadding: 20,
      animationDuration: 300,
      compactness: 0.7,
      radius: undefined, // Auto-calculate
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
