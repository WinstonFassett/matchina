/**
 * Layout Manager
 * Simplified coordinator for layout engines and presets
 * NO analysis system - just basic management
 */

import type { Node, Edge } from '@xyflow/react';
import type {
  LayoutEngine,
  LayoutResult,
  LayoutPreset,
  LayoutManager as ILayoutManager,
} from './types';
import { LayoutType } from './types';
import { ELKLayoutEngine } from './engines/ELKLayoutEngine';

export class LayoutManager implements ILayoutManager {
  private engines = new Map<LayoutType, LayoutEngine>();
  private presets = new Map<string, LayoutPreset>();

  constructor() {
    // Register ELK engine for hierarchical layouts
    this.registerEngine(new ELKLayoutEngine());
    
    // Register custom engines for layouts ELK doesn't support natively
    // GridLayoutEngine removed - using ELK force algorithm for grid layout with hierarchy support

    // Register built-in presets
    this.registerBuiltInPresets();
  }

  // Engine management
  registerEngine(engine: LayoutEngine): void {
    this.engines.set(engine.type, engine);
  }

  getEngine(type: LayoutType): LayoutEngine | undefined {
    return this.engines.get(type);
  }

  getAvailableEngines(): LayoutEngine[] {
    return Array.from(this.engines.values());
  }

  // Map layout types to ELK algorithms for hierarchy support
  // V1 uses ELK for ALL layout types - this is what allows proper group node sizing
  private static readonly ELK_ALGORITHM_MAP: Partial<Record<LayoutType, string>> = {
    [LayoutType.HIERARCHICAL]: 'layered',  // Sugiyama layered algorithm
    [LayoutType.TREE]: 'mrtree',            // Tree layout algorithm
    [LayoutType.FORCE_DIRECTED]: 'force',  // Force-directed algorithm
    [LayoutType.ORGANIC]: 'stress',        // Stress majorization algorithm
    [LayoutType.GRID]: 'force',            // Use force algorithm for grid-like arrangement with hierarchy
    // CIRCULAR - REMOVED - Graphviz circo not available in ELK.js
  };

  // Layout calculation - supports async engines
  // Routes ELK-based layouts through ELK engine (like V1 does for all layouts)
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
      console.log('🔍 DEBUG: Using ELK algorithm', { type, elkAlgorithm });
      const elkEngine = this.getEngine(LayoutType.HIERARCHICAL);
      if (elkEngine) {
        // Transform settings to match ELK schema requirements
        const elkSettings: Record<string, unknown> = { ...settings, algorithm: elkAlgorithm };
        console.log('🔍 DEBUG: ELK settings', { elkSettings });
        
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

  // Depth-first bottom-up layout for ORGANIC layout
  private async calculateOrganicLayoutDepthFirst(
    nodes: Node[],
    edges: Edge[],
    settings: Record<string, unknown>
  ): Promise<LayoutResult> {
    console.log('🔍 DEBUG: Organic layout - recursive depth-first with stress algorithm');
    
    const elkEngine = this.getEngine(LayoutType.HIERARCHICAL);
    if (!elkEngine) {
      throw new Error('ELK engine not available for organic layout');
    }

    // Recursive depth-first layout
    const result = await this.layoutDepthFirst(nodes, edges, settings, elkEngine);
    
    console.log('🔍 DEBUG: Organic layout depth-first complete');
    return result;
  }

  // Recursive depth-first layout implementation
  private async layoutDepthFirst(
    nodes: Node[],
    edges: Edge[],
    settings: Record<string, unknown>,
    elkEngine: any
  ): Promise<LayoutResult> {
    // Separate nodes by hierarchy level
    const { rootNodes, childGroups } = this.separateByHierarchy(nodes);
    
    console.log(`🔍 DEBUG: Depth-first - ${rootNodes.length} roots, ${Object.keys(childGroups).length} child groups`);
    
    // First, recursively layout all child groups (depth-first)
    const childResults = new Map<string, LayoutResult>();
    for (const [parentId, childNodes] of Object.entries(childGroups)) {
      console.log(`🔍 DEBUG: Layout child group ${parentId} with ${childNodes.length} nodes`);
      const childResult = await this.layoutDepthFirst(childNodes, edges, settings, elkEngine);
      childResults.set(parentId, childResult);
    }
    
    // Apply child dimensions to parent nodes
    const sizedRootNodes = this.applyChildDimensions(rootNodes, childResults);
    
    // Layout root nodes with stress algorithm (no hierarchy at this level)
    const stressSettings: Record<string, unknown> = { 
      ...settings, 
      algorithm: 'stress',
      'elk.hierarchyHandling': 'NONE'
    };
    
    console.log('🔍 DEBUG: Layout root nodes with stress algorithm');
    const validatedSettings = elkEngine.validateSettings(stressSettings);
    const rootResult = await elkEngine.calculateLayout(sizedRootNodes, edges, validatedSettings);
    
    // Combine all results
    const allNodes = [...rootResult.nodes];
    const allEdges = [...rootResult.edges];
    
    // Add child results
    for (const childResult of childResults.values()) {
      allNodes.push(...childResult.nodes);
      allEdges.push(...childResult.edges);
    }
    
    return {
      nodes: allNodes,
      edges: allEdges,
      bounds: rootResult.bounds,
      metadata: rootResult.metadata,
    };
  }

  // Separate nodes by hierarchy
  private separateByHierarchy(nodes: Node[]): { rootNodes: Node[]; childGroups: Record<string, Node[]> } {
    const rootNodes: Node[] = [];
    const childGroups: Record<string, Node[]> = {};
    
    for (const node of nodes) {
      const parentId = (node as any).parentId;
      if (parentId) {
        if (!childGroups[parentId]) {
          childGroups[parentId] = [];
        }
        childGroups[parentId].push(node);
      } else {
        rootNodes.push(node);
      }
    }
    
    return { rootNodes, childGroups };
  }

  // Apply child dimensions to parent nodes
  private applyChildDimensions(
    rootNodes: Node[],
    childResults: Map<string, LayoutResult>
  ): Node[] {
    return rootNodes.map(node => {
      const childResult = childResults.get(node.id);
      if (childResult && (node as any).data?.isCompound) {
        // Calculate bounding box of all children
        const childBounds = this.calculateChildBounds(childResult.nodes);
        
        console.log(`🔍 DEBUG: Apply child dimensions to ${node.id}:`, childBounds);
        
        return {
          ...node,
          style: {
            ...node.style,
            width: childBounds.width,
            height: childBounds.height,
          }
        };
      }
      
      return node;
    });
  }

  // Calculate bounding box of child nodes
  private calculateChildBounds(childNodes: Node[]): { width: number; height: number } {
    if (childNodes.length === 0) {
      return { width: 100, height: 50 }; // Default size
    }
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const child of childNodes) {
      const x = child.position.x;
      const y = child.position.y;
      const width = Number(child.style?.width || 100);
      const height = Number(child.style?.height || 50);
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    }
    
    const padding = 40; // Add padding around children
    return {
      width: (maxX - minX) + padding,
      height: (maxY - minY) + padding
    };
  }

  // Preset management
  registerPreset(preset: LayoutPreset): void {
    this.presets.set(preset.id, preset);
  }

  getPresets(type?: LayoutType): LayoutPreset[] {
    const allPresets = Array.from(this.presets.values());
    return type ? allPresets.filter((p) => p.layoutType === type) : allPresets;
  }

  getPreset(id: string): LayoutPreset | undefined {
    return this.presets.get(id);
  }

  private registerBuiltInPresets(): void {
    // Grid presets
    this.registerPreset({
      id: 'grid-simple',
      name: 'Simple Grid',
      description: 'Basic grid layout for small machines',
      layoutType: LayoutType.GRID,
      settings: {
        nodeSpacing: 120,
        edgeSpacing: 20,
        fitPadding: 20,
        animationDuration: 300,
        compactness: 0.7,
        alignment: 'center',
        direction: 'row',
      },
      constraints: {
        maxNodes: 9,
        suitableFor: ['simple', 'toggle', 'counter'],
      },
      tags: ['grid', 'simple', 'small'],
    });

    this.registerPreset({
      id: 'grid-compact',
      name: 'Compact Grid',
      description: 'Dense grid layout for medium machines',
      layoutType: LayoutType.GRID,
      settings: {
        nodeSpacing: 80,
        edgeSpacing: 15,
        fitPadding: 15,
        animationDuration: 250,
        compactness: 0.9,
        alignment: 'center',
        direction: 'row',
      },
      constraints: {
        minNodes: 5,
        maxNodes: 25,
        suitableFor: ['medium', 'compact'],
      },
      tags: ['grid', 'compact', 'medium'],
    });

    // Hierarchical presets (ELK-based) - V1 parity values
    // Use TREE layout type (mrtree algorithm) to match V1 behavior for hierarchical layouts
    this.registerPreset({
      id: 'hierarchical-topdown',
      name: 'Top-Down Flow',
      description: 'Hierarchical layout flowing downward',
      layoutType: LayoutType.TREE, // Use TREE (mrtree) like V1, not HIERARCHICAL (layered)
      settings: {
        nodeSpacing: 120,
        edgeSpacing: 20,
        fitPadding: 20,
        animationDuration: 300,
        compactness: 0,
        direction: 'DOWN',
        layerSpacing: 180,
        edgeRouting: 'ORTHOGONAL',
        alignment: 'CENTER',
        edgeNodeSpacing: 30,
        edgeEdgeSpacing: 20,
        feedbackEdges: true,
      },
      constraints: {
        suitableFor: ['state-machine', 'flowchart', 'hsm'],
      },
      tags: ['hierarchical', 'topdown', 'state-machine'],
    });

    this.registerPreset({
      id: 'hierarchical-leftright',
      name: 'Left-to-Right Flow',
      description: 'Hierarchical layout flowing right',
      layoutType: LayoutType.HIERARCHICAL,
      settings: {
        nodeSpacing: 120,
        edgeSpacing: 20,
        fitPadding: 20,
        animationDuration: 300,
        compactness: 0,
        direction: 'RIGHT',
        layerSpacing: 180,
        edgeRouting: 'ORTHOGONAL',
        alignment: 'CENTER',
        edgeNodeSpacing: 30,
        edgeEdgeSpacing: 20,
        feedbackEdges: true,
      },
      constraints: {
        suitableFor: ['flowchart', 'workflow'],
      },
      tags: ['hierarchical', 'leftright', 'flowchart'],
    });

    // Tree presets (ELK-based with mrtree algorithm) - V1 parity values
    this.registerPreset({
      id: 'tree-topdown',
      name: 'Tree Top-Down',
      description: 'Tree layout flowing downward',
      layoutType: LayoutType.TREE,
      settings: {
        nodeSpacing: 120,
        edgeSpacing: 20,
        fitPadding: 20,
        animationDuration: 300,
        compactness: 0,
        direction: 'DOWN',
        layerSpacing: 180,
        edgeRouting: 'ORTHOGONAL',
        alignment: 'CENTER',
        edgeNodeSpacing: 30,
        edgeEdgeSpacing: 20,
        compactComponents: false,
        separateComponents: false,
        componentSpacing: 60,
        thoroughness: 7,
        feedbackEdges: true,
      },
      constraints: {
        suitableFor: ['state-machine', 'hsm', 'tree'],
      },
      tags: ['tree', 'topdown', 'hsm'],
    });

    this.registerPreset({
      id: 'tree-leftright',
      name: 'Tree Left-to-Right',
      description: 'Tree layout flowing right',
      layoutType: LayoutType.TREE,
      settings: {
        nodeSpacing: 120,
        edgeSpacing: 20,
        fitPadding: 20,
        animationDuration: 300,
        compactness: 0,
        direction: 'RIGHT',
        layerSpacing: 180,
        edgeRouting: 'ORTHOGONAL',
        alignment: 'CENTER',
        edgeNodeSpacing: 30,
        edgeEdgeSpacing: 20,
        compactComponents: false,
        separateComponents: false,
        componentSpacing: 60,
        thoroughness: 7,
        feedbackEdges: true,
      },
      constraints: {
        suitableFor: ['tree', 'flowchart'],
      },
      tags: ['tree', 'leftright', 'flowchart'],
    });

    // Force-directed presets
    this.registerPreset({
      id: 'force-balanced',
      name: 'Force Balanced',
      description: 'Physics-based balanced layout',
      layoutType: LayoutType.FORCE_DIRECTED,
      settings: {
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
      },
      constraints: {
        suitableFor: ['network', 'graph', 'complex'],
      },
      tags: ['force', 'physics', 'balanced'],
    });

    // Organic presets
    this.registerPreset({
      id: 'organic-clustered',
      name: 'Organic Clustered',
      description: 'Natural clustering with organic spacing',
      layoutType: LayoutType.ORGANIC,
      settings: {
        nodeSpacing: 100,
        edgeSpacing: 20,
        fitPadding: 20,
        animationDuration: 300,
        compactness: 0.6,
        clustering: true,
        clusterSpacing: 150,
        organicity: 0.8,
        iterations: 150,
      },
      constraints: {
        suitableFor: ['complex', 'modular', 'grouped'],
      },
      tags: ['organic', 'cluster', 'natural'],
    });

    // Grid presets
    this.registerPreset({
      id: 'grid-standard',
      name: 'Grid',
      description: 'Grid-like arrangement using force algorithm with hierarchy support',
      layoutType: LayoutType.GRID,
      settings: {
        nodeSpacing: 120,
        edgeSpacing: 20,
        fitPadding: 20,
        animationDuration: 300,
        compactness: 0.5,
        forceIterations: 300,
        temperature: 0.007,
        repulsion: 12,
        attraction: 0.82,
        useCoarseGraining: true,
      },
      constraints: {
        suitableFor: ['any', 'hierarchy', 'grouped'],
      },
      tags: ['grid', 'force', 'hierarchy'],
    });

    // Experimental: Alternating Direction Hierarchical
    this.registerPreset({
      id: 'alternating-direction-experiment',
      name: 'Alternating Direction (Experimental)',
      description: 'Experimental layout that alternates directions between hierarchy levels',
      layoutType: LayoutType.HIERARCHICAL,
      settings: {
        nodeSpacing: 120,
        edgeSpacing: 20,
        fitPadding: 20,
        animationDuration: 300,
        compactness: 0,
        algorithm: 'layered',
        direction: 'DOWN',
        layerSpacing: 180,
        edgeRouting: 'ORTHOGONAL',
        alignment: 'CENTER',
        edgeNodeSpacing: 30,
        edgeEdgeSpacing: 20,
        compactComponents: false,
        separateComponents: false,
        componentSpacing: 60,
        thoroughness: 7,
        feedbackEdges: true,
        alternatingDirection: true,
        primaryDirection: 'DOWN',
        secondaryDirection: 'RIGHT',
        nodePlacementStrategy: 'NETWORK_SIMPLEX',
        edgeRoutingStrategy: 'ORTHOGONAL',
        compactionStrategy: 'NONE',
        cycleBreakingStrategy: 'DEPTH_FIRST',
      },
      constraints: {
        suitableFor: ['deep-hierarchy', 'experimental', 'compact'],
      },
      tags: ['experimental', 'alternating', 'hierarchical', 'compact'],
    });
  }
}

// Singleton instance
export const layoutManager = new LayoutManager();
