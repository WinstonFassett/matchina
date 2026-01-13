/**
 * Layout system types for ReactFlow V2
 * Modern, reliable layout options with full type safety
 */

import type { Node, Edge } from '@xyflow/react';
import { z } from 'zod';

// Layout types that actually work and are useful
export enum LayoutType {
  HIERARCHICAL = 'hierarchical',  // Sugiyama layered layout (best for state machines)
  TREE = 'tree',                   // Tree layout (mrtree algorithm)
  FORCE_DIRECTED = 'force',        // Physics-based clustering
  ORGANIC = 'organic',              // Natural clustering
}

// Universal settings that work across all layouts
export const BaseLayoutSettingsSchema = z.object({
  // Spacing (RELIABLE across all layouts)
  nodeSpacing: z.number().min(20).max(500).default(120),
  edgeSpacing: z.number().min(10).max(100).default(20),
  
  // View settings (RELIABLE)
  fitPadding: z.number().min(0).max(100).default(20),
  animationDuration: z.number().min(0).max(2000).default(300),
  
  // Compactness (RELIABLE 0-1 scale)
  compactness: z.number().min(0).max(1).default(0.7),
});

// Layout-specific settings
export const HierarchicalLayoutSettingsSchema = BaseLayoutSettingsSchema.extend({
  direction: z.enum(['TB', 'BT', 'LR', 'RL']).default('TB'),
  levelSpacing: z.number().min(50).max(300).default(180),
  nodeAlignment: z.enum(['center', 'start', 'end']).default('center'),
  sortBySize: z.boolean().default(false),
});

export const ForceDirectedLayoutSettingsSchema = BaseLayoutSettingsSchema.extend({
  strength: z.number().min(-100).max(100).default(-50),
  linkDistance: z.number().min(50).max(300).default(100),
  iterations: z.number().min(10).max(1000).default(100),
  preventOverlap: z.boolean().default(true),
});

export const OrganicLayoutSettingsSchema = BaseLayoutSettingsSchema.extend({
  clustering: z.boolean().default(true),
  clusterStrength: z.number().min(0).max(1).default(0.7),
  organicity: z.number().min(0).max(1).default(0.8),
});

// Export inferred types
export type HierarchicalLayoutSettings = z.infer<typeof HierarchicalLayoutSettingsSchema>;
export type ForceDirectedLayoutSettings = z.infer<typeof ForceDirectedLayoutSettingsSchema>;
export type OrganicLayoutSettings = z.infer<typeof OrganicLayoutSettingsSchema>;

// Base layout settings for type constraints
export type BaseLayoutSettings = z.infer<typeof BaseLayoutSettingsSchema>;

// Union type for all layout settings
export type LayoutSettings =
  | HierarchicalLayoutSettings
  | ForceDirectedLayoutSettings
  | OrganicLayoutSettings;

// Layout result
export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata: {
    layoutType: LayoutType;
    nodeCount: number;
    edgeCount: number;
    calculationTime: number;
    converged: boolean;
  };
}

// Layout engine interface - accepts any settings object
export interface LayoutEngine<T = Record<string, unknown>> {
  readonly type: LayoutType;
  readonly name: string;
  readonly description: string;

  calculateLayout(nodes: Node[], edges: Edge[], settings: T): LayoutResult | Promise<LayoutResult>;

  getDefaultSettings(): T;

  validateSettings(settings: Partial<T>): T;

  getSettingsSchema(): z.AnyZodObject;
}

// Layout manager interface
export interface ILayoutManager {
  // Engine management
  registerEngine(engine: LayoutEngine): void;
  getEngine(type: LayoutType): LayoutEngine | undefined;
  getAvailableEngines(): LayoutEngine[];

  // Layout calculation
  calculateLayout(
    type: LayoutType,
    nodes: Node[],
    edges: Edge[],
    settings: Record<string, unknown>
  ): LayoutResult | Promise<LayoutResult>;
}

// Generic settings type for UI components - accepts any layout settings
export type AnyLayoutSettings = Record<string, unknown>;

// UI Control types
export interface LayoutControlsState {
  layoutType: LayoutType;
  settings: AnyLayoutSettings;
  isPanelOpen: boolean;
}

export interface LayoutControlsActions {
  setLayoutType: (type: LayoutType) => void;
  updateSettings: (settings: Partial<AnyLayoutSettings>) => void;
  resetToDefault: () => void;
  togglePanel: () => void;
}

// Validation helpers
export function createLayoutValidator<T extends LayoutSettings>(schema: z.ZodSchema<T>) {
  return (settings: Partial<T>): T => {
    return schema.parse(settings);
  };
}

// Type guards
export function isHierarchicalLayoutSettings(settings: LayoutSettings): settings is z.infer<typeof HierarchicalLayoutSettingsSchema> {
  return BaseLayoutSettingsSchema.extend({
    direction: z.enum(['TB', 'BT', 'LR', 'RL']),
    levelSpacing: z.number(),
    nodeAlignment: z.enum(['center', 'start', 'end']),
    sortBySize: z.boolean(),
  }).safeParse(settings).success;
}

export function isForceDirectedLayoutSettings(settings: LayoutSettings): settings is z.infer<typeof ForceDirectedLayoutSettingsSchema> {
  return BaseLayoutSettingsSchema.extend({
    strength: z.number(),
    linkDistance: z.number(),
    iterations: z.number(),
    preventOverlap: z.boolean(),
  }).safeParse(settings).success;
}

export function isOrganicLayoutSettings(settings: LayoutSettings): settings is z.infer<typeof OrganicLayoutSettingsSchema> {
  return BaseLayoutSettingsSchema.extend({
    clustering: z.boolean(),
    clusterStrength: z.number(),
    organicity: z.number(),
  }).safeParse(settings).success;
}
