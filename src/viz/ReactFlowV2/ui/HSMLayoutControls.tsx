/**
 * Layout controls for HSM visualizers
 * Only shows hierarchical layouts that can properly handle parent-child relationships
 */

import React, { useState, useRef } from 'react';
import { FloatingPanel } from './FloatingPanel';
import type { LayoutManager } from '../layout/types';
import { LayoutType } from '../layout/types';

interface HSMLayoutControlsProps {
  layoutManager: LayoutManager;
  onLayoutChange: (type: LayoutType, settings: any) => void;
  currentLayoutType: LayoutType;
  currentSettings: any;
}

// All layout types available for HSM (V1 supported all these with group sizing)
const HSM_LAYOUT_TYPES = [
  LayoutType.HIERARCHICAL,
  LayoutType.TREE,
  LayoutType.FORCE_DIRECTED,
  LayoutType.ORGANIC,
  LayoutType.CIRCULAR,
  LayoutType.GRID,
];

// Layout type display info for HSM
const LAYOUT_INFO: Record<LayoutType, { name: string; icon: string; description: string }> = {
  [LayoutType.HIERARCHICAL]: {
    name: 'Sugiyama',
    icon: '⬎',
    description: 'Sugiyama layered layout (best for state machines)',
  },
  [LayoutType.TREE]: {
    name: 'Tree',
    icon: '🌲',
    description: 'Tree layout (mrtree algorithm)',
  },
  [LayoutType.GRID]: {
    name: 'Grid',
    icon: '⊞',
    description: 'Simple grid arrangement',
  },
  [LayoutType.CIRCULAR]: {
    name: 'Circular',
    icon: '◯',
    description: 'Radial arrangement',
  },
  [LayoutType.FORCE_DIRECTED]: {
    name: 'Force',
    icon: '⚡',
    description: 'Physics-based layout',
  },
  [LayoutType.ORGANIC]: {
    name: 'Organic',
    icon: '❀',
    description: 'Natural clustering',
  },
};

export function HSMLayoutControls({
  layoutManager,
  onLayoutChange,
  currentLayoutType,
  currentSettings,
}: HSMLayoutControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!layoutManager) {
    return null;
  }

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...currentSettings, [key]: value };
    onLayoutChange(currentLayoutType, newSettings);
  };

  const handleLayoutTypeChange = (type: LayoutType) => {
    // Get the first preset for this layout type
    const presets = layoutManager.getPresets(type);
    const preset = presets.find((p: any) => p.tags?.includes('hsm')) || presets[0];
    
    if (preset) {
      onLayoutChange(type, preset.settings);
    }
  };

    return (
    <div className="relative">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
        data-testid="hsm-layout-trigger"
      >
        <span>{LAYOUT_INFO[currentLayoutType]?.icon}</span>
        <span>{LAYOUT_INFO[currentLayoutType]?.name}</span>
        <span className="text-gray-400 dark:text-gray-500">▼</span>
      </button>

      {isOpen && (
        <FloatingPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          anchorRef={triggerRef}
          title="Hierarchical Layout Settings"
        >
          <div className="space-y-3">
            {/* Layout Type Selection - Compact horizontal row */}
            <div className="flex flex-wrap gap-1">
              {HSM_LAYOUT_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleLayoutTypeChange(type)}
                  title={LAYOUT_INFO[type]?.description}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                    currentLayoutType === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <span>{LAYOUT_INFO[type]?.icon}</span>
                  <span>{LAYOUT_INFO[type]?.name}</span>
                </button>
              ))}
            </div>

            {/* Common spacing control for all layouts */}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Node Spacing: {currentSettings?.nodeSpacing || 120}
              </label>
              <input
                type="range"
                min="50"
                max="500"
                value={currentSettings?.nodeSpacing || 120}
                onChange={(e) => handleSettingChange('nodeSpacing', Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Hierarchical/Tree-specific settings */}
            {(currentLayoutType === LayoutType.HIERARCHICAL || currentLayoutType === LayoutType.TREE) && (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Direction</label>
                  <div className="flex gap-1 mt-1">
                    {['DOWN', 'UP', 'RIGHT', 'LEFT'].map(dir => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => handleSettingChange('direction', dir)}
                        className={`px-2 py-1 text-xs rounded ${
                          currentSettings?.direction === dir
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {dir === 'DOWN' ? '↓' : dir === 'UP' ? '↑' : dir === 'RIGHT' ? '→' : '←'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Layer Spacing: {currentSettings?.layerSpacing || 180}
                  </label>
                  <input
                    type="range"
                    min="40"
                    max="400"
                    value={currentSettings?.layerSpacing || 180}
                    onChange={(e) => handleSettingChange('layerSpacing', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Advanced ELK options for fine-tuning */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Edge Routing</label>
                  <select
                    value={currentSettings?.edgeRoutingStrategy || 'ORTHOGONAL'}
                    onChange={(e) => handleSettingChange('edgeRoutingStrategy', e.target.value)}
                    className="w-full mt-1 px-2 py-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="ORTHOGONAL">Orthogonal (Manhattan)</option>
                    <option value="POLYLINE">Polyline</option>
                    <option value="SPLINES">Curved</option>
                    <option value="STRAIGHT">Straight</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Node Placement</label>
                  <select
                    value={currentSettings?.nodePlacementStrategy || 'NETWORK_SIMPLEX'}
                    onChange={(e) => handleSettingChange('nodePlacementStrategy', e.target.value)}
                    className="w-full mt-1 px-2 py-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="NETWORK_SIMPLEX">Network Simplex (Best)</option>
                    <option value="SIMPLE">Simple (Fast)</option>
                    <option value="BRANDES_KOEPF">Brandes-Koepf</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Compaction</label>
                  <select
                    value={currentSettings?.compactionStrategy || 'NONE'}
                    onChange={(e) => handleSettingChange('compactionStrategy', e.target.value)}
                    className="w-full mt-1 px-2 py-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="NONE">None (Spacious)</option>
                    <option value="EDGE_LENGTH">Edge Length</option>
                    <option value="NODE_DIMENSIONS">Node Dimensions</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Thoroughness: {currentSettings?.thoroughness || 7}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={currentSettings?.thoroughness || 7}
                    onChange={(e) => handleSettingChange('thoroughness', Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Fast</span>
                    <span>Quality</span>
                  </div>
                </div>
              </>
            )}

            {/* Force/Organic - layer spacing controls distance */}
            {(currentLayoutType === LayoutType.FORCE_DIRECTED || currentLayoutType === LayoutType.ORGANIC) && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Edge Length: {currentSettings?.layerSpacing || 100}
                </label>
                <input
                  type="range"
                  min="40"
                  max="300"
                  value={currentSettings?.layerSpacing || 100}
                  onChange={(e) => handleSettingChange('layerSpacing', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Grid-specific settings */}
            {currentLayoutType === LayoutType.GRID && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Columns: {currentSettings?.columns || 3}
                </label>
                <input
                  type="range"
                  min="2"
                  max="6"
                  value={currentSettings?.columns || 3}
                  onChange={(e) => handleSettingChange('columns', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Circular-specific settings */}
            {currentLayoutType === LayoutType.CIRCULAR && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Start Angle: {currentSettings?.startAngle || 0}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="45"
                  value={currentSettings?.startAngle || 0}
                  onChange={(e) => handleSettingChange('startAngle', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </FloatingPanel>
      )}
    </div>
  );
}
