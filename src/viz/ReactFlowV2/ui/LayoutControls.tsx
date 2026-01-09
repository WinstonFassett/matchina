/**
 * Layout controls component
 * Modern UI for configuring layout options
 */

import React, { useRef, useState } from 'react';
import type { LayoutPreset, LayoutManager, AnyLayoutSettings } from '../layout/types';
import { LayoutType } from '../layout/types';
import { layoutManager } from '../layout/LayoutManager';
import { FloatingPanel } from './FloatingPanel';

interface LayoutControlsProps {
  layoutManager: LayoutManager;
  onLayoutChange: (type: LayoutType, settings: AnyLayoutSettings) => void;
  currentLayoutType: LayoutType;
  currentSettings: AnyLayoutSettings;
}

export function LayoutControls({
  layoutManager,
  onLayoutChange,
  currentLayoutType,
  currentSettings,
}: LayoutControlsProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const availableEngines = layoutManager.getAvailableEngines();
  const availablePresets = layoutManager.getPresets();
  const currentEngine = layoutManager.getEngine(currentLayoutType);

  const handleLayoutTypeChange = (type: LayoutType) => {
    const engine = layoutManager.getEngine(type);
    if (engine) {
      const defaultSettings = engine.getDefaultSettings();
      onLayoutChange(type, defaultSettings);
    }
  };

  const handlePresetApply = (preset: LayoutPreset) => {
    onLayoutChange(preset.layoutType, preset.settings);
  };

  const handleSettingChange = (key: string, value: unknown) => {
    const updatedSettings = { ...currentSettings, [key]: value };
    onLayoutChange(currentLayoutType, updatedSettings);
  };

  // Helper to safely get numeric settings
  const getNumeric = (key: string, defaultValue: number): number => {
    const value = currentSettings[key];
    return typeof value === 'number' ? value : defaultValue;
  };

  // Helper to safely get string settings
  const getString = (key: string, defaultValue: string): string => {
    const value = currentSettings[key];
    return typeof value === 'string' ? value : defaultValue;
  };

  const handleReset = () => {
    if (currentEngine) {
      const defaultSettings = currentEngine.getDefaultSettings();
      onLayoutChange(currentLayoutType, defaultSettings);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsPanelOpen(true)}
        className="flex items-center gap-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="Open layout controls"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        <span>Layout</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Panel */}
      <FloatingPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        anchorRef={buttonRef}
        title="Layout Controls"
        width={360}
        height={480}
      >
        <div className="space-y-6">
          {/* Layout Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Layout Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableEngines.map((engine) => (
                <button
                  key={engine.type}
                  type="button"
                  onClick={() => handleLayoutTypeChange(engine.type)}
                  className={`p-2 text-xs rounded border transition-colors ${
                    currentLayoutType === engine.type
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="font-medium">{engine.name}</div>
                  <div className="text-xs opacity-75 mt-1">{engine.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Presets
            </label>
            <div className="space-y-2">
              {availablePresets
                .filter(preset => preset.layoutType === currentLayoutType)
                .map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetApply(preset)}
                    className="w-full text-left p-2 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">{preset.name}</div>
                    <div className="text-gray-600 dark:text-gray-400">{preset.description}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {preset.tags.map(tag => (
                        <span key={tag} className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Settings */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Settings
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Reset to Default
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Universal Settings */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Node Spacing: {getNumeric('nodeSpacing', 120)}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="500"
                  value={getNumeric('nodeSpacing', 120)}
                  onChange={(e) => handleSettingChange('nodeSpacing', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Edge Spacing: {getNumeric('edgeSpacing', 20)}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={getNumeric('edgeSpacing', 20)}
                  onChange={(e) => handleSettingChange('edgeSpacing', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Compactness: {Math.round(getNumeric('compactness', 0.7) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={getNumeric('compactness', 0.7)}
                  onChange={(e) => handleSettingChange('compactness', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  View Padding: {getNumeric('fitPadding', 20)}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={getNumeric('fitPadding', 20)}
                  onChange={(e) => handleSettingChange('fitPadding', Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Layout-specific settings would go here */}
              {currentLayoutType === LayoutType.GRID && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Alignment
                    </label>
                    <select
                      value={getString('alignment', 'center')}
                      onChange={(e) => handleSettingChange('alignment', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    >
                      <option value="start">Start</option>
                      <option value="center">Center</option>
                      <option value="end">End</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Direction
                    </label>
                    <select
                      value={getString('direction', 'row')}
                      onChange={(e) => handleSettingChange('direction', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    >
                      <option value="row">Row</option>
                      <option value="column">Column</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Apply Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Apply Layout
            </button>
          </div>
        </div>
      </FloatingPanel>
    </>
  );
}
