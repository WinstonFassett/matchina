/**
 * Lightweight auto-selection algorithm for choosing the best visualizer
 * based on machine characteristics
 */

import type { FactoryMachine } from 'matchina';
import type { VisualizerType } from './VizPicker';

interface MachineAnalysis {
  stateCount: number;
  transitionCount: number;
  hasHierarchy: boolean;
  transitionDensity: number;
}

/**
 * Analyzes a machine to extract key characteristics
 * Kept lightweight to avoid performance impact
 */
function analyzeMachine(machine: FactoryMachine<any>): MachineAnalysis {
  const shape = (machine as any).shape;

  // Count states
  const states = shape?.states || [];
  const stateCount = states.length;

  // Check for hierarchy (nested states)
  const hasHierarchy = states.some((state: any) => {
    return state.states && state.states.length > 0;
  });

  // Count transitions
  let transitionCount = 0;
  states.forEach((state: any) => {
    if (state.on) {
      transitionCount += Object.keys(state.on).length;
    }
  });

  // Calculate transition density (ratio of actual to possible transitions)
  const maxPossibleTransitions = stateCount * stateCount;
  const transitionDensity = maxPossibleTransitions > 0
    ? transitionCount / maxPossibleTransitions
    : 0;

  return {
    stateCount,
    transitionCount,
    hasHierarchy,
    transitionDensity,
  };
}

/**
 * Selects the best visualizer based on machine characteristics
 *
 * Logic:
 * - Hierarchical machines → Sketch (best for nested visualization)
 * - Simple machines (≤5 states, low density) → Mermaid Statechart (clean, familiar)
 * - Dense transition graphs → ForceGraph (handles tangled graphs well)
 * - Complex flat machines → ReactFlow (interactive, customizable)
 */
export function selectBestVisualizer(machine: FactoryMachine<any>): VisualizerType {
  const analysis = analyzeMachine(machine);

  // Hierarchical machines work best with Sketch
  if (analysis.hasHierarchy) {
    return 'sketch';
  }

  // Simple machines with few states and transitions look great in Mermaid
  if (analysis.stateCount <= 5 && analysis.transitionDensity < 0.5) {
    return 'mermaid-statechart';
  }

  // Dense transition graphs benefit from force-directed layout
  if (analysis.transitionDensity > 0.7) {
    return 'forcegraph';
  }

  // Default to ReactFlow for complex flat machines
  return 'reactflow';
}

/**
 * Gets the appropriate visualizers for a preset
 */
export function getPresetConfig(preset: 'simple' | 'hierarchical' | 'complex' | 'minimal') {
  switch (preset) {
    case 'simple':
      return {
        defaultViz: 'mermaid-statechart' as VisualizerType,
        availableViz: ['mermaid-statechart', 'mermaid-flowchart', 'sketch'] as VisualizerType[],
        layout: 'stacked' as const,
        showPicker: true,
      };

    case 'hierarchical':
      return {
        defaultViz: 'sketch' as VisualizerType,
        availableViz: ['sketch', 'forcegraph'] as VisualizerType[],
        layout: 'split' as const,
        showPicker: true,
      };

    case 'complex':
      return {
        defaultViz: 'reactflow' as VisualizerType,
        availableViz: ['reactflow', 'forcegraph', 'mermaid-statechart', 'mermaid-flowchart', 'sketch'] as VisualizerType[],
        layout: 'split' as const,
        showPicker: true,
      };

    case 'minimal':
      return {
        defaultViz: 'auto' as const,
        availableViz: ['reactflow', 'forcegraph', 'mermaid-statechart', 'mermaid-flowchart', 'sketch'] as VisualizerType[],
        layout: 'stacked' as const,
        showPicker: false,
      };
  }
}
