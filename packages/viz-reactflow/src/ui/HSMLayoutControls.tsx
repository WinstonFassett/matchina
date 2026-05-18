/**
 * Layout controls for HSM visualizers
 * Only shows hierarchical layouts that can properly handle parent-child relationships
 */

import React, { useState, useRef } from 'react';
import { FloatingPanel } from './FloatingPanel';
import type { ILayoutManager as LayoutManager } from '../layout/types';
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
    // ELK engine handles all layout types - always use it for defaults
    const engine = layoutManager.getEngine(LayoutType.HIERARCHICAL);
    if (engine) {
      onLayoutChange(type, engine.getDefaultSettings());
    }
  };

    return (
    <div className="relative">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-xs border border-border bg-background text-foreground hover:bg-muted/50 transition-colors"
        data-testid="hsm-layout-trigger"
      >
        <span>{LAYOUT_INFO[currentLayoutType]?.icon}</span>
        <span>{LAYOUT_INFO[currentLayoutType]?.name}</span>
        <span className="text-muted-foreground">▼</span>
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
                max="300"
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
                    Layer Spacing: {currentSettings?.layerSpacing || 180}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    value={currentSettings?.layerSpacing || 180}
                    onChange={(e) => handleSettingChange('layerSpacing', Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Vertical spacing between layers
                  </p>
                </div>
              </>
            )}

          </div>
        </FloatingPanel>
      )}
    </div>
  );
}
