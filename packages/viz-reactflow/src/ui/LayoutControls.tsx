import React, { useRef, useState } from 'react';
import type { ILayoutManager as LayoutManager, AnyLayoutSettings } from '../layout/types';
import { LayoutType } from '../layout/types';
import { FloatingPanel } from './FloatingPanel';

interface LayoutControlsProps {
  layoutManager: LayoutManager;
  onLayoutChange: (type: LayoutType, settings: AnyLayoutSettings) => void;
  currentLayoutType: LayoutType;
  currentSettings: AnyLayoutSettings;
}

type LayoutPreset = {
  id: string;
  label: string;
  description: string;
  settings: AnyLayoutSettings;
};

const PRESETS: LayoutPreset[] = [
  {
    id: 'tb',
    label: 'Top → Bottom',
    description: 'Layered, top-down flow',
    settings: { algorithm: 'layered', direction: 'DOWN' },
  },
  {
    id: 'lr',
    label: 'Left → Right',
    description: 'Layered, left-to-right flow',
    settings: { algorithm: 'layered', direction: 'RIGHT' },
  },
  {
    id: 'force',
    label: 'Force',
    description: 'Physics-based clustering',
    settings: { algorithm: 'force', direction: 'DOWN' },
  },
  {
    id: 'organic',
    label: 'Organic',
    description: 'Stress-minimized natural layout',
    settings: { algorithm: 'stress', direction: 'DOWN' },
  },
];

function getPresetId(settings: AnyLayoutSettings): string {
  const algo = settings.algorithm as string | undefined;
  const dir = settings.direction as string | undefined;
  if (algo === 'layered' && dir === 'DOWN') return 'tb';
  if (algo === 'layered' && dir === 'RIGHT') return 'lr';
  if (algo === 'force') return 'force';
  if (algo === 'stress') return 'organic';
  return 'tb';
}

export function LayoutControls({
  layoutManager,
  onLayoutChange,
  currentLayoutType,
  currentSettings,
}: LayoutControlsProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const activePresetId = getPresetId(currentSettings);

  const handlePreset = (preset: LayoutPreset) => {
    const engine = layoutManager.getEngine(LayoutType.HIERARCHICAL);
    if (!engine) return;
    const merged = { ...engine.getDefaultSettings(), ...preset.settings };
    onLayoutChange(LayoutType.HIERARCHICAL, merged);
  };

  const getNumeric = (key: string, fallback: number): number => {
    const v = currentSettings[key];
    return typeof v === 'number' ? v : fallback;
  };

  const handleSettingChange = (key: string, value: unknown) => {
    onLayoutChange(currentLayoutType, { ...currentSettings, [key]: value });
  };

  const handleReset = () => {
    const engine = layoutManager.getEngine(LayoutType.HIERARCHICAL);
    if (engine) onLayoutChange(currentLayoutType, engine.getDefaultSettings());
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsPanelOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 10px',
          fontSize: 11,
          fontFamily: 'var(--matchina-viz-font, "JetBrains Mono", monospace)',
          background: isPanelOpen
            ? 'var(--matchina-viz-accent, #8fb9d6)'
            : 'var(--matchina-viz-ctrl-bg, rgba(20,28,40,0.85))',
          color: isPanelOpen
            ? 'var(--matchina-viz-bg, #0a0f17)'
            : 'var(--matchina-viz-ctrl-text, rgba(226,232,240,0.65))',
          border: '1px solid var(--matchina-viz-ctrl-border, rgba(148,163,184,0.24))',
          borderRadius: 6,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          letterSpacing: '0.04em',
        }}
        title="Layout options"
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        Layout
      </button>

      <FloatingPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        anchorRef={buttonRef}
        title="Layout"
        width={280}
        height={380}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Preset buttons */}
          <div>
            <div style={labelStyle}>Direction / Algorithm</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
              {PRESETS.map(preset => {
                const active = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePreset(preset)}
                    style={{
                      padding: '7px 10px',
                      fontSize: 11,
                      fontFamily: 'var(--matchina-viz-font, "JetBrains Mono", monospace)',
                      textAlign: 'left',
                      borderRadius: 6,
                      border: active
                        ? '1px solid var(--matchina-viz-accent, #8fb9d6)'
                        : '1px solid var(--matchina-viz-ctrl-border, rgba(148,163,184,0.24))',
                      background: active
                        ? 'var(--matchina-viz-accent-soft, rgba(143,185,214,0.15))'
                        : 'var(--matchina-viz-ctrl-bg, rgba(20,28,40,0.85))',
                      color: active
                        ? 'var(--matchina-viz-accent, #8fb9d6)'
                        : 'var(--matchina-viz-ctrl-text, rgba(226,232,240,0.65))',
                      cursor: 'pointer',
                      lineHeight: 1.3,
                    }}
                  >
                    <div style={{ fontWeight: active ? 600 : 500 }}>{preset.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{preset.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spacing sliders */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={labelStyle}>Spacing</div>
              <button
                type="button"
                onClick={handleReset}
                style={{ fontSize: 10, color: 'var(--matchina-viz-accent, #8fb9d6)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
              >
                Reset
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SliderRow
                label="Node spacing"
                value={getNumeric('nodeSpacing', 120)}
                min={40} max={300}
                onChange={v => handleSettingChange('nodeSpacing', v)}
              />
              <SliderRow
                label="Layer spacing"
                value={getNumeric('layerSpacing', 180)}
                min={60} max={400}
                onChange={v => handleSettingChange('layerSpacing', v)}
              />
            </div>
          </div>
        </div>
      </FloatingPanel>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: 'var(--matchina-viz-font, "JetBrains Mono", monospace)',
  color: 'var(--matchina-viz-ctrl-text, rgba(226,232,240,0.65))',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

function SliderRow({ label, value, min, max, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--matchina-viz-font, "JetBrains Mono", monospace)', color: 'var(--matchina-viz-ctrl-text, rgba(226,232,240,0.65))' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--matchina-viz-font, "JetBrains Mono", monospace)', color: 'var(--matchina-viz-accent, #8fb9d6)' }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--matchina-viz-accent, #8fb9d6)' }}
      />
    </div>
  );
}
