import React, { memo } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';

const SimpleNode = ({ data }: NodeProps) => {
  return (
    <>
      {/* Hidden handles for ReactFlow compatibility */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: 'hidden' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        style={{ visibility: 'hidden' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        style={{ visibility: 'hidden' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ visibility: 'hidden' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        style={{ visibility: 'hidden' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ visibility: 'hidden' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: 'hidden' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        style={{ visibility: 'hidden' }}
      />
      
      <div style={{
        padding: '10px 20px',
        border: '2px solid #1a192b',
        borderRadius: 8,
        background: '#fff',
        minWidth: 100,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        {data?.label}
      </div>
    </>
  );
};

export default memo(SimpleNode);
