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
    // Register ELK engine only - it handles ALL layout types with proper hierarchy support
    this.registerEngine(new ELKLayoutEngine());

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
    [LayoutType.CIRCULAR]: 'radial',       // Radial algorithm (ELK native!)
    [LayoutType.GRID]: 'disco',            // DisCo algorithm (ELK native!)
  };

  // Layout calculation - supports async engines
  // Routes ELK-based layouts through ELK engine (like V1 does for all layouts)
  async calculateLayout(
    type: LayoutType,
    nodes: Node[],
    edges: Edge[],
    settings: Record<string, unknown>
  ): Promise<LayoutResult> {
    const elkAlgorithm = LayoutManager.ELK_ALGORITHM_MAP[type];
    
    // Route through ELK if this layout type has an ELK algorithm mapping
    // This matches V1 behavior where ALL these layouts use ELK
    if (elkAlgorithm) {
      const elkEngine = this.getEngine(LayoutType.HIERARCHICAL);
      if (elkEngine) {
        // Merge the ELK algorithm into settings
        const elkSettings = {
          ...settings,
          algorithm: elkAlgorithm,
        };
        const validatedSettings = elkEngine.validateSettings(elkSettings);
        return elkEngine.calculateLayout(nodes, edges, validatedSettings);
      }
    }

    // Use custom engines for layouts without ELK mapping (Grid, Circular)
    const engine = this.getEngine(type);
    if (!engine) {
      throw new Error(`No layout engine found for type: ${type}`);
    }

    const validatedSettings = engine.validateSettings(settings);
    const result = engine.calculateLayout(nodes, edges, validatedSettings);
    
    // Handle both sync and async results
    return result;
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

    // Circular presets
    this.registerPreset({
      id: 'circular-standard',
      name: 'Circular',
      description: 'Nodes arranged in a circle',
      layoutType: LayoutType.CIRCULAR,
      settings: {
        nodeSpacing: 100,
        edgeSpacing: 20,
        fitPadding: 20,
        animationDuration: 300,
        compactness: 0.7,
        startAngle: 270,
        clockwise: true,
        sortByConnections: false,
      },
      constraints: {
        suitableFor: ['cycle', 'ring', 'round-robin'],
      },
      tags: ['circular', 'radial'],
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
