/**
 * Example-specific ReactFlow optimization presets
 * Each example gets custom layout options for perfect initial view
 */

export interface ReactFlowPreset {
  name: string;
  description: string;
  layoutOptions: {
    direction: "DOWN" | "RIGHT" | "UP" | "LEFT";
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
    minZoom?: number;
    maxZoom?: number;
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
      direction: 'DOWN',
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
    description: 'Complex hierarchy with nested states - ReactFlow for better visualization',
    layoutOptions: {
      direction: 'DOWN',
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
    description: 'Multi-step process with parallel states - side-by-side with tree layout vertical',
    layoutOptions: {
      algorithm: 'mrtree',  // Tree layout vertical
      direction: 'DOWN',    // Vertical layout
      nodeSpacing: 120,    // Horizontal spacing between nodes
      layerSpacing: 100,   // Vertical spacing between layers (reduced from 150)
      edgeSpacing: 20,     // Edge clearance
      thoroughness: 7,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 35,
      componentSpacing: 50,
    },
    fitViewOptions: {
      padding: 0.25,
      duration: 1100,
    },
    constraints: {
      minWidth: 800,
      minHeight: 600,
    },
    pageLayout: {
      layout: 'split',     // Changed from stacked to side-by-side
      minVizHeight: 500,
    },
  },

  // Simple examples - side-by-side for consistency
  'toggle': {
    name: 'Toggle',
    description: 'Simple on/off - layered layout for clean vertical stacking',
    layoutOptions: {
      direction: 'DOWN',
      algorithm: 'layered',  // Sugiyama layout for clean vertical stacking
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
      duration: 800,
    },
    constraints: {
      minWidth: 400,
      minHeight: 300,
    },
    pageLayout: {
      layout: 'split',
      minVizHeight: 400,
    },
  },

  'counter': {
    name: 'Counter',
    description: 'Simple counter - improved edge routing for parallel edges',
    layoutOptions: {
      direction: 'DOWN',
      algorithm: 'layered',
      nodeSpacing: 100,    // Increased spacing for better edge routing
      layerSpacing: 100,   // Increased spacing for better edge routing
      edgeSpacing: 15,      // Increased edge spacing
      thoroughness: 5,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 25,
      componentSpacing: 30,
    },
    fitViewOptions: {
      padding: 0.15,
      duration: 800,
    },
    constraints: {
      minWidth: 400,
      minHeight: 300,
    },
    pageLayout: {
      layout: 'split',
      minVizHeight: 400,
    },
  },

  // Traffic light with sugiyama layout and layer spacing 100px
  'hsm-traffic-light': {
    name: 'HSM Traffic Light',
    description: 'Traffic light with side-by-side layout and sugiyama vertical, layer spacing 100px',
    layoutOptions: {
      algorithm: 'layered',  // Sugiyama layout
      direction: 'DOWN',     // Vertical layout
      nodeSpacing: 120,
      layerSpacing: 100,     // Layer spacing 100px as requested
      edgeSpacing: 20,
      thoroughness: 7,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 30,
      componentSpacing: 50,
    },
    fitViewOptions: {
      padding: 0.25,
      duration: 1000,
    },
    constraints: {
      minWidth: 600,
      minHeight: 400,
    },
    pageLayout: {
      layout: 'split',     // Side-by-side with app portion
      minVizHeight: 500,
    },
  },

  // Authentication flow with sugiyama layout
  'auth-flow': {
    name: 'Authentication Flow',
    description: 'Authentication flow with ReactFlow sugiyama layout',
    layoutOptions: {
      algorithm: 'layered',  // Sugiyama layout
      direction: 'DOWN',     // Vertical layout
      nodeSpacing: 120,
      layerSpacing: 150,
      edgeSpacing: 20,
      thoroughness: 7,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 30,
      componentSpacing: 50,
    },
    fitViewOptions: {
      padding: 0.25,
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

  // Advanced fetcher with sugiyama vertical layout
  'fetcher-advanced': {
    name: 'Advanced Fetcher',
    description: 'Advanced fetcher with sugiyama vertical layout',
    layoutOptions: {
      algorithm: 'layered',  // Sugiyama vertical layout
      direction: 'DOWN',     // Vertical layout
      nodeSpacing: 120,
      layerSpacing: 150,
      edgeSpacing: 20,
      thoroughness: 7,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 30,
      componentSpacing: 50,
    },
    fitViewOptions: {
      padding: 0.25,
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

  // Promise Machine Factory with tree layout vertical
  'promise-machine-fetcher': {
    name: 'Promise Machine Factory',
    description: 'Promise machine factory with ReactFlow tree layout vertical',
    layoutOptions: {
      algorithm: 'mrtree',  // Tree layout vertical
      direction: 'DOWN',    // Vertical layout
      nodeSpacing: 120,
      layerSpacing: 100,
      edgeSpacing: 20,
      thoroughness: 7,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 30,
      componentSpacing: 50,
    },
    fitViewOptions: {
      padding: 0.25,
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

  // Async calculator with tree layout vertical
  'async-calculator': {
    name: 'Async Calculator',
    description: 'Async calculator with ReactFlow tree layout vertical',
    layoutOptions: {
      algorithm: 'mrtree',  // Tree layout vertical
      direction: 'DOWN',    // Vertical layout
      nodeSpacing: 120,
      layerSpacing: 100,
      edgeSpacing: 20,
      thoroughness: 7,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 30,
      componentSpacing: 50,
    },
    fitViewOptions: {
      padding: 0.25,
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

  // Rock paper scissors with side-by-side and force directed
  'rock-paper-scissors': {
    name: 'Rock Paper Scissors',
    description: 'Rock paper scissors with side-by-side layout, force directed',
    layoutOptions: {
      algorithm: 'force',  // Force directed layout
      direction: 'DOWN',
      nodeSpacing: 200,    // Distance 200 as requested
      layerSpacing: 200,   // Distance 200 as requested
      edgeSpacing: 20,
      thoroughness: 7,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 30,
      componentSpacing: 50,
    },
    fitViewOptions: {
      padding: 0.25,
      duration: 1000,
    },
    constraints: {
      minWidth: 600,
      minHeight: 400,
    },
    pageLayout: {
      layout: 'split',     // Side-by-side layout
      minVizHeight: 500,
    },
  },

  // Stopwatch examples with force directed layout
  'stopwatch': {
    name: 'Stopwatch',
    description: 'Stopwatch examples with ReactFlow force directed layout',
    layoutOptions: {
      algorithm: 'force',  // Force directed layout for triangle arrangement
      direction: 'DOWN',
      nodeSpacing: 150,
      layerSpacing: 150,
      edgeSpacing: 20,
      thoroughness: 7,
      compactComponents: false,
      separateComponents: false,
      edgeNodeSpacing: 30,
      componentSpacing: 50,
    },
    fitViewOptions: {
      padding: 0.25,
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
  'default': {
    name: 'Default',
    description: 'Balanced settings for most examples',
    layoutOptions: {
      direction: 'DOWN',
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
    return REACTFLOW_PRESETS['hsm-traffic-light'];
  }
  if (normalizedName.includes('combobox')) {
    return REACTFLOW_PRESETS['hsm-combobox'];
  }
  if (normalizedName.includes('checkout')) {
    return REACTFLOW_PRESETS['hsm-checkout'];
  }
  if (normalizedName.includes('auth')) {
    return REACTFLOW_PRESETS['auth-flow'];
  }
  if (normalizedName.includes('fetcher') && normalizedName.includes('advanced')) {
    return REACTFLOW_PRESETS['fetcher-advanced'];
  }
  if (normalizedName.includes('promise') && normalizedName.includes('machine')) {
    return REACTFLOW_PRESETS['promise-machine-fetcher'];
  }
  if (normalizedName.includes('async') && normalizedName.includes('calculator')) {
    return REACTFLOW_PRESETS['async-calculator'];
  }
  if (normalizedName.includes('rock') && normalizedName.includes('paper') && normalizedName.includes('scissors')) {
    return REACTFLOW_PRESETS['rock-paper-scissors'];
  }
  if (normalizedName.includes('stopwatch')) {
    return REACTFLOW_PRESETS['stopwatch'];
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
