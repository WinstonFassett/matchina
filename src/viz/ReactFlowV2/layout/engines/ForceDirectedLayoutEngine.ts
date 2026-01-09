/**
 * Force-Directed Layout Engine
 * Physics-based layout using force simulation
 */

import type { Node, Edge } from '@xyflow/react';
import { z } from 'zod';
import type { LayoutEngine, LayoutResult } from '../types';
import { LayoutType } from '../types';

// Force-Directed Layout Settings Schema
const ForceDirectedLayoutSettings = z.object({
  // Base settings
  nodeSpacing: z.number().min(20).max(500).default(120),
  edgeSpacing: z.number().min(10).max(100).default(20),
  fitPadding: z.number().min(0).max(100).default(20),
  animationDuration: z.number().min(0).max(2000).default(300),
  compactness: z.number().min(0).max(1).default(0.7),

  // Force-specific settings
  repulsionStrength: z.number().min(10).max(500).default(150), // Node repulsion
  attractionStrength: z.number().min(0.01).max(1).default(0.1), // Edge attraction
  linkDistance: z.number().min(50).max(400).default(120), // Ideal edge length
  iterations: z.number().min(50).max(500).default(200), // Simulation steps
  preventOverlap: z.boolean().default(true),
  gravity: z.number().min(0).max(1).default(0.1), // Pull toward center
});

type ForceDirectedLayoutSettings = z.infer<typeof ForceDirectedLayoutSettings>;

interface ForceNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
}

export class ForceDirectedLayoutEngine implements LayoutEngine<ForceDirectedLayoutSettings> {
  readonly type = LayoutType.FORCE_DIRECTED;
  readonly name = 'Force-Directed Layout';
  readonly description = 'Physics-based clustering using force simulation';

  calculateLayout(
    nodes: Node[],
    edges: Edge[],
    settings: ForceDirectedLayoutSettings
  ): LayoutResult {
    const startTime = performance.now();
    const validatedSettings = this.validateSettings(settings);

    if (nodes.length === 0) {
      return this.emptyResult(startTime);
    }

    // Initialize force nodes with random positions
    const forceNodes = this.initializeNodes(nodes);

    // Build edge map
    const edgeMap = this.buildEdgeMap(edges);

    // Run force simulation
    this.runSimulation(forceNodes, edgeMap, validatedSettings);

    // Convert back to ReactFlow nodes
    const positionedNodes = nodes.map((node) => {
      const forceNode = forceNodes.find((fn) => fn.id === node.id);
      return {
        ...node,
        position: forceNode ? { x: forceNode.x, y: forceNode.y } : node.position,
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

  private initializeNodes(nodes: Node[]): ForceNode[] {
    // Initialize nodes in a circle to avoid clustering
    const radius = Math.sqrt(nodes.length) * 50;
    return nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      return {
        id: node.id,
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        width: node.measured?.width || node.width || 150,
        height: node.measured?.height || node.height || 40,
      };
    });
  }

  private buildEdgeMap(edges: Edge[]): Map<string, Set<string>> {
    const edgeMap = new Map<string, Set<string>>();
    for (const edge of edges) {
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, new Set());
      }
      if (!edgeMap.has(edge.target)) {
        edgeMap.set(edge.target, new Set());
      }
      edgeMap.get(edge.source)!.add(edge.target);
      edgeMap.get(edge.target)!.add(edge.source);
    }
    return edgeMap;
  }

  private runSimulation(
    nodes: ForceNode[],
    edgeMap: Map<string, Set<string>>,
    settings: ForceDirectedLayoutSettings
  ): void {
    const cooling = 0.95; // Velocity damping
    const minVelocity = 0.1;
    const spacingMultiplier = 1 - settings.compactness * 0.3;
    const linkDistance = settings.linkDistance * spacingMultiplier;

    for (let iteration = 0; iteration < settings.iterations; iteration++) {
      // Temperature decreases over time
      const temperature = 1 - iteration / settings.iterations;

      // Apply forces
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        let fx = 0;
        let fy = 0;

        // Repulsion from all other nodes
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Repulsion force (inverse square law)
          const repulsion =
            (settings.repulsionStrength * settings.repulsionStrength) / dist;
          fx += (dx / dist) * repulsion;
          fy += (dy / dist) * repulsion;

          // Overlap prevention
          if (settings.preventOverlap) {
            const minDist = (node.width + other.width) / 2 + 20;
            if (dist < minDist) {
              const overlap = minDist - dist;
              fx += (dx / dist) * overlap * 2;
              fy += (dy / dist) * overlap * 2;
            }
          }
        }

        // Attraction along edges
        const connected = edgeMap.get(node.id);
        if (connected) {
          for (const otherId of connected) {
            const other = nodes.find((n) => n.id === otherId);
            if (!other) continue;

            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            // Spring force toward ideal distance
            const displacement = dist - linkDistance;
            const attraction = displacement * settings.attractionStrength;
            fx += (dx / dist) * attraction;
            fy += (dy / dist) * attraction;
          }
        }

        // Gravity toward center
        fx -= node.x * settings.gravity;
        fy -= node.y * settings.gravity;

        // Apply temperature and update velocity
        node.vx = (node.vx + fx * temperature) * cooling;
        node.vy = (node.vy + fy * temperature) * cooling;

        // Clamp velocity
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > 50) {
          node.vx = (node.vx / speed) * 50;
          node.vy = (node.vy / speed) * 50;
        }
      }

      // Update positions
      let totalMovement = 0;
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        totalMovement += Math.abs(node.vx) + Math.abs(node.vy);
      }

      // Early exit if converged
      if (totalMovement / nodes.length < minVelocity && iteration > 50) {
        break;
      }
    }
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

  getDefaultSettings(): ForceDirectedLayoutSettings {
    return {
      nodeSpacing: 120,
      edgeSpacing: 20,
      fitPadding: 20,
      animationDuration: 300,
      compactness: 0.7,
      repulsionStrength: 150,
      attractionStrength: 0.1,
      linkDistance: 120,
      iterations: 200,
      preventOverlap: true,
      gravity: 0.1,
    };
  }

  validateSettings(settings: Partial<ForceDirectedLayoutSettings>): ForceDirectedLayoutSettings {
    return ForceDirectedLayoutSettings.parse({
      ...this.getDefaultSettings(),
      ...settings,
    });
  }

  getSettingsSchema() {
    return ForceDirectedLayoutSettings;
  }
}
