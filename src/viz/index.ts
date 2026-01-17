// Core visualization - lightweight, no external deps
export { default as SketchInspector } from "./SketchInspector";
export type { InspectorTheme } from "./theme";
export { defaultTheme, generateCSSVariables, applyTheme } from "./theme";

// Mermaid and ForceGraph moved to separate packages:
// - @matchina/viz-mermaid
// - @matchina/viz-forcegraph (deprecated)
