// React visualization suite
export { BlockInspector } from './inspectors';
export type { BlockInspectorProps } from './inspectors';

// Theme utilities
export { useTheme, useThemeVariables } from './theme';
export { defaultTheme, generateCSSVariables } from './theme';
export type { InspectorTheme } from 'matchina/viz';

// History/time travel
export { HistoryProvider, useHistory, useTimeTravel } from './history';
export type { HistoryEntry, HistoryState, HistoryAction } from './history';
