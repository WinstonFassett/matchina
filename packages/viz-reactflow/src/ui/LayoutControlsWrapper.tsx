/**
 * Layout Controls Wrapper
 * Positions trigger button inside diagram (right side) but opens panel outside
 */

import React from 'react';
import type { AnyLayoutSettings, ILayoutManager as LayoutManager } from '../layout/types';
import { LayoutType } from '../layout/types';
import { LayoutControls } from './LayoutControls';

interface LayoutControlsWrapperProps {
  layoutManager: LayoutManager;
  onLayoutChange: (type: LayoutType, settings: AnyLayoutSettings) => void;
  currentLayoutType: LayoutType;
  currentSettings: AnyLayoutSettings;
}

export function LayoutControlsWrapper({
  layoutManager,
  onLayoutChange,
  currentLayoutType,
  currentSettings,
}: LayoutControlsWrapperProps) {
  return (
    <div className="absolute top-2 right-2 z-20" style={{right: '0.5rem', left: 'auto !important', top: '0.5rem'}}>
      <LayoutControls
        layoutManager={layoutManager}
        onLayoutChange={onLayoutChange}
        currentLayoutType={currentLayoutType}
        currentSettings={currentSettings}
      />
    </div>
  );
}
