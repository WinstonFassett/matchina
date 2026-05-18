/**
 * Layout controls for all layout engines
 * Shows settings relevant to each layout type
 */

import React, { useState, useRef } from 'react';
import { FloatingPanel } from './FloatingPanel';
import type { ILayoutManager as LayoutManager } from '../layout/types';
import { LayoutType } from '../layout/types';

interface SimpleLayoutControlsProps {
  layoutManager: LayoutManager;
  onLayoutChange: (type: LayoutType, settings: any) => void;
  currentLayoutType: LayoutType;
  currentSettings: any;
}

// Layout type display info
const LAYOUT_INFO: Record<LayoutType, { name: string; icon: string; description: string }> = {
  [LayoutType.HIERARCHICAL]: {
    name: 'Sugiyama',
    icon: '⬎',
    description: 'Sugiyama layered layout',
  },
  [LayoutType.TREE]: {
    name: 'Tree',
    icon: '🌲',
    description: 'Tree layout (mrtree)',
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

  const handleLayoutTypeChange = (type: LayoutType) => {
    // ELK engine handles all layout types - always use it for defaults
    const engine = layoutManager.getEngine(LayoutType.HIERARCHICAL);
    if (engine) {
      onLayoutChange(type, engine.getDefaultSettings());
    }
  };

  const currentInfo = LAYOUT_INFO[currentLayoutType] || LAYOUT_INFO[LayoutType.HIERARCHICAL];

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="Configure layout"
      >
        <span className="text-base">{currentInfo.icon}</span>
        {currentInfo.name}
        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Panel */}
      <FloatingPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={triggerRef}
        title="Layout Settings"
        width={340}
        height={480}
      >
        <div className="space-y-4">
          {/* Layout Type Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Layout Type
            </label>
            <div className="grid grid-cols-5 gap-1">
              {Object.entries(LAYOUT_INFO).map(([type, info]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleLayoutTypeChange(type as LayoutType)}
                  className={`flex flex-col items-center p-2 rounded text-xs transition-colors ${
                    currentLayoutType === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title={info.description}
                >
                  <span className="text-lg mb-1">{info.icon}</span>
                  <span className="leading-tight">{info.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            {/* Layout-specific controls */}
            {currentLayoutType === LayoutType.HIERARCHICAL && (
              <HierarchicalControls settings={currentSettings} onChange={handleSettingChange} />
            )}
            {currentLayoutType === LayoutType.FORCE_DIRECTED && (
              <ForceControls settings={currentSettings} onChange={handleSettingChange} />
            )}
            {currentLayoutType === LayoutType.ORGANIC && (
              <OrganicControls settings={currentSettings} onChange={handleSettingChange} />
            )}
          </div>
        </div>
      </FloatingPanel>
    </>
  );
}

// Shared slider component
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  leftLabel,
  rightLabel,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  leftLabel?: string;
  rightLabel?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}: {value}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}

// Button group component
function ButtonGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
              value === opt.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Grid-specific controls
function GridControls({
  settings,
  onChange,
}: {
  settings: any;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <Slider
        label="Node Spacing"
        value={settings.nodeSpacing || 120}
        min={20}
        max={200}
        step={5}
        leftLabel="Tight"
        rightLabel="Spacious"
        onChange={(v) => onChange('nodeSpacing', v)}
      />

      <ButtonGroup
        label="Direction"
        value={settings.direction || 'row'}
        options={[
          { value: 'row', label: 'Rows' },
          { value: 'column', label: 'Columns' },
        ]}
        onChange={(v) => onChange('direction', v)}
      />

      <ButtonGroup
        label="Alignment"
        value={settings.alignment || 'center'}
        options={[
          { value: 'start', label: 'Start' },
          { value: 'center', label: 'Center' },
          { value: 'end', label: 'End' },
        ]}
        onChange={(v) => onChange('alignment', v)}
      />

      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Columns: {settings.cols || 'Auto'}
        </label>
        <select
          value={settings.cols || ''}
          onChange={(e) => onChange('cols', e.target.value ? Number(e.target.value) : undefined)}
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
  );
}

// Hierarchical (ELK) controls
function HierarchicalControls({
  settings,
  onChange,
}: {
  settings: any;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <ButtonGroup
        label="Flow Direction"
        value={settings.direction || 'DOWN'}
        options={[
          { value: 'DOWN', label: '↓ Down' },
          { value: 'UP', label: '↑ Up' },
          { value: 'RIGHT', label: '→ Right' },
          { value: 'LEFT', label: '← Left' },
        ]}
        onChange={(v) => onChange('direction', v)}
      />

      <Slider
        label="Node Spacing"
        value={settings.nodeSpacing || 100}
        min={30}
        max={200}
        step={10}
        leftLabel="Tight"
        rightLabel="Spacious"
        onChange={(v) => onChange('nodeSpacing', v)}
      />

      <Slider
        label="Layer Spacing"
        value={settings.layerSpacing || 60}
        min={30}
        max={200}
        step={10}
        leftLabel="Compact"
        rightLabel="Spread"
        onChange={(v) => onChange('layerSpacing', v)}
      />

      <ButtonGroup
        label="Edge Routing"
        value={settings.edgeRouting || 'ORTHOGONAL'}
        options={[
          { value: 'ORTHOGONAL', label: 'Angular' },
          { value: 'POLYLINE', label: 'Polyline' },
          { value: 'SPLINES', label: 'Curved' },
        ]}
        onChange={(v) => onChange('edgeRouting', v)}
      />

      <ButtonGroup
        label="Alignment"
        value={settings.alignment || 'CENTER'}
        options={[
          { value: 'LEFT', label: 'Left' },
          { value: 'CENTER', label: 'Center' },
          { value: 'RIGHT', label: 'Right' },
        ]}
        onChange={(v) => onChange('alignment', v)}
      />
    </div>
  );
}

// Circular controls
function CircularControls({
  settings,
  onChange,
}: {
  settings: any;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <Slider
        label="Node Spacing"
        value={settings.nodeSpacing || 100}
        min={40}
        max={200}
        step={10}
        leftLabel="Tight"
        rightLabel="Spacious"
        onChange={(v) => onChange('nodeSpacing', v)}
      />

      <Slider
        label="Start Angle"
        value={settings.startAngle || 0}
        min={0}
        max={360}
        step={15}
        leftLabel="0°"
        rightLabel="360°"
        onChange={(v) => onChange('startAngle', v)}
      />

      <ButtonGroup
        label="Direction"
        value={settings.clockwise ? 'clockwise' : 'counter'}
        options={[
          { value: 'clockwise', label: '↻ Clockwise' },
          { value: 'counter', label: '↺ Counter' },
        ]}
        onChange={(v) => onChange('clockwise', v === 'clockwise')}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="sortByConnections"
          checked={settings.sortByConnections || false}
          onChange={(e) => onChange('sortByConnections', e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
        />
        <label htmlFor="sortByConnections" className="text-xs text-gray-700 dark:text-gray-300">
          Sort by connection count
        </label>
      </div>
    </div>
  );
}

// Force-directed controls
function ForceControls({
  settings,
  onChange,
}: {
  settings: any;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <Slider
        label="Repulsion"
        value={settings.repulsionStrength || 150}
        min={50}
        max={400}
        step={25}
        leftLabel="Weak"
        rightLabel="Strong"
        onChange={(v) => onChange('repulsionStrength', v)}
      />

      <Slider
        label="Link Distance"
        value={settings.linkDistance || 120}
        min={50}
        max={300}
        step={10}
        leftLabel="Short"
        rightLabel="Long"
        onChange={(v) => onChange('linkDistance', v)}
      />

      <Slider
        label="Gravity"
        value={Math.round((settings.gravity || 0.1) * 100)}
        min={0}
        max={50}
        step={5}
        leftLabel="Spread"
        rightLabel="Clustered"
        onChange={(v) => onChange('gravity', v / 100)}
      />

      <Slider
        label="Iterations"
        value={settings.iterations || 200}
        min={50}
        max={500}
        step={50}
        leftLabel="Fast"
        rightLabel="Refined"
        onChange={(v) => onChange('iterations', v)}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="preventOverlap"
          checked={settings.preventOverlap !== false}
          onChange={(e) => onChange('preventOverlap', e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
        />
        <label htmlFor="preventOverlap" className="text-xs text-gray-700 dark:text-gray-300">
          Prevent node overlap
        </label>
      </div>
    </div>
  );
}

// Organic controls
function OrganicControls({
  settings,
  onChange,
}: {
  settings: any;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <Slider
        label="Node Spacing"
        value={settings.nodeSpacing || 100}
        min={40}
        max={200}
        step={10}
        leftLabel="Tight"
        rightLabel="Spacious"
        onChange={(v) => onChange('nodeSpacing', v)}
      />

      <Slider
        label="Cluster Spacing"
        value={settings.clusterSpacing || 150}
        min={50}
        max={300}
        step={25}
        leftLabel="Close"
        rightLabel="Apart"
        onChange={(v) => onChange('clusterSpacing', v)}
      />

      <Slider
        label="Organicity"
        value={Math.round((settings.organicity || 0.8) * 100)}
        min={0}
        max={100}
        step={10}
        leftLabel="Rigid"
        rightLabel="Natural"
        onChange={(v) => onChange('organicity', v / 100)}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="clustering"
          checked={settings.clustering !== false}
          onChange={(e) => onChange('clustering', e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
        />
        <label htmlFor="clustering" className="text-xs text-gray-700 dark:text-gray-300">
          Group connected nodes
        </label>
      </div>
    </div>
  );
}
