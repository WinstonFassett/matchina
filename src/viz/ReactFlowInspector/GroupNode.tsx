import React from 'react';
import { Handle, Position } from 'reactflow';

interface GroupNodeProps {
  data: {
    label: string;
    isActive: boolean;
    isPrevious: boolean;
    isCompound?: boolean;
  };
}

export const GroupNode: React.FC<GroupNodeProps> = ({ data }) => {
  const getBorderStyle = () => {
    if (data.isActive) {
      return '2px solid rgb(37, 99, 235)'; // blue-600
    }
    if (data.isPrevious) {
      return '2px solid rgb(96, 165, 250)'; // blue-400
    }
    return '2px dashed rgb(147, 112, 219)';
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(147, 112, 219, 0.08)', // Lighter background
      border: getBorderStyle(),
      borderRadius: '12px', // More rounded
      padding: '20px', // More padding inside group
      minWidth: '200px', // Wider minimum
      minHeight: '150px', // Taller minimum
      position: 'relative',
    }}>
      {/* Label at top of group */}
      <div style={{
        position: 'absolute',
        top: '-12px',
        left: '15px',
        backgroundColor: 'rgb(147, 112, 219)',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        {data.label}
      </div>

      {/* Connection handles on all 4 sides */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: 'transparent', border: 0, opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ background: 'transparent', border: 0, opacity: 0 }}
      />

      <Handle
        type="target"
        position={Position.Right}
        id="right"
        style={{ background: 'transparent', border: 0, opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: 'transparent', border: 0, opacity: 0 }}
      />

      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ background: 'transparent', border: 0, opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: 'transparent', border: 0, opacity: 0 }}
      />

      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: 'transparent', border: 0, opacity: 0 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ background: 'transparent', border: 0, opacity: 0 }}
      />
    </div>
  );
};

export default GroupNode;