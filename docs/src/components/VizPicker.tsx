/**
 * Unified visualization picker component
 * Provides a dropdown with a flat list of all available visualizer permutations
 */

export type VisualizerType = "reactflow" | "sketch" | "svg";

export interface VisualizerOption {
  value: VisualizerType;
  label: string;
}

export const VISUALIZERS: readonly VisualizerOption[] = [
  { value: "reactflow", label: "ReactFlow" },
  { value: "sketch", label: "Blocks" },
  { value: "svg", label: "SVG" },
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
  className = "",
}: VizPickerProps) {
  // Filter visualizers if specific ones are requested
  const options = availableViz
    ? VISUALIZERS.filter((v) => availableViz.includes(v.value))
    : VISUALIZERS;

  // Don't show picker if only one option
  if (options.length <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium text-foreground">
        Visualizer:
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as VisualizerType)}
        className="px-3 py-1 text-sm border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-border"
        data-testid="visualizer-picker"
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
