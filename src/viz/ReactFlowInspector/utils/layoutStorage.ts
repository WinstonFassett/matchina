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
