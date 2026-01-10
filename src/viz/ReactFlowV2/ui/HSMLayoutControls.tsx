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
        className="flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
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

                {/* Experimental: Alternating Direction for Hierarchical and Tree Layouts */}
                <div>
                  <label 
                    htmlFor="alternating-direction-toggle"
                    className="text-xs font-medium text-gray-600 dark:text-gray-400"
                  >
                    <span className="flex items-center gap-1">
                      Alternating Direction
                      <span className="text-xs text-gray-400 dark:text-gray-500">(Experimental)</span>
                    </span>
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      id="alternating-direction-toggle"
                      type="button"
                      onClick={() => handleSettingChange('alternatingDirection', !currentSettings?.alternatingDirection)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        currentSettings?.alternatingDirection
                          ? 'bg-blue-500'
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          currentSettings?.alternatingDirection ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {currentSettings?.alternatingDirection ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Alternates direction between hierarchy levels for more compact layouts
                  </p>
                </div>
              </>
            )}

            {/* Force/Organic - layer spacing controls distance */}
            {(currentLayoutType === LayoutType.FORCE_DIRECTED || currentLayoutType === LayoutType.ORGANIC) && (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Node Spacing: {currentSettings?.nodeSpacing || 150}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    value={currentSettings?.nodeSpacing || 150}
                    onChange={(e) => handleSettingChange('nodeSpacing', Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Horizontal spacing between nodes (~1.1x node width)
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Layer Spacing: {currentSettings?.layerSpacing || 200}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    value={currentSettings?.layerSpacing || 200}
                    onChange={(e) => handleSettingChange('layerSpacing', Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Vertical spacing between layers (~4.0x node height)
                  </p>
                </div>
              </>
            )}

            {/* Grid-specific settings */}
            {currentLayoutType === LayoutType.GRID && (
              <>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Columns: {currentSettings?.columns || 3}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={currentSettings?.columns || 3}
                    onChange={(e) => handleSettingChange('columns', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Max Columns: {currentSettings?.maxCols || 6}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    value={currentSettings?.maxCols || 6}
                    onChange={(e) => handleSettingChange('maxCols', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Max Rows: {currentSettings?.maxRows || 6}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    value={currentSettings?.maxRows || 6}
                    onChange={(e) => handleSettingChange('maxRows', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Grid Direction</label>
                  <div className="flex gap-1 mt-1">
                    {['row', 'column'].map(dir => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => handleSettingChange('direction', dir)}
                        className={`px-2 py-1 text-xs rounded capitalize ${
                          currentSettings?.direction === dir
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Alignment</label>
                  <div className="flex gap-1 mt-1">
                    {['start', 'center', 'end'].map(align => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => handleSettingChange('alignment', align)}
                        className={`px-2 py-1 text-xs rounded capitalize ${
                          currentSettings?.alignment === align
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Auto-fit Layout
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handleSettingChange('autoFit', !currentSettings?.autoFit)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        currentSettings?.autoFit
                          ? 'bg-blue-500'
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          currentSettings?.autoFit ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {currentSettings?.autoFit ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Automatically calculate optimal grid dimensions
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Prefer Square Grid
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handleSettingChange('preferSquare', !currentSettings?.preferSquare)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        currentSettings?.preferSquare
                          ? 'bg-blue-500'
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          currentSettings?.preferSquare ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {currentSettings?.preferSquare ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Create roughly square grids vs wider layouts
                  </p>
                </div>
              </>
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
