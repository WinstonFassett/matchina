import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface GroupNodeData {
  label: string;
  isActive?: boolean;
  isPrevious?: boolean;
  isCompound?: boolean;
}

interface GroupNodeProps {
  data: GroupNodeData;
}

const GroupNode = ({ data }: GroupNodeProps) => {
  const isActive = !!data?.isActive;
  const isPrevious = !!data?.isPrevious;

  const borderColor = isActive || isPrevious
    ? 'var(--matchina-viz-active-border, #bfdbfe)'
    : 'var(--matchina-viz-border, rgba(148,163,184,0.25))';

  const borderStyle = isActive || isPrevious ? 'solid' : 'dashed';

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

      <div style={{
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--matchina-viz-node-compound, rgba(20,28,40,0.7))',
        border: `2px ${borderStyle} ${borderColor}`,
        borderRadius: 'var(--matchina-viz-radius, var(--radius, 0.125rem))',
        padding: '8px',
        minWidth: '150px',
        minHeight: '80px',
        position: 'relative',
        overflow: 'visible',
      }}>
        <div style={{
          position: 'absolute',
          top: '-12px',
          left: '12px',
          backgroundColor: isActive
            ? 'var(--matchina-viz-node-active, #bfdbfe)'
            : 'var(--matchina-viz-node, #0d1117)',
          color: isActive
            ? 'var(--matchina-viz-text-active, #0d1117)'
            : 'var(--matchina-viz-text, #ffffff)',
          padding: '3px 10px',
          borderRadius: 'var(--matchina-viz-radius, var(--radius, 0.125rem))',
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: 'var(--matchina-viz-font, "JetBrains Mono", monospace)',
          boxShadow: 'none',
        }}>
          {data?.label}
        </div>
      </div>
    </>
  );
};

export default memo(GroupNode);
