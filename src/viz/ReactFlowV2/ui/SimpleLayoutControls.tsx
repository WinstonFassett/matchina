/**
 * Simple, honest layout controls for grid layout
 * Only shows settings that actually work
 */

import React, { useState, useRef } from 'react';
import { FloatingPanel } from './FloatingPanel';
import type { LayoutManager } from '../layout/types';
import { LayoutType } from '../layout/types';

interface SimpleLayoutControlsProps {
  layoutManager: LayoutManager;
  onLayoutChange: (type: LayoutType, settings: any) => void;
  currentLayoutType: LayoutType;
  currentSettings: any;
}

export function SimpleLayoutControls({
  layoutManager,
  onLayoutChange,
  currentLayoutType,
  currentSettings,
}: SimpleLayoutControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!layoutManager) {
    return null;
  }

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...currentSettings, [key]: value };
    onLayoutChange(currentLayoutType, newSettings);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="Configure grid layout"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        Grid Layout
        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Panel */}
      <FloatingPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={triggerRef}
        title="Grid Layout Settings"
        width={320}
        height={400}
      >
        <div className="space-y-4">
          {/* Node Spacing - ACTUALLY WORKS */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Node Spacing: {currentSettings.nodeSpacing}px
            </label>
            <input
              type="range"
              min="20"
              max="200"
              step="5"
              value={currentSettings.nodeSpacing || 120}
              onChange={(e) => handleSettingChange('nodeSpacing', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Tight</span>
              <span>Spacious</span>
            </div>
          </div>

          {/* Direction - ACTUALLY WORKS */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Layout Direction
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSettingChange('direction', 'row')}
                className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                  currentSettings.direction === 'row'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Rows
              </button>
              <button
                type="button"
                onClick={() => handleSettingChange('direction', 'column')}
                className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                  currentSettings.direction === 'column'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Columns
              </button>
            </div>
          </div>

          {/* Alignment - ACTUALLY WORKS */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Alignment
            </label>
            <div className="flex gap-1">
              {(['start', 'center', 'end'] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => handleSettingChange('alignment', align)}
                  className={`flex-1 px-2 py-1 text-xs rounded capitalize transition-colors ${
                    currentSettings.alignment === align
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          {/* Columns - ACTUALLY WORKS */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Columns: {currentSettings.cols || 'Auto'}
            </label>
            <select
              value={currentSettings.cols || ''}
              onChange={(e) => handleSettingChange('cols', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Auto (square)</option>
              <option value="1">1 column</option>
              <option value="2">2 columns</option>
              <option value="3">3 columns</option>
              <option value="4">4 columns</option>
              <option value="5">5 columns</option>
            </select>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Only grid layout is available right now. ELK layout coming soon.
          </p>
        </div>
      </FloatingPanel>
    </>
  );
}
