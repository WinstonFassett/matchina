import React, { memo } from 'react';
import {
  type BuiltInNode,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react';

const BiDirectionalNode = ({ data }: NodeProps<BuiltInNode>) => {
  return (
    <div style={{
      padding: '10px 20px',
      border: '1px solid #222',
      borderRadius: 5,
      background: '#fff',
      minWidth: 80,
      textAlign: 'center',
    }}>
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Left} id="left-target" />
      {data?.label}
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="target" position={Position.Right} id="right-target" />
    </div>
  );
};

export default memo(BiDirectionalNode);
