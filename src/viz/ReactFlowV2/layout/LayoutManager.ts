/**
 * Layout Manager
 * Simplified coordinator for layout engines and presets
 * NO analysis system - just basic management
 */

import type { Node, Edge } from '@xyflow/react';
import type {
  LayoutEngine,
  LayoutResult,
  LayoutSettings,
  LayoutPreset,
  LayoutManager as ILayoutManager,
} from './types';
import { LayoutType } from './types';
import { GridLayoutEngine } from './engines/GridLayoutEngine';

export class LayoutManager implements ILayoutManager {
  private engines = new Map<LayoutType, LayoutEngine>();
  private presets = new Map<string, LayoutPreset>();

  constructor() {
    // Register built-in engines
    this.registerEngine(new GridLayoutEngine());
    
    // Register built-in presets
    this.registerBuiltInPresets();
  }

  // Engine management
  registerEngine<T extends LayoutSettings>(engine: LayoutEngine<T>): void {
    this.engines.set(engine.type, engine as LayoutEngine);
  }

  getEngine(type: LayoutType): LayoutEngine | undefined {
    return this.engines.get(type);
  }

  getAvailableEngines(): LayoutEngine[] {
    return Array.from(this.engines.values());
  }

  // Layout calculation
  calculateLayout<T extends LayoutSettings>(
    type: LayoutType,
    nodes: Node[],
    edges: Edge[],
    settings: Partial<T>
  ): LayoutResult {
    const engine = this.getEngine(type);
    if (!engine) {
      throw new Error(`No layout engine found for type: ${type}`);
    }

    const validatedSettings = engine.validateSettings(settings);
    return engine.calculateLayout(nodes, edges, validatedSettings);
  }

  // Preset management
  registerPreset<T extends LayoutSettings>(preset: LayoutPreset<T>): void {
    this.presets.set(preset.id, preset);
  }

  getPresets(type?: LayoutType): LayoutPreset[] {
    const allPresets = Array.from(this.presets.values());
    return type ? allPresets.filter(p => p.layoutType === type) : allPresets;
  }

  getPreset(id: string): LayoutPreset | undefined {
    return this.presets.get(id);
  }

  private registerBuiltInPresets(): void {
    // Simple grid presets - NO analysis, just static configurations
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
  }
}

// Singleton instance
export const layoutManager = new LayoutManager();
