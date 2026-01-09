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
import { GridLayoutEngine } from './engines/GridLayoutEngine';
import { ELKLayoutEngine } from './engines/ELKLayoutEngine';
import { CircularLayoutEngine } from './engines/CircularLayoutEngine';
import { ForceDirectedLayoutEngine } from './engines/ForceDirectedLayoutEngine';
import { OrganicLayoutEngine } from './engines/OrganicLayoutEngine';

export class LayoutManager implements ILayoutManager {
  private engines = new Map<LayoutType, LayoutEngine>();
  private presets = new Map<string, LayoutPreset>();

  constructor() {
    // Register built-in engines
    this.registerEngine(new GridLayoutEngine());
    this.registerEngine(new ELKLayoutEngine());
    this.registerEngine(new CircularLayoutEngine());
    this.registerEngine(new ForceDirectedLayoutEngine());
    this.registerEngine(new OrganicLayoutEngine());

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
    [LayoutType.FORCE_DIRECTED]: 'force',
    [LayoutType.ORGANIC]: 'stress',
    // Circular and Grid use custom engines (no hierarchy support needed for flat layouts)
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

    // Hierarchical presets (ELK-based)
    this.registerPreset({
      id: 'hierarchical-topdown',
      name: 'Top-Down Flow',
      description: 'Hierarchical layout flowing downward',
      layoutType: LayoutType.HIERARCHICAL,
      settings: {
        nodeSpacing: 100,
        edgeSpacing: 20,
        fitPadding: 20,
        animationDuration: 300,
        compactness: 0.6,
        direction: 'DOWN',
        layerSpacing: 80,
        edgeRouting: 'ORTHOGONAL',
        alignment: 'CENTER',
        edgeNodeSpacing: 15,
        edgeEdgeSpacing: 10,
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
        nodeSpacing: 80,
        edgeSpacing: 20,
        fitPadding: 20,
        animationDuration: 300,
        compactness: 0.7,
        direction: 'RIGHT',
        layerSpacing: 100,
        edgeRouting: 'ORTHOGONAL',
        alignment: 'CENTER',
        edgeNodeSpacing: 15,
        edgeEdgeSpacing: 10,
        feedbackEdges: true,
      },
      constraints: {
        suitableFor: ['flowchart', 'workflow'],
      },
      tags: ['hierarchical', 'leftright', 'flowchart'],
    });

    // Tree presets (ELK-based with mrtree algorithm)
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
        compactness: 0.7,
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
        nodeSpacing: 100,
        edgeSpacing: 20,
        fitPadding: 20,
        animationDuration: 300,
        compactness: 0.7,
        direction: 'RIGHT',
        layerSpacing: 120,
        edgeRouting: 'ORTHOGONAL',
        alignment: 'CENTER',
        edgeNodeSpacing: 20,
        edgeEdgeSpacing: 15,
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
  }
}

// Singleton instance
export const layoutManager = new LayoutManager();
