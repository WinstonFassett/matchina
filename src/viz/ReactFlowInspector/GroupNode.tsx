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
      backgroundColor: 'rgba(147, 112, 219, 0.1)',
      border: getBorderStyle(),
      borderRadius: '8px',
      padding: '10px',
      minWidth: '150px',
      minHeight: '100px',
    }}>
      {/* Label at top of group */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        left: '10px',
        backgroundColor: 'rgb(147, 112, 219)',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
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