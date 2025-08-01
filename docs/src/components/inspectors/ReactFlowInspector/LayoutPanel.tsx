import React, { memo } from "react";
import { useCallback, useEffect, useRef } from "react";

export interface LayoutOptions {
  direction: "DOWN" | "RIGHT" | "UP" | "LEFT";
  algorithm: string;
  nodeSpacing: number;
  edgeNodeSpacing?: number;
  layerSpacing: number;
  edgeSpacing: number;
  thoroughness?: number;
  aspectRatio?: number;
  compactComponents?: boolean;
  separateComponents?: boolean;
}

interface LayoutPanelProps {
  options: LayoutOptions;
  onOptionsChange: (options: LayoutOptions) => void;
}

import { getAlgorithmInfo, getAvailableAlgorithms } from "./utils/elkLayout";

const LayoutPanel: React.FC<LayoutPanelProps> = memo(
  ({ options, onOptionsChange }) => {
    // Always open when shown in the portal
    const debounceRef = useRef<NodeJS.Timeout>(null);
    const algorithmConfig = getAlgorithmInfo(options.algorithm);
    const availableAlgorithms = getAvailableAlgorithms();

    const handleChange = useCallback(
      (key: keyof LayoutOptions, value: any) => {
        const newOptions = { ...options, [key]: value };
        onOptionsChange(newOptions);

        // Clear existing debounce
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        // Auto-apply after 300ms of no changes
        debounceRef.current = setTimeout(() => {
          // Trigger re-layout by updating a key or calling a callback
          // This will be handled by the parent component
        }, 300);
      },
      [options, onOptionsChange]
    );

    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
        <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-t-lg w-full">
          <span className="text-lg">⚙️</span>
          Layout Options
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {algorithmConfig.name}
          </span>
        </div>

        <div className="border-t p-4 space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Algorithm
            </label>
            <select
              value={options.algorithm}
              onChange={(e) => handleChange("algorithm", e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableAlgorithms.map((algo) => {
                const config = getAlgorithmInfo(algo);
                return (
                  <option key={algo} value={algo}>
                    {config.name}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {algorithmConfig.description}
            </p>
          </div>

          {algorithmConfig.supportsDirection && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Direction
              </label>
              <select
                value={options.direction}
                onChange={(e) => handleChange("direction", e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="RIGHT">Horizontal (Left to Right)</option>
                <option value="DOWN">Vertical (Top to Bottom)</option>
                <option value="LEFT">Horizontal (Right to Left)</option>
                <option value="UP">Vertical (Bottom to Top)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Node Spacing: {options.nodeSpacing}px
            </label>
            <input
              type="range"
              min="40"
              max="200"
              step="10"
              value={options.nodeSpacing}
              onChange={(e) =>
                handleChange("nodeSpacing", parseInt(e.target.value))
              }
              className="w-full accent-blue-600"
            />
          </div>

          {algorithmConfig.hasLayerSpacing && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {options.algorithm === "force"
                  ? "Repulsion Strength"
                  : algorithmConfig.supportsDirection
                    ? "Layer Spacing"
                    : "Distance"}
                : {options.layerSpacing}px
              </label>
              <input
                type="range"
                min={options.algorithm === "force" ? "20" : "60"}
                max={options.algorithm === "force" ? "200" : "300"}
                step="10"
                value={options.layerSpacing}
                onChange={(e) =>
                  handleChange("layerSpacing", parseInt(e.target.value))
                }
                className="w-full accent-blue-600"
              />
            </div>
          )}

          {algorithmConfig.hasEdgeNodeSpacing && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Edge-Node Spacing: {options.edgeNodeSpacing || 20}px
              </label>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={options.edgeNodeSpacing || 20}
                onChange={(e) =>
                  handleChange("edgeNodeSpacing", parseInt(e.target.value))
                }
                className="w-full accent-blue-600"
              />
            </div>
          )}

          {algorithmConfig.hasThoroughness && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Thoroughness: {options.thoroughness || 7}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={options.thoroughness || 7}
                onChange={(e) =>
                  handleChange("thoroughness", parseInt(e.target.value))
                }
                className="w-full accent-blue-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher values = better quality, slower layout
              </p>
            </div>
          )}

          {/* Aspect ratio controls removed as they don't work properly */}

          <div className="space-y-2">
            {options.algorithm === "layered" && (
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={options.compactComponents || false}
                  onChange={(e) =>
                    handleChange("compactComponents", e.target.checked)
                  }
                  className="rounded"
                />
                Compact Layout (affects node placement strategy)
              </label>
            )}
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={options.separateComponents || false}
                onChange={(e) =>
                  handleChange("separateComponents", e.target.checked)
                }
                className="rounded"
              />
              Separate Disconnected Components
            </label>
          </div>
        </div>
      </div>
    );
  }
);

LayoutPanel.displayName = "LayoutPanel";

export default LayoutPanel;
