import React from "react";
import { Handle, Position } from "reactflow";

interface CustomNodeProps {
  data: {
    label: string;
    isActive: boolean;
    isPrevious: boolean;
  };
}

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  const getNodeStyle = () => {
    if (data.isActive) {
      return "bg-blue-600 text-white border-blue-700 shadow-lg";
    }
    if (data.isPrevious) {
      return "bg-blue-200 text-blue-900 border-blue-300 shadow-md";
    }
    return "bg-white text-gray-800 border-gray-300";
  };

  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 min-w-[100px] text-center font-medium transition-all duration-300 ${getNodeStyle()}`}
    >
      {/* Connection handles on all 4 sides */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 !bg-transparent border-0 opacity-0"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="w-3 h-3 !bg-transparent border-0 opacity-0"
      />

      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="w-3 h-3 !bg-transparent border-0 opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 !bg-transparent border-0 opacity-0"
      />

      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 !bg-transparent border-0 opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 !bg-transparent border-0 opacity-0"
      />

      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-3 h-3 !bg-transparent border-0 opacity-0"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="w-3 h-3 !bg-transparent border-0 opacity-0"
      />

      {data.label}
    </div>
  );
};

export default CustomNode;
