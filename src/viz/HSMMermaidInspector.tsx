import React, { memo, useMemo } from "react";
import { buildShapeTree } from "../inspect/build-visualizer-tree";
import type { InspectorTheme } from './theme';
import { defaultTheme } from './theme';
import MermaidInspector from './MermaidInspector';

// HSM-specific Mermaid wrapper that builds shape tree and passes to MermaidInspector
const HSMMermaidInspector = memo(({
  machine,
  stateKey,
  actions,
  interactive = true,
  theme = defaultTheme
}: {
  machine: any;
  stateKey: string;
  actions?: Record<string, () => void>;
  interactive?: boolean;
  theme?: InspectorTheme;
}) => {
  // Build shape tree for HSM visualization
  const config = useMemo(() => buildShapeTree(machine as any), [machine]);
  
  return (
    <MermaidInspector
      config={config}
      stateKey={stateKey}
      actions={actions}
      interactive={interactive}
    />
  );
});

export default HSMMermaidInspector;