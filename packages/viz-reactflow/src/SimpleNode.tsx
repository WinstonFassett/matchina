import React, { memo } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';

interface SimpleNodeData extends Record<string, unknown> {
  label: string;
  isActive?: boolean;
  isPrevious?: boolean;
  isCompound?: boolean;
}

const SimpleNode = ({ data }: NodeProps<any>) => {
  const isActive = !!data?.isActive;
  const isPrevious = !!data?.isPrevious;

  return (
    <>
      {/* Hidden handles for ReactFlow compatibility */}
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Left} style={{ visibility: 'hidden' }} />

      <div style={{ background: 'transparent', border: 'none', padding: 0, margin: 0 }}>
        <div
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--matchina-viz-radius, var(--radius, 0.125rem))',
            border: isActive
              ? '2px solid var(--matchina-viz-active-border, #bfdbfe)'
              : isPrevious
              ? '2px solid var(--matchina-viz-active-border, #bfdbfe)'
              : '1px solid var(--matchina-viz-border, rgba(148,163,184,0.25))',
            minWidth: '100px',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'var(--matchina-viz-font, "JetBrains Mono", monospace)',
            background: isActive
              ? 'var(--matchina-viz-node-active, #bfdbfe)'
              : 'var(--matchina-viz-node, #0d1117)',
            color: isActive
              ? 'var(--matchina-viz-text-active, #0d1117)'
              : 'var(--matchina-viz-text, #ffffff)',
            boxShadow: 'none',
            transition: 'background 200ms, color 200ms',
          }}
        >
          {data?.label}
        </div>
      </div>
    </>
  );
};

export default memo(SimpleNode);
