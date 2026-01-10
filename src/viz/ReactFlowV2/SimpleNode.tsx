import React, { memo } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';

interface SimpleNodeData extends Record<string, unknown> {
  label: string;
  isActive?: boolean;
  isPrevious?: boolean;
  isCompound?: boolean;
}

/**
 * SimpleNode - Node component with hidden handles for floating edge compatibility
 *
 * ReactFlow requires handles on nodes even when using floating edges.
 * These handles are invisible but necessary to prevent console errors.
 */
const SimpleNode = ({ data }: NodeProps<any>) => {
  const getNodeStyle = () => {
    if (data?.isActive) {
      return {
        background: '#3b82f6',
        color: '#fff',
        borderColor: '#1d4ed8',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
      };
    }
    if (data?.isPrevious) {
      return {
        background: 'rgb(31, 41, 55)', // Very dark gray for better contrast in dark theme
        color: 'var(--sl-color-text)',
        borderColor: '#3b82f6',
        borderWidth: '2px',
        borderStyle: 'solid',
      };
    }
    if (data?.isCompound) {
      return {
        background: 'var(--sl-color-purple-low)',
        color: 'var(--sl-color-purple)',
        borderColor: 'var(--sl-color-purple)',
        borderStyle: 'dashed',
      };
    }
    return {
      background: 'var(--sl-color-bg)',
      color: 'var(--sl-color-text)',
      borderColor: 'var(--sl-color-gray-5)',
    };
  };

  const nodeStyle = getNodeStyle();

  return (
    <>
      {/* Hidden handles for ReactFlow compatibility - visibility: hidden not display: none */}
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Left} style={{ visibility: 'hidden' }} />

      <div
        style={{
          padding: '10px 20px',
          border: `2px solid ${nodeStyle.borderColor}`,
          borderRadius: 8,
          minWidth: 100,
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 600,
          boxShadow: nodeStyle.boxShadow || '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
          ...nodeStyle,
        }}
      >
        {data?.label}
      </div>
    </>
  );
};

export default memo(SimpleNode);
