import React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

interface CustomNodeData {
  label: string;
  isActive: boolean;
  isPrevious: boolean;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data }) => {
  const { label, isActive, isPrevious } = data;
  
  return (
    <div
      className={`px-4 py-2 rounded-md shadow-md border ${
        isActive 
          ? 'bg-primary text-white border-primary' 
          : isPrevious
            ? 'bg-white border-primary text-primary'
            : 'bg-white border-gray-200 text-gray-800'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-gray-400"
      />
      <div className="font-medium">{label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-gray-400"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-gray-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-gray-400"
      />
    </div>
  );
};

export default CustomNode;
