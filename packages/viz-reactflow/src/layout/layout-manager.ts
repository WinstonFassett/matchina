/**
 * Layout Manager
 * Coordinator for layout engines - routes all layout types through ELK
 */

import type { Edge, Node } from '@xyflow/react';
import { ELKLayoutEngine } from './engines/elk-layout-engine';
import {
  ILayoutManager,
  LayoutEngine,
  LayoutResult,
  LayoutType,
} from './types';

export class LayoutManager implements ILayoutManager {
  private engines = new Map<LayoutType, LayoutEngine>();

  constructor() {
    // Register ELK engine for all layouts
    this.registerEngine(new ELKLayoutEngine());
  }

  // Engine management
  registerEngine(engine: LayoutEngine): void {
    this.engines.set(engine.type, engine);
  }

  getEngine(type: LayoutType): LayoutEngine | undefined {
    return this.engines.get(type);
  }

  getAvailableEngines(): LayoutEngine[] {
    return [...this.engines.values()];
  }

  // Map layout types to ELK algorithms for hierarchy support
  // V1 uses ELK for ALL layout types - this is what allows proper group node sizing
  private static readonly ELK_ALGORITHM_MAP: Partial<Record<LayoutType, string>> = {
    [LayoutType.HIERARCHICAL]: 'layered',  // Sugiyama layered algorithm
    [LayoutType.TREE]: 'mrtree',            // Tree layout algorithm
    [LayoutType.FORCE_DIRECTED]: 'force',  // Force-directed algorithm
    [LayoutType.ORGANIC]: 'stress',        // Stress majorization algorithm
  };

  // Layout calculation - supports async engines
  // Routes ELK-based layouts through ELK engine (like V1 does for all layouts)
  // eslint-disable-next-line require-await
  async calculateLayout(
    type: LayoutType,
    nodes: Node[],
    edges: Edge[],
    settings: Record<string, unknown>
  ): Promise<LayoutResult> {
    // Special handling for ORGANIC layout - depth-first bottom-up approach
    if (type === LayoutType.ORGANIC) {
      return this.calculateOrganicLayoutDepthFirst(nodes, edges, settings);
    }
    
    const elkAlgorithm = LayoutManager.ELK_ALGORITHM_MAP[type];
    
    // Route through ELK if this layout type has an ELK algorithm mapping
    // This matches V1 behavior where ALL these layouts use ELK
    if (elkAlgorithm) {
      const elkEngine = this.getEngine(LayoutType.HIERARCHICAL);
      if (elkEngine) {
        // Transform settings to match ELK schema requirements
        const elkSettings: Record<string, unknown> = { ...settings, algorithm: elkAlgorithm };
        
        const validatedSettings = elkEngine.validateSettings(elkSettings);
        return elkEngine.calculateLayout(nodes, edges, validatedSettings);
      }
    }

    // Use custom engines for layouts without ELK mapping (Grid)
    const engine = this.getEngine(type);
    if (!engine) {
      throw new Error(`No layout engine found for type: ${type}`);
    }

    const validatedSettings = engine.validateSettings(settings);
    const result = engine.calculateLayout(nodes, edges, validatedSettings);
    
    // Handle both sync and async results
    return result;
  }

  // ============================================================================
  // HIERARCHICAL WRAPPER FOR ORGANIC LAYOUT
  // Depth-first bottom-up processing with proper coordinate transposition
  // ============================================================================

  // Depth-first bottom-up layout for ORGANIC layout
  private async calculateOrganicLayoutDepthFirst(
    nodes: Node[],
    edges: Edge[],
    settings: Record<string, unknown>
  ): Promise<LayoutResult> {
    console.log('🌳 ORGANIC LAYOUT: Starting hierarchical processing');
    
    const elkEngine = this.getEngine(LayoutType.HIERARCHICAL);
    if (!elkEngine) {
      throw new Error('ELK engine not available for organic layout');
    }

    // STEP 1: Build hierarchy tree from flat node list
    const { roots, nodeMap } = this.buildHierarchyTree(nodes);
    
    // STEP 2: Depth-first layout from leaves to root
    await this.layoutHierarchyDepthFirst(roots, edges, settings, elkEngine);
    
    // STEP 3: Assemble final result with proper positions and dimensions
    const result = this.assembleHierarchyResult(roots, nodeMap, edges);
    
    console.log(`🌳 ORGANIC LAYOUT: Complete - ${result.nodes.length} nodes processed`);
    return result;
  }

  // Build a tree structure from the flat node list
  private buildHierarchyTree(nodes: Node[]): { 
    roots: { id: string; node: Node; children: any[]; parent: any | null; layoutedPosition?: { x: number; y: number }; calculatedDimensions?: { width: number; height: number } }[]; 
    nodeMap: Map<string, { id: string; node: Node; children: any[]; parent: any | null; layoutedPosition?: { x: number; y: number }; calculatedDimensions?: { width: number; height: number } }> 
  } {
    type HNode = { id: string; node: Node; children: HNode[]; parent: HNode | null; layoutedPosition?: { x: number; y: number }; calculatedDimensions?: { width: number; height: number } };
    
    const nodeMap = new Map<string, HNode>();
    
    // First pass: create HierarchyNode for each node
    for (const node of nodes) {
      nodeMap.set(node.id, {
        id: node.id,
        node,
        children: [],
        // eslint-disable-next-line unicorn/no-null
        parent: null,
      });
    }
    
    // Second pass: establish parent-child relationships
    const roots: HNode[] = [];
    for (const node of nodes) {
      const hNode = nodeMap.get(node.id)!;
      const parentId = (node as any).parentId;
      
      if (parentId && nodeMap.has(parentId)) {
        const parentHNode = nodeMap.get(parentId)!;
        hNode.parent = parentHNode;
        parentHNode.children.push(hNode);
      } else {
        roots.push(hNode);
      }
    }
    
    return { roots, nodeMap };
  }

  // Depth-first layout: process children before parents
  private async layoutHierarchyDepthFirst(
    hNodes: { id: string; node: Node; children: any[]; parent: any | null; layoutedPosition?: { x: number; y: number }; calculatedDimensions?: { width: number; height: number } }[],
    allEdges: Edge[],
    settings: Record<string, unknown>,
    elkEngine: any
  ): Promise<void> {
    type HNode = { id: string; node: Node; children: HNode[]; parent: HNode | null; layoutedPosition?: { x: number; y: number }; calculatedDimensions?: { width: number; height: number } };
    
    for (const hNode of hNodes as HNode[]) {
      // RECURSIVE: Process children first (depth-first)
      if (hNode.children.length > 0) {
        await this.layoutHierarchyDepthFirst(hNode.children, allEdges, settings, elkEngine);
        
        // After children are laid out, calculate this parent's dimensions
        const childDimensions = this.calculateChildrenBoundingBox(hNode.children);
        hNode.calculatedDimensions = childDimensions;
      } else {
        // Leaf node: use default dimensions
        const width = Number(hNode.node.style?.width) || 150;
        const height = Number(hNode.node.style?.height) || 50;
        hNode.calculatedDimensions = { width, height };
      }
    }
    
    // Now layout these nodes at this level using organic (stress) algorithm
    if (hNodes.length > 0) {
      const levelNodes = (hNodes as HNode[]).map(h => ({
        ...h.node,
        style: {
          ...h.node.style,
          width: h.calculatedDimensions?.width || 150,
          height: h.calculatedDimensions?.height || 50,
        }
      }));
      
      // Filter edges to only those between nodes at this level
      const levelNodeIds = new Set(levelNodes.map(n => n.id));
      const levelEdges = allEdges.filter(e => 
        levelNodeIds.has(e.source) && levelNodeIds.has(e.target)
      );
      
      console.log(`🌳 Laying out ${levelNodes.length} nodes at this level with stress algorithm`);
      
      // Use stress algorithm WITHOUT hierarchy handling
      const stressSettings = {
        ...settings,
        algorithm: 'stress',
        'elk.hierarchyHandling': 'NONE',
      };
      
      const validatedSettings = elkEngine.validateSettings(stressSettings);
      const result = await elkEngine.calculateLayout(levelNodes, levelEdges, validatedSettings);
      
      // Store the layouted positions
      for (const layoutedNode of result.nodes) {
        const hNode = (hNodes as HNode[]).find(h => h.id === layoutedNode.id);
        if (hNode) {
          hNode.layoutedPosition = layoutedNode.position;
        }
      }
    }
  }

  // Calculate bounding box of children after they've been laid out
  private calculateChildrenBoundingBox(
    children: { id: string; node: Node; children: any[]; parent: any | null; layoutedPosition?: { x: number; y: number }; calculatedDimensions?: { width: number; height: number } }[]
  ): { width: number; height: number } {
    if (children.length === 0) {
      return { width: 150, height: 50 };
    }
    
    let minX = Number.POSITIVE_INFINITY; let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY; let maxY = Number.NEGATIVE_INFINITY;
    
    for (const child of children) {
      const pos = child.layoutedPosition || { x: 0, y: 0 };
      const dims = child.calculatedDimensions || { width: 150, height: 50 };
      
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + dims.width);
      maxY = Math.max(maxY, pos.y + dims.height);
    }
    
    // Add padding for parent container (header + margins)
    const paddingTop = 60;  // Space for group header
    const paddingBottom = 30;
    const paddingLeft = 30;
    const paddingRight = 30;
    
    return {
      width: (maxX - minX) + paddingLeft + paddingRight,
      height: (maxY - minY) + paddingTop + paddingBottom
    };
  }

  // Assemble the final result from the hierarchy tree
  private assembleHierarchyResult(
    roots: { id: string; node: Node; children: any[]; parent: any | null; layoutedPosition?: { x: number; y: number }; calculatedDimensions?: { width: number; height: number } }[],
    nodeMap: Map<string, { id: string; node: Node; children: any[]; parent: any | null; layoutedPosition?: { x: number; y: number }; calculatedDimensions?: { width: number; height: number } }>,
    edges: Edge[]
  ): LayoutResult {
    type HNode = { id: string; node: Node; children: HNode[]; parent: HNode | null; layoutedPosition?: { x: number; y: number }; calculatedDimensions?: { width: number; height: number } };
    
    const finalNodes: Node[] = [];
    
    // Recursive function to process nodes and transpose children
    const defaultOffset = { x: 0, y: 0 };
    const processNode = (hNode: HNode, parentOffset = defaultOffset) => {
      const pos = hNode.layoutedPosition || { x: 0, y: 0 };
      const dims = hNode.calculatedDimensions || { width: 150, height: 50 };
      
      // For root nodes: use absolute position
      // For child nodes: position is relative to parent (ReactFlow handles this)
      let finalPosition: { x: number; y: number };
      
      if (hNode.parent) {
        // Child node: transpose to be relative to parent's content area
        // Children need to be positioned inside the parent's padding area
        const paddingTop = 60;
        const paddingLeft = 30;
        
        // Normalize positions so children start at the padding offset
        const siblings = hNode.parent.children;
        const siblingPositions = siblings.map(s => s.layoutedPosition || { x: 0, y: 0 });
        const minSiblingX = Math.min(...siblingPositions.map(p => p.x));
        const minSiblingY = Math.min(...siblingPositions.map(p => p.y));
        
        finalPosition = {
          x: (pos.x - minSiblingX) + paddingLeft,
          y: (pos.y - minSiblingY) + paddingTop
        };
      } else {
        // Root node: absolute position
        finalPosition = { x: pos.x, y: pos.y };
      }
      
      // Create the final node
      const finalNode: Node = {
        ...hNode.node,
        position: finalPosition,
        style: {
          ...hNode.node.style,
          width: dims.width,
          height: dims.height,
        }
      };
      
      finalNodes.push(finalNode);
      
      // Process children
      for (const child of hNode.children) {
        processNode(child, finalPosition);
      }
    };
    
    // RESOLVE OVERLAPS FIRST: Push overlapping nodes outside group containers
    // This must happen BEFORE processNode so corrected positions are used
    console.log('🔴 OVERLAP RESOLUTION: Checking root node positions');
    this.resolveRootNodeOverlaps(roots as HNode[]);
    
    // DIAGNOSTIC: Show positions after overlap resolution
    console.log('🔴 DIAGNOSTIC: Root node positions after overlap resolution:');
    for (const root of roots as HNode[]) {
      const pos = root.layoutedPosition || { x: 0, y: 0 };
      const dims = root.calculatedDimensions || { width: 150, height: 50 };
      console.log(`🔴 ${root.id}: pos=(${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}) dims=(${dims.width.toFixed(0)}x${dims.height.toFixed(0)})`);
    }
    
    // Process all roots with corrected positions
    for (const root of roots as HNode[]) {
      processNode(root);
    }
    
    // Calculate bounds
    const bounds = this.calculateLayoutBounds(finalNodes, 20);
    
    return {
      nodes: finalNodes,
      edges,
      bounds,
      metadata: {
        layoutType: LayoutType.ORGANIC,
        nodeCount: finalNodes.length,
        edgeCount: edges.length,
        calculationTime: 0, // Will be updated by caller
        converged: true,
      }
    };
  }

  // Resolve overlaps between root nodes - push small nodes outside large group containers
  private resolveRootNodeOverlaps(
    roots: { id: string; node: Node; children: any[]; parent: any | null; layoutedPosition?: { x: number; y: number }; calculatedDimensions?: { width: number; height: number } }[]
  ): void {
    const padding = 40; // Spacing between nodes after resolution
    
    // Find all group nodes (containers with children)
    const groupNodes = roots.filter(r => r.children.length > 0);
    const leafNodes = roots.filter(r => r.children.length === 0);
    
    for (const group of groupNodes) {
      const groupPos = group.layoutedPosition || { x: 0, y: 0 };
      const groupDims = group.calculatedDimensions || { width: 150, height: 50 };
      const groupBounds = {
        left: groupPos.x,
        top: groupPos.y,
        right: groupPos.x + groupDims.width,
        bottom: groupPos.y + groupDims.height,
        centerX: groupPos.x + groupDims.width / 2,
        centerY: groupPos.y + groupDims.height / 2
      };
      
      for (const leaf of leafNodes) {
        const leafPos = leaf.layoutedPosition || { x: 0, y: 0 };
        const leafDims = leaf.calculatedDimensions || { width: 150, height: 50 };
        
        // Check if leaf overlaps with group
        const overlapsX = leafPos.x < groupBounds.right && leafPos.x + leafDims.width > groupBounds.left;
        const overlapsY = leafPos.y < groupBounds.bottom && leafPos.y + leafDims.height > groupBounds.top;
        
        if (overlapsX && overlapsY) {
          console.log(`🔴 FIXING OVERLAP: Moving ${leaf.id} outside ${group.id}`);
          
          // Calculate leaf center
          const leafCenterX = leafPos.x + leafDims.width / 2;
          const leafCenterY = leafPos.y + leafDims.height / 2;
          
          // Determine which direction to push the leaf based on where it's positioned
          // relative to the group center
          const dx = leafCenterX - groupBounds.centerX;
          const dy = leafCenterY - groupBounds.centerY;
          
          // Determine the shortest path out of the group
          const distToLeft = leafPos.x - groupBounds.left;
          const distToRight = groupBounds.right - (leafPos.x + leafDims.width);
          const distToTop = leafPos.y - groupBounds.top;
          const distToBottom = groupBounds.bottom - (leafPos.y + leafDims.height);
          
          // Find minimum distance (which edge is closest)
          const minDist = Math.min(
            Math.abs(distToLeft), 
            Math.abs(distToRight), 
            Math.abs(distToTop), 
            Math.abs(distToBottom)
          );
          
          let newX = leafPos.x;
          let newY = leafPos.y;
          
          // Push to the nearest edge
          if (Math.abs(distToRight) === minDist || dx > 0) {
            // Push right
            newX = groupBounds.right + padding;
            console.log(`🔴 Pushing ${leaf.id} RIGHT to x=${newX.toFixed(0)}`);
          } else if (Math.abs(distToLeft) === minDist || dx < 0) {
            // Push left
            newX = groupBounds.left - leafDims.width - padding;
            console.log(`🔴 Pushing ${leaf.id} LEFT to x=${newX.toFixed(0)}`);
          } else if (Math.abs(distToBottom) === minDist || dy > 0) {
            // Push down
            newY = groupBounds.bottom + padding;
            console.log(`🔴 Pushing ${leaf.id} DOWN to y=${newY.toFixed(0)}`);
          } else {
            // Push up
            newY = groupBounds.top - leafDims.height - padding;
            console.log(`🔴 Pushing ${leaf.id} UP to y=${newY.toFixed(0)}`);
          }
          
          // Update the leaf position
          leaf.layoutedPosition = { x: newX, y: newY };
          console.log(`🔴 ${leaf.id} new position: (${newX.toFixed(0)}, ${newY.toFixed(0)})`);
        }
      }
    }
  }

  // Calculate layout bounds
  private calculateLayoutBounds(nodes: Node[], padding: number): { x: number; y: number; width: number; height: number } {
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    // Only consider root nodes for bounds calculation
    const rootNodes = nodes.filter(n => !(n as any).parentId);
    
    let minX = Number.POSITIVE_INFINITY; let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY; let maxY = Number.NEGATIVE_INFINITY;
    
    for (const node of rootNodes) {
      const x = node.position.x;
      const y = node.position.y;
      const width = Number(node.style?.width) || 150;
      const height = Number(node.style?.height) || 50;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    }
    
    return {
      x: minX - padding,
      y: minY - padding,
      width: (maxX - minX) + padding * 2,
      height: (maxY - minY) + padding * 2
    };
  }
}

// Singleton instance
export const layoutManager = new LayoutManager();
