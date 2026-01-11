/**
 * Organic Layout Engine
 * Natural clustering layout with organic spacing
 */

import type { Node, Edge } from '@xyflow/react';
import { z } from 'zod';
import type { LayoutEngine, LayoutResult } from '../types';
import { LayoutType } from '../types';

// Organic Layout Settings Schema
const OrganicLayoutSettings = z.object({
  // Base settings
  nodeSpacing: z.number().min(20).max(500).default(120),
  edgeSpacing: z.number().min(10).max(100).default(20),
  fitPadding: z.number().min(0).max(100).default(20),
  animationDuration: z.number().min(0).max(2000).default(300),
  compactness: z.number().min(0).max(1).default(0.7),

  // Organic-specific settings
  clustering: z.boolean().default(true), // Group connected nodes
  clusterSpacing: z.number().min(50).max(300).default(150), // Space between clusters
  organicity: z.number().min(0).max(1).default(0.8), // Randomness factor
  iterations: z.number().min(50).max(300).default(150),
});

type OrganicLayoutSettings = z.infer<typeof OrganicLayoutSettings>;

interface ClusterNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  cluster: number;
  width: number;
  height: number;
}

export class OrganicLayoutEngine implements LayoutEngine<OrganicLayoutSettings> {
  readonly type = LayoutType.ORGANIC;
  readonly name = 'Organic Layout';
  readonly description = 'Natural clustering with organic spacing';

  calculateLayout(
    nodes: Node[],
    edges: Edge[],
    settings: OrganicLayoutSettings
  ): LayoutResult {
    const startTime = performance.now();
    const validatedSettings = this.validateSettings(settings);

    if (nodes.length === 0) {
      return this.emptyResult(startTime);
    }

    // Separate nodes by hierarchy
    const { rootNodes, childNodesMap } = this.separateHierarchy(nodes);
    
    // Layout root nodes first
    const rootLayout = this.layoutRootNodes(rootNodes, edges, validatedSettings);
    
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

  private layoutChildNodes(
    children: Node[],
    parentNode: Node,
    settings: OrganicLayoutSettings
  ): LayoutResult {
    // Layout children in a compact organic arrangement around parent
    const childCount = children.length;
    if (childCount === 0) {
      return { nodes: [], edges: [], bounds: { x: 0, y: 0, width: 0, height: 0 }, metadata: { layoutType: this.type, nodeCount: 0, edgeCount: 0, calculationTime: 0, converged: true } };
    }

    // Calculate spacing for edge labels (75-100% of node width)
    const nodeWidth = 150; // Average node width
    const edgeLabelSpacing = nodeWidth * 0.875; // 87.5% = midpoint of 75-100%
    const spacingMultiplier = 1 - settings.compactness * 0.3;
    const childSpacing = Math.max(edgeLabelSpacing, settings.nodeSpacing) * spacingMultiplier;

    // Arrange children in a circle around parent
    const radius = Math.max(childSpacing * 2, 100); // Minimum radius for visibility
    const positionedChildren = children.map((child, index) => {
      const angle = (2 * Math.PI * index) / childCount;
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

  private separateHierarchy(nodes: Node[]): { rootNodes: Node[], childNodesMap: Map<string, Node[]> } {
    const rootNodes: Node[] = [];
    const childNodesMap: Map<string, Node[]> = new Map();

    for (const node of nodes) {
      if (!node.parentId) {
        rootNodes.push(node);
      } else {
        const children = childNodesMap.get(node.parentId) || [];
        children.push(node);
        childNodesMap.set(node.parentId, children);
      }
    }

    return { rootNodes, childNodesMap };
  }

  private layoutRootNodes(
    nodes: Node[],
    edges: Edge[],
    settings: OrganicLayoutSettings
  ): LayoutResult {
    const startTime = performance.now();
    // Build adjacency list
    const adjacency = this.buildAdjacency(nodes, edges);

    // Find clusters using connected components
    const clusters = settings.clustering
      ? this.findClusters(nodes, adjacency)
      : new Map(nodes.map((n, i) => [n.id, i]));

    // Initialize nodes with cluster-aware positions
    const clusterNodes = this.initializeWithClusters(nodes, clusters, settings);

    // Run organic simulation
    this.runOrganicSimulation(clusterNodes, adjacency, settings);

    // Convert back to ReactFlow nodes
    const positionedNodes = nodes.map((node) => {
      const clusterNode = clusterNodes.find((cn) => cn.id === node.id);
      if (!clusterNode) return node;
      return {
        ...node,
        position: { x: clusterNode.x, y: clusterNode.y },
      };
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

  private buildAdjacency(nodes: Node[], edges: Edge[]): Map<string, Set<string>> {
    const adjacency = new Map<string, Set<string>>();
    for (const node of nodes) {
      adjacency.set(node.id, new Set());
    }
    for (const edge of edges) {
      adjacency.get(edge.source)?.add(edge.target);
      adjacency.get(edge.target)?.add(edge.source);
    }
    return adjacency;
  }

  private findClusters(nodes: Node[], adjacency: Map<string, Set<string>>): Map<string, number> {
    const clusters = new Map<string, number>();
    const visited = new Set<string>();
    let clusterIndex = 0;

    for (const node of nodes) {
      if (visited.has(node.id)) continue;

      // BFS to find connected component
      const queue = [node.id];
      while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        clusters.set(nodeId, clusterIndex);

        const neighbors = adjacency.get(nodeId);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              queue.push(neighbor);
            }
          }
        }
      }
      clusterIndex++;
    }

    return clusters;
  }

  private initializeWithClusters(
    nodes: Node[],
    clusters: Map<string, number>,
    settings: OrganicLayoutSettings
  ): ClusterNode[] {
    // Count nodes per cluster
    const clusterCounts = new Map<number, number>();
    for (const cluster of clusters.values()) {
      clusterCounts.set(cluster, (clusterCounts.get(cluster) || 0) + 1);
    }
    const numClusters = clusterCounts.size;

    // Position cluster centers in a circle
    const clusterRadius = numClusters > 1 ? settings.clusterSpacing * Math.sqrt(numClusters) : 0;
    const clusterCenters = new Map<number, { x: number; y: number }>();

    const uniqueClusters = Array.from(new Set(clusters.values()));
    uniqueClusters.forEach((cluster, index) => {
      const angle = (2 * Math.PI * index) / numClusters;
      clusterCenters.set(cluster, {
        x: clusterRadius * Math.cos(angle),
        y: clusterRadius * Math.sin(angle),
      });
    });

    // Initialize nodes around their cluster centers with organic randomness
    const clusterIndexes = new Map<number, number>();
    return nodes.map((node) => {
      const cluster = clusters.get(node.id) || 0;
      const center = clusterCenters.get(cluster) || { x: 0, y: 0 };
      const clusterSize = clusterCounts.get(cluster) || 1;

      // Position within cluster
      const nodeIndex = clusterIndexes.get(cluster) || 0;
      clusterIndexes.set(cluster, nodeIndex + 1);

      const localRadius = Math.sqrt(clusterSize) * settings.nodeSpacing * 0.5;
      const localAngle = (2 * Math.PI * nodeIndex) / clusterSize;

      // Add organic randomness
      const randomOffset = settings.organicity * 30;
      const randomX = (Math.random() - 0.5) * randomOffset;
      const randomY = (Math.random() - 0.5) * randomOffset;

      return {
        id: node.id,
        x: center.x + localRadius * Math.cos(localAngle) + randomX,
        y: center.y + localRadius * Math.sin(localAngle) + randomY,
        vx: 0,
        vy: 0,
        cluster,
        width: node.measured?.width || node.width || 150,
        height: node.measured?.height || node.height || 40,
      };
    });
  }

  private runOrganicSimulation(
    nodes: ClusterNode[],
    adjacency: Map<string, Set<string>>,
    settings: OrganicLayoutSettings
  ): void {
    const spacingMultiplier = 1 - settings.compactness * 0.3;
    const idealDistance = settings.nodeSpacing * spacingMultiplier;
    const cooling = 0.92;

    for (let iteration = 0; iteration < settings.iterations; iteration++) {
      const temperature = 1 - iteration / settings.iterations;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        let fx = 0;
        let fy = 0;

        // Forces from other nodes
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const other = nodes[j];

          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Repulsion - stronger within same cluster
          const sameCluster = node.cluster === other.cluster;
          const repulsionFactor = sameCluster ? 1.5 : 1;
          const repulsion = ((idealDistance * idealDistance) / dist) * repulsionFactor;
          fx += (dx / dist) * repulsion;
          fy += (dy / dist) * repulsion;

          // Overlap prevention
          const minDist = Math.max(node.width, node.height, other.width, other.height) / 2 + 20;
          if (dist < minDist) {
            const overlap = minDist - dist;
            fx += (dx / dist) * overlap * 3;
            fy += (dy / dist) * overlap * 3;
          }
        }

        // Attraction along edges (stronger for organic feel)
        const neighbors = adjacency.get(node.id);
        if (neighbors) {
          for (const neighborId of neighbors) {
            const neighbor = nodes.find((n) => n.id === neighborId);
            if (!neighbor) continue;

            const dx = neighbor.x - node.x;
            const dy = neighbor.y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            // Pull toward ideal distance
            const displacement = dist - idealDistance;
            const attraction = displacement * 0.15;
            fx += (dx / dist) * attraction;
            fy += (dy / dist) * attraction;
          }
        }

        // Organic jitter - decreases over time
        if (settings.organicity > 0) {
          const jitter = settings.organicity * 5 * temperature;
          fx += (Math.random() - 0.5) * jitter;
          fy += (Math.random() - 0.5) * jitter;
        }

        // Update velocity
        node.vx = (node.vx + fx * temperature) * cooling;
        node.vy = (node.vy + fy * temperature) * cooling;

        // Clamp velocity
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > 30) {
          node.vx = (node.vx / speed) * 30;
          node.vy = (node.vy / speed) * 30;
        }
      }

      // Update positions
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
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

  getDefaultSettings(): OrganicLayoutSettings {
    return {
      nodeSpacing: 120,
      edgeSpacing: 20,
      fitPadding: 20,
      animationDuration: 300,
      compactness: 0.7,
      clustering: true,
      clusterSpacing: 150,
      organicity: 0.8,
      iterations: 150,
    };
  }

  validateSettings(settings: Partial<OrganicLayoutSettings>): OrganicLayoutSettings {
    return OrganicLayoutSettings.parse({
      ...this.getDefaultSettings(),
      ...settings,
    });
  }

  getSettingsSchema() {
    return OrganicLayoutSettings;
  }
}
