/**
 * Example-specific ReactFlow optimization presets
 * Each example gets custom layout options for perfect initial view
 */

export interface ReactFlowPreset {
  name: string;
  description: string;
  layoutOptions: {
    algorithm: string;
    nodeSpacing: number;
    layerSpacing: number;
    edgeSpacing: number;
    thoroughness?: number;
    compactComponents?: boolean;
    separateComponents?: boolean;
    edgeNodeSpacing?: number;
    componentSpacing?: number;
  };
  fitViewOptions: {
    padding: number;
    minZoom: number;
    maxZoom: number;
    duration: number;
  };
  constraints: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  pageLayout: {
    layout: 'split' | 'stacked';
    minVizHeight: number;
  };
}

export const REACTFLOW_PRESETS: Record<string, ReactFlowPreset> = {
  // Simple examples - clean, spacious layout
  'traffic-light': {
    name: 'Traffic Light',
    description: 'Simple 3-state cycle - needs clear spacing and centered view',
    layoutOptions: {
      algorithm: 'layered',
      nodeSpacing: 140,
      layerSpacing: 120,
      edgeSpacing: 20,
      thoroughness: 7,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 30,
      componentSpacing: 50,
    },
    fitViewOptions: {
      padding: 0.25,
      minZoom: 0.5,
      maxZoom: 2.5,
      duration: 1000,
    },
    constraints: {
      minWidth: 600,
      minHeight: 400,
    },
    pageLayout: {
      layout: 'split',
      minVizHeight: 500,
    },
  },

  // Complex hierarchical examples
  'hsm-combobox': {
    name: 'HSM Combobox',
    description: 'Complex hierarchy with nested states - needs careful spacing',
    layoutOptions: {
      algorithm: 'layered',
      nodeSpacing: 100,
      layerSpacing: 100,
      edgeSpacing: 15,
      thoroughness: 8,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 25,
      componentSpacing: 40,
    },
    fitViewOptions: {
      padding: 0.2,
      minZoom: 0.3,
      maxZoom: 2,
      duration: 1200,
    },
    constraints: {
      minWidth: 800,
      minHeight: 600,
    },
    pageLayout: {
      layout: 'split',
      minVizHeight: 600,
    },
  },

  'hsm-checkout': {
    name: 'HSM Checkout',
    description: 'Multi-step process with parallel states - needs balanced layout',
    layoutOptions: {
      algorithm: 'layered',
      nodeSpacing: 120,
      layerSpacing: 110,
      edgeSpacing: 18,
      thoroughness: 7,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 28,
      componentSpacing: 45,
    },
    fitViewOptions: {
      padding: 0.22,
      minZoom: 0.4,
      maxZoom: 2.2,
      duration: 1100,
    },
    constraints: {
      minWidth: 700,
      minHeight: 500,
    },
    pageLayout: {
      layout: 'split',
      minVizHeight: 550,
    },
  },

  // Simple examples - better stacked
  'toggle': {
    name: 'Toggle',
    description: 'Simple on/off - better stacked for compact view',
    layoutOptions: {
      algorithm: 'layered',
      nodeSpacing: 80,
      layerSpacing: 80,
      edgeSpacing: 10,
      thoroughness: 5,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 20,
      componentSpacing: 30,
    },
    fitViewOptions: {
      padding: 0.15,
      minZoom: 0.6,
      maxZoom: 2,
      duration: 800,
    },
    constraints: {
      minWidth: 400,
      minHeight: 300,
    },
    pageLayout: {
      layout: 'stacked',
      minVizHeight: 300,
    },
  },

  'counter': {
    name: 'Counter',
    description: 'Simple counter - better stacked for compact view',
    layoutOptions: {
      algorithm: 'layered',
      nodeSpacing: 80,
      layerSpacing: 80,
      edgeSpacing: 10,
      thoroughness: 5,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 20,
      componentSpacing: 30,
    },
    fitViewOptions: {
      padding: 0.15,
      minZoom: 0.6,
      maxZoom: 2,
      duration: 800,
    },
    constraints: {
      minWidth: 400,
      minHeight: 300,
    },
    pageLayout: {
      layout: 'stacked',
      minVizHeight: 300,
    },
  },

  // Default fallback for unknown examples
  'default': {
    name: 'Default',
    description: 'Balanced settings for most examples',
    layoutOptions: {
      algorithm: 'layered',
      nodeSpacing: 120,
      layerSpacing: 180,
      edgeSpacing: 20,
      thoroughness: 7,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 30,
      componentSpacing: 60,
    },
    fitViewOptions: {
      padding: 0.3,
      minZoom: 0.01,
      maxZoom: 3,
      duration: 1200,
    },
    constraints: {
      minWidth: 600,
      minHeight: 400,
    },
    pageLayout: {
      layout: 'split',
      minVizHeight: 500,
    },
  },
};

/**
 * Get the optimal preset for a given example
 */
export function getReactFlowPreset(exampleName: string): ReactFlowPreset {
  // Handle variations of example names
  const normalizedName = exampleName.toLowerCase().replace(/[-_]/g, '');
  
  // Direct matches
  if (normalizedName.includes('trafficlight')) {
    return REACTFLOW_PRESETS['traffic-light'];
  }
  if (normalizedName.includes('combobox')) {
    return REACTFLOW_PRESETS['hsm-combobox'];
  }
  if (normalizedName.includes('checkout')) {
    return REACTFLOW_PRESETS['hsm-checkout'];
  }
  if (normalizedName.includes('toggle')) {
    return REACTFLOW_PRESETS['toggle'];
  }
  if (normalizedName.includes('counter')) {
    return REACTFLOW_PRESETS['counter'];
  }
  
  // Fallback
  return REACTFLOW_PRESETS['default'];
}

/**
 * Apply preset to ReactFlowInspector
 */
export function applyReactFlowPreset(preset: ReactFlowPreset) {
  return {
    layoutOptions: preset.layoutOptions,
    fitViewOptions: preset.fitViewOptions,
    constraints: preset.constraints,
  };
}
