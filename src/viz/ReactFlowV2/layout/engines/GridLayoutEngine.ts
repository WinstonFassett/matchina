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
  
  // Grid dimensions - support both cols and rows
  cols: z.number().min(1).max(20).optional(),
  columns: z.number().min(1).max(20).optional(), // Alias for cols (from UI)
  rows: z.number().min(1).max(20).optional(),
  maxCols: z.number().min(1).max(20).default(6), // Maximum columns before wrapping
  maxRows: z.number().min(1).max(20).default(6), // Maximum rows before wrapping
  
  // Layout behavior
  alignment: z.enum(['start', 'center', 'end']).default('center'),
  direction: z.enum(['row', 'column']).default('row'),
  
  // Auto-sizing options
  autoFit: z.boolean().default(true), // Auto-calculate optimal dimensions
  preferSquare: z.boolean().default(true), // Prefer roughly square grids
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
    
    // Separate nodes by hierarchy
    const { rootNodes, childNodesMap } = this.separateHierarchy(nodes);
    
    // Layout root nodes first
    const positionedRootNodes = this.layoutNodes(rootNodes, validatedSettings, { x: 0, y: 0 });
    
    // Layout child nodes relative to their parents
    const positionedChildNodes: Node[] = [];
    for (const [parentId, children] of childNodesMap.entries()) {
      const parentNode = positionedRootNodes.find(n => n.id === parentId);
      if (parentNode) {
        const positionedChildren = this.layoutNodes(children, validatedSettings, parentNode.position);
        positionedChildNodes.push(...positionedChildren);
        
        // Update parent size to contain children
        const parentBounds = this.calculateBounds(positionedChildren, 20); // 20px padding
        const updatedParent = {
          ...parentNode,
          style: {
            ...parentNode.style,
            width: Math.max(150, parentBounds.width + 40), // Min width + padding
            height: Math.max(50, parentBounds.height + 40), // Min height + padding
          },
        };
        // Replace in positionedRootNodes
        const parentIndex = positionedRootNodes.findIndex(n => n.id === parentId);
        positionedRootNodes[parentIndex] = updatedParent;
      }
    }
    
    const allPositionedNodes = [...positionedRootNodes, ...positionedChildNodes];
    
    // Calculate bounds
    const bounds = this.calculateBounds(allPositionedNodes, validatedSettings.fitPadding);
    
    const endTime = performance.now();
    
    return {
      nodes: allPositionedNodes,
      edges: edges, // Grid layout doesn't modify edges
      bounds,
      metadata: {
        layoutType: this.type,
        nodeCount: nodes.length,
        duration: endTime - startTime,
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
      columns: undefined, // Auto-calculate
      rows: undefined, // Auto-calculate
      maxCols: 6,
      maxRows: 6,
      alignment: 'center',
      direction: 'row',
      autoFit: true,
      preferSquare: true,
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

  private calculateOptimalDimensions(nodeCount: number, settings: GridLayoutSettings): { cols: number; rows: number } {
    if (!settings.autoFit) {
      // Use explicit dimensions if provided
      const cols = settings.cols || settings.columns || Math.ceil(Math.sqrt(nodeCount));
      const rows = settings.rows || Math.ceil(nodeCount / cols);
      return { cols: Math.min(cols, settings.maxCols), rows: Math.min(rows, settings.maxRows) };
    }

    // Auto-calculate optimal dimensions
    let cols: number;
    let rows: number;

    if (settings.preferSquare) {
      // Aim for roughly square grid
      cols = Math.ceil(Math.sqrt(nodeCount));
      rows = Math.ceil(nodeCount / cols);
    } else {
      // Prefer wider grids (more columns than rows)
      cols = Math.min(settings.maxCols, Math.ceil(Math.sqrt(nodeCount * 1.5)));
      rows = Math.ceil(nodeCount / cols);
    }

    // Respect max dimensions
    cols = Math.min(cols, settings.maxCols);
    rows = Math.min(rows, settings.maxRows);

    // Ensure all nodes fit
    while (cols * rows < nodeCount) {
      if (cols < settings.maxCols) {
        cols++;
      } else if (rows < settings.maxRows) {
        rows++;
      } else {
        break; // Can't fit more nodes within constraints
      }
    }

    return { cols, rows };
  }

  private separateHierarchy(nodes: Node[]): { rootNodes: Node[]; childNodesMap: Map<string, Node[]> } {
    const childNodesMap = new Map<string, Node[]>();
    const rootNodes: Node[] = [];

    for (const node of nodes) {
      const parentId = (node as any).parentId;
      if (parentId) {
        // This is a child node
        if (!childNodesMap.has(parentId)) {
          childNodesMap.set(parentId, []);
        }
        childNodesMap.get(parentId)!.push(node);
      } else {
        // This is a root node
        rootNodes.push(node);
      }
    }

    return { rootNodes, childNodesMap };
  }

  private layoutNodes(nodes: Node[], settings: GridLayoutSettings, offset: { x: number; y: number }): Node[] {
    // Calculate optimal grid dimensions
    const nodeCount = nodes.length;
    const { cols, rows } = this.calculateOptimalDimensions(nodeCount, settings);
    
    // Calculate spacing for edge labels (75-100% of node width)
    const nodeWidth = 150; // Average node width
    const edgeLabelSpacing = nodeWidth * 0.875; // 87.5% = midpoint of 75-100%
    const spacingMultiplier = 1 - settings.compactness * 0.5;
    const nodeSpacing = Math.max(edgeLabelSpacing, settings.nodeSpacing) * spacingMultiplier;
    
    // Calculate positions
    return nodes.map((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      let x = col * nodeSpacing + offset.x;
      let y = row * nodeSpacing + offset.y;
      
      // Apply alignment
      if (settings.direction === 'row') {
        // For row direction, align horizontally
        const gridWidth = (cols - 1) * nodeSpacing;
        if (settings.alignment === 'center') {
          x -= gridWidth / 2;
        } else if (settings.alignment === 'end') {
          x -= gridWidth;
        }
      } else {
        // For column direction, align vertically
        const gridHeight = (rows - 1) * nodeSpacing;
        if (settings.alignment === 'center') {
          y -= gridHeight / 2;
        } else if (settings.alignment === 'end') {
          y -= gridHeight;
        }
      }
      
      return {
        ...node,
        position: { x, y },
      };
    });
  }

  private calculateBounds(nodes: Node[], padding: number): { x: number; y: number; width: number; height: number } {
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
