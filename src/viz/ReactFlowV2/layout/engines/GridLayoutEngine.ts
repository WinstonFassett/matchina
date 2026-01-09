/**
 * Grid Layout Engine
 * Reliable, predictable grid layout as baseline
 */

import type { Node, Edge } from '@xyflow/react';
import { z } from 'zod';
import type { 
  LayoutEngine, 
  LayoutResult
} from '../types';
import { LayoutType } from '../types';

const GridLayoutSettings = z.object({
  nodeSpacing: z.number().min(20).max(500).default(120),
  edgeSpacing: z.number().min(10).max(100).default(20),
  fitPadding: z.number().min(0).max(100).default(20),
  animationDuration: z.number().min(0).max(2000).default(300),
  compactness: z.number().min(0).max(1).default(0.7),
  cols: z.number().min(1).max(20).optional(),
  columns: z.number().min(1).max(20).optional(), // Alias for cols (from UI)
  alignment: z.enum(['start', 'center', 'end']).default('center'),
  direction: z.enum(['row', 'column']).default('row'),
});

type GridLayoutSettings = z.infer<typeof GridLayoutSettings>;

export class GridLayoutEngine implements LayoutEngine<GridLayoutSettings> {
  readonly type = LayoutType.GRID;
  readonly name = 'Grid Layout';
  readonly description = 'Simple, predictable grid arrangement';

  calculateLayout(
    nodes: Node[],
    edges: Edge[],
    settings: GridLayoutSettings
  ): LayoutResult {
    const startTime = performance.now();
    
    // Validate settings
    const validatedSettings = this.validateSettings(settings);
    
    // Calculate grid dimensions
    const nodeCount = nodes.length;
    // Support both 'cols' and 'columns' (UI sends 'columns')
    const cols = validatedSettings.cols || validatedSettings.columns || this.calculateOptimalCols(nodeCount);
    const rows = Math.ceil(nodeCount / cols);
    
    // Apply compactness to spacing
    const nodeSpacing = validatedSettings.nodeSpacing * (1 - validatedSettings.compactness * 0.5);
    
    // Calculate positions
    const positionedNodes = nodes.map((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      let x = col * nodeSpacing;
      let y = row * nodeSpacing;
      
      // Apply alignment
      if (validatedSettings.direction === 'row') {
        // For row direction, align horizontally
        const gridWidth = (cols - 1) * nodeSpacing;
        if (validatedSettings.alignment === 'center') {
          x -= gridWidth / 2;
        } else if (validatedSettings.alignment === 'end') {
          x -= gridWidth;
        }
      } else {
        // For column direction, align vertically
        const gridHeight = (rows - 1) * nodeSpacing;
        if (validatedSettings.alignment === 'center') {
          y -= gridHeight / 2;
        } else if (validatedSettings.alignment === 'end') {
          y -= gridHeight;
        }
      }
      
      return {
        ...node,
        position: { x, y },
      };
    });

    // Calculate bounds
    const bounds = this.calculateBounds(positionedNodes, validatedSettings.fitPadding);
    
    const endTime = performance.now();
    
    return {
      nodes: positionedNodes,
      edges: edges, // Grid layout doesn't modify edges
      bounds,
      metadata: {
        layoutType: this.type,
        nodeCount,
        edgeCount: edges.length,
        calculationTime: endTime - startTime,
        converged: true, // Grid layout always converges
      },
    };
  }

  getDefaultSettings(): GridLayoutSettings {
    return {
      nodeSpacing: 120,
      edgeSpacing: 20,
      fitPadding: 20,
      animationDuration: 300,
      compactness: 0.7,
      cols: undefined, // Auto-calculate
      alignment: 'center',
      direction: 'row',
    };
  }

  validateSettings(settings: Partial<GridLayoutSettings>): GridLayoutSettings {
    return GridLayoutSettings.parse({
      ...this.getDefaultSettings(),
      ...settings,
    });
  }

  getSettingsSchema() {
    return GridLayoutSettings;
  }

  private calculateOptimalCols(nodeCount: number): number {
    // Aim for roughly square grid
    return Math.ceil(Math.sqrt(nodeCount));
  }

  private calculateBounds(nodes: Node[], padding: number) {
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const xs = nodes.map(n => n.position.x);
    const ys = nodes.map(n => n.position.y);
    
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
}
