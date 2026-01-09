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

    // Optionally sort nodes by connection count
    let orderedNodes = [...nodes];
    if (validatedSettings.sortByConnections) {
      const connectionCount = this.countConnections(nodes, edges);
      orderedNodes = orderedNodes.sort(
        (a, b) => (connectionCount.get(b.id) || 0) - (connectionCount.get(a.id) || 0)
      );
    }

    // Calculate radius based on node count and spacing
    const spacingMultiplier = 1 - validatedSettings.compactness * 0.3;
    const effectiveSpacing = validatedSettings.nodeSpacing * spacingMultiplier;
    const circumference = orderedNodes.length * effectiveSpacing;
    const autoRadius = circumference / (2 * Math.PI);
    const radius = validatedSettings.radius || Math.max(autoRadius, 100);

    // Calculate positions
    const startAngleRad = (validatedSettings.startAngle * Math.PI) / 180;
    const angleStep = (2 * Math.PI) / orderedNodes.length;
    const direction = validatedSettings.clockwise ? 1 : -1;

    const positionedNodes = orderedNodes.map((node, index) => {
      const angle = startAngleRad + direction * index * angleStep;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      return {
        ...node,
        position: { x, y },
      };
    });

    const bounds = this.calculateBounds(positionedNodes, validatedSettings.fitPadding);

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
