import React, { memo, useCallback, useEffect, useRef } from 'react';
import { getDefaultLayoutOptions, getAvailableAlgorithms, getAlgorithmInfo } from './elkLayout';
import type { LayoutOptions } from './elkLayout';

interface LayoutPanelProps {
  options: LayoutOptions;
  onOptionsChange: (options: LayoutOptions) => void;
}

const LayoutPanel: React.FC<LayoutPanelProps> = memo(({
  options,
  onOptionsChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const algorithmConfig = getAlgorithmInfo(options.algorithm);
  const availableAlgorithms = getAvailableAlgorithms();

  const handleChange = useCallback((key: keyof LayoutOptions, value: any) => {
    const newOptions = { ...options, [key]: value };
    onOptionsChange(newOptions);
    
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, [options, onOptionsChange]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        Layout Options
        <span className="ml-auto text-xs text-gray-500">
          {algorithmConfig.name}
        </span>
      </button>
      
      {isOpen && (
        <div className="border-t p-4 space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Algorithm
            </label>
            <select
              value={options.algorithm}
              onChange={(e) => handleChange('algorithm', e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableAlgorithms.map((algo: string) => {
                const config = getAlgorithmInfo(algo);
                return (
                  <option key={algo} value={algo}>
                    {config.name}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-gray-500 mt-1">{algorithmConfig.description}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Direction
            </label>
            <select
              value={options.direction}
              onChange={(e) => handleChange('direction', e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DOWN">Top to Bottom</option>
              <option value="RIGHT">Left to Right</option>
              <option value="UP">Bottom to Top</option>
              <option value="LEFT">Right to Left</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Node Spacing
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="20"
                max="100"
                value={options.nodeSpacing}
                onChange={(e) => handleChange('nodeSpacing', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs w-8 text-right">{options.nodeSpacing}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Layer Spacing
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="20"
                max="150"
                value={options.layerSpacing}
                onChange={(e) => handleChange('layerSpacing', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs w-8 text-right">{options.layerSpacing}</span>
            </div>
          </div>

          {options.algorithm === 'layered' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Edge Spacing
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={options.edgeSpacing}
                    onChange={(e) => handleChange('edgeSpacing', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs w-8 text-right">{options.edgeSpacing}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={options.separateComponents || false}
                    onChange={(e) => handleChange('separateComponents', e.target.checked)}
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">Separate Components</span>
                </label>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={options.compactComponents || false}
                    onChange={(e) => handleChange('compactComponents', e.target.checked)}
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">Compact Components</span>
                </label>
              </div>
            </>
          )}

          <div className="pt-2 border-t">
            <button
              onClick={() => onOptionsChange(getDefaultLayoutOptions())}
              className="w-full py-1 px-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

LayoutPanel.displayName = 'LayoutPanel';

export default LayoutPanel;
