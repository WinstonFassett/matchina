import React, { memo } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';

interface SimpleNodeData {
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
const SimpleNode = ({ data }: NodeProps<SimpleNodeData>) => {
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
        background: '#f1f5f9',
        color: '#475569',
        borderColor: '#3b82f6',
        borderWidth: '2px',
        borderStyle: 'solid',
      };
    }
    if (data?.isCompound) {
      return {
        background: '#faf5ff',
        color: '#1e293b',
        borderColor: '#c4b5fd',
        borderStyle: 'dashed',
      };
    }
    return {
      background: '#fff',
      color: '#1e293b',
      borderColor: '#e2e8f0',
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
          background: nodeStyle.background,
          color: nodeStyle.color,
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
