import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';

const SimpleNode = ({ data }: NodeProps) => {
  return (
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
  );
};

export default memo(SimpleNode);
