/**
 * Layout system types for ReactFlow V2
 * Modern, reliable layout options with full type safety
 */

import type { Node, Edge } from '@xyflow/react';
import { z } from 'zod';

// Layout types that actually work and are useful
export enum LayoutType {
  GRID = 'grid',               // Simple grid (current baseline)
  HIERARCHICAL = 'hierarchical',  // Sugiyama layered layout (best for state machines)
  TREE = 'tree',                   // Tree layout (mrtree algorithm)
  FORCE_DIRECTED = 'force',        // Physics-based clustering
  CIRCULAR = 'circular',           // Radial arrangement
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
export const GridLayoutSettingsSchema = BaseLayoutSettingsSchema.extend({
  cols: z.number().min(1).max(20).optional(),
  alignment: z.enum(['start', 'center', 'end']).default('center'),
  direction: z.enum(['row', 'column']).default('row'),
});

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

export const CircularLayoutSettingsSchema = BaseLayoutSettingsSchema.extend({
  radius: z.number().min(100).max(1000).optional(),
  startAngle: z.number().min(0).max(360).default(0),
  clockwise: z.boolean().default(true),
  sortBySize: z.boolean().default(false),
});

export const OrganicLayoutSettingsSchema = BaseLayoutSettingsSchema.extend({
  clustering: z.boolean().default(true),
  clusterStrength: z.number().min(0).max(1).default(0.7),
  organicity: z.number().min(0).max(1).default(0.8),
});

// Export inferred types
export type GridLayoutSettings = z.infer<typeof GridLayoutSettingsSchema>;
export type HierarchicalLayoutSettings = z.infer<typeof HierarchicalLayoutSettingsSchema>;
export type ForceDirectedLayoutSettings = z.infer<typeof ForceDirectedLayoutSettingsSchema>;
export type CircularLayoutSettings = z.infer<typeof CircularLayoutSettingsSchema>;
export type OrganicLayoutSettings = z.infer<typeof OrganicLayoutSettingsSchema>;

// Base layout settings for type constraints
export type BaseLayoutSettings = z.infer<typeof BaseLayoutSettingsSchema>;

// Union type for all layout settings
export type LayoutSettings =
  | GridLayoutSettings
  | HierarchicalLayoutSettings
  | ForceDirectedLayoutSettings
  | CircularLayoutSettings
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

// Preset system - uses any for settings since presets are layout-type specific
export interface LayoutPreset<T = Record<string, unknown>> {
  id: string;
  name: string;
  description: string;
  layoutType: LayoutType;
  settings: T;
  constraints?: {
    maxNodes?: number;
    minNodes?: number;
    maxDepth?: number;
    suitableFor: string[]; // example types, machine types
  };
  tags: string[]; // for filtering and search
}

// Machine analysis for preset selection
export interface MachineAnalysis {
  nodeCount: number;
  edgeCount: number;
  depth: number;
  width: number;
  edgeDensity: number;
  hasCycles: boolean;
  isHierarchical: boolean;
  averageDegree: number;
}

// Layout manager interface
export interface LayoutManager {
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

  // Preset management
  registerPreset(preset: LayoutPreset): void;
  getPresets(type?: LayoutType): LayoutPreset[];
  getPreset(id: string): LayoutPreset | undefined;
}

// Generic settings type for UI components - accepts any layout settings
export type AnyLayoutSettings = Record<string, unknown>;

// UI Control types
export interface LayoutControlsState {
  layoutType: LayoutType;
  settings: AnyLayoutSettings;
  selectedPreset: string | null;
  isPanelOpen: boolean;
}

export interface LayoutControlsActions {
  setLayoutType: (type: LayoutType) => void;
  updateSettings: (settings: Partial<AnyLayoutSettings>) => void;
  applyPreset: (presetId: string) => void;
  resetToDefault: () => void;
  saveAsPreset: (name: string, description: string) => void;
  togglePanel: () => void;
}

// Validation helpers
export function createLayoutValidator<T extends LayoutSettings>(schema: z.ZodSchema<T>) {
  return (settings: Partial<T>): T => {
    return schema.parse(settings);
  };
}

// Type guards
export function isGridLayoutSettings(settings: LayoutSettings): settings is z.infer<typeof GridLayoutSettingsSchema> {
  return BaseLayoutSettingsSchema.extend({
    cols: z.number().optional(),
    alignment: z.enum(['start', 'center', 'end']),
    direction: z.enum(['row', 'column']),
  }).safeParse(settings).success;
}

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

export function isCircularLayoutSettings(settings: LayoutSettings): settings is z.infer<typeof CircularLayoutSettingsSchema> {
  return BaseLayoutSettingsSchema.extend({
    radius: z.number().optional(),
    startAngle: z.number(),
    clockwise: z.boolean(),
    sortBySize: z.boolean(),
  }).safeParse(settings).success;
}

export function isOrganicLayoutSettings(settings: LayoutSettings): settings is z.infer<typeof OrganicLayoutSettingsSchema> {
  return BaseLayoutSettingsSchema.extend({
    clustering: z.boolean(),
    clusterStrength: z.number(),
    organicity: z.number(),
  }).safeParse(settings).success;
}
