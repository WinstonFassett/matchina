/**
 * Unified visualization picker component
 * Provides a dropdown with a flat list of all available visualizer permutations
 */

export type VisualizerType =
  | 'reactflow'
  | 'sketch'
  | 'forcegraph'
  | 'mermaid-statechart'
  | 'mermaid-flowchart';

export interface VisualizerOption {
  value: VisualizerType;
  label: string;
}

export const VISUALIZERS: readonly VisualizerOption[] = [
  { value: 'reactflow', label: 'ReactFlow' },
  { value: 'sketch', label: 'Sketch' },
  { value: 'forcegraph', label: 'ForceGraph' },
  { value: 'mermaid-statechart', label: 'Mermaid - Statechart' },
  { value: 'mermaid-flowchart', label: 'Mermaid - Flowchart' },
] as const;

export interface VizPickerProps {
  value: VisualizerType;
  onChange: (value: VisualizerType) => void;
  availableViz?: VisualizerType[];
  className?: string;
}

/**
 * Dropdown picker for selecting visualizers
 * Shows a flat list of all available visualizer permutations
 */
export function VizPicker({
  value,
  onChange,
  availableViz,
  className = '',
}: VizPickerProps) {
  // Filter visualizers if specific ones are requested
  const options = availableViz
    ? VISUALIZERS.filter(v => availableViz.includes(v.value))
    : VISUALIZERS;

  // Don't show picker if only one option
  if (options.length <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Visualizer:
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as VisualizerType)}
        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
