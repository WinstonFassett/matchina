// Layout settings and position persistence utilities

export interface LayoutSettings {
  direction: "DOWN" | "RIGHT" | "UP" | "LEFT";
  algorithm: string;
  nodeSpacing: number;
  layerSpacing: number;
  edgeSpacing: number;
  thoroughness?: number;
  aspectRatio?: number;
  compactComponents?: boolean;
  separateComponents?: boolean;
  edgeNodeSpacing?: number;
}

export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

const LAYOUT_SETTINGS_KEY = "xstate-visualizer-layout-settings";
const NODE_POSITIONS_KEY = "xstate-visualizer-node-positions";

// Layout settings persistence
export const saveLayoutSettings = (settings: LayoutSettings): void => {
  try {
    localStorage.setItem(LAYOUT_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn("Failed to save layout settings:", error);
  }
};

export const loadLayoutSettings = (): LayoutSettings | null => {
  try {
    const saved = localStorage.getItem(LAYOUT_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn("Failed to load layout settings:", error);
    return null;
  }
};

// Node positions persistence (per machine)
export const saveNodePositions = (
  machineId: string,
  positions: NodePosition[]
): void => {
  try {
    const key = `${NODE_POSITIONS_KEY}-${machineId}`;
    localStorage.setItem(key, JSON.stringify(positions));
  } catch (error) {
    console.warn("Failed to save node positions:", error);
  }
};

export const loadNodePositions = (machineId: string): NodePosition[] | null => {
  try {
    const key = `${NODE_POSITIONS_KEY}-${machineId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn("Failed to load node positions:", error);
    return null;
  }
};

export const clearNodePositions = (machineId: string): void => {
  try {
    const key = `${NODE_POSITIONS_KEY}-${machineId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Failed to clear node positions:", error);
  }
};

// Clear all ReactFlow visualizer data
export const clearAllData = (): void => {
  try {
    // Clear layout settings
    localStorage.removeItem(LAYOUT_SETTINGS_KEY);
    
    // Clear all node positions
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(NODE_POSITIONS_KEY)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Cleared ${keysToRemove.length + 1} ReactFlow visualizer entries`);
  } catch (error) {
    console.warn("Failed to clear all data:", error);
  }
};

// Disable persistence by returning null for all loads
let persistenceDisabled = false;

export const disablePersistence = (): void => {
  persistenceDisabled = true;
  clearAllData();
};

export const enablePersistence = (): void => {
  persistenceDisabled = false;
};

// Override load functions to respect persistence flag
export const loadLayoutSettingsSafe = (): LayoutSettings | null => {
  if (persistenceDisabled) return null;
  return loadLayoutSettings();
};

export const loadNodePositionsSafe = (machineId: string): NodePosition[] | null => {
  if (persistenceDisabled) return null;
  return loadNodePositions(machineId);
};
