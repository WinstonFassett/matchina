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

/**
 * GroupNode - Container node for compound/parent states in hierarchical machines
 * 
 * This renders as a larger container that can visually contain child nodes.
 * Child nodes use parentId + extent: 'parent' to be constrained inside.
 */
const GroupNode = ({ data }: GroupNodeProps) => {
  const getBorderStyle = () => {
    if (data?.isActive) {
      return '2px solid rgb(37, 99, 235)'; // blue-600
    }
    if (data?.isPrevious) {
      return '2px solid rgb(96, 165, 250)'; // blue-400
    }
    return '2px dashed rgb(147, 112, 219)'; // purple dashed
  };

  return (
    <div style={{
      boxSizing: 'border-box',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(147, 112, 219, 0.1)',
      border: getBorderStyle(),
      borderRadius: '8px',
      padding: '16px',
      minWidth: '150px',
      minHeight: '100px',
      position: 'relative',
      // Ensure proper sizing sync
      overflow: 'visible',
    }}>
      {/* Label at top of group */}
      <div style={{
        position: 'absolute',
        top: '-12px',
        left: '15px',
        backgroundColor: data?.isActive ? 'rgb(37, 99, 235)' : 'rgb(147, 112, 219)',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        {data?.label}
      </div>

      {/* Hidden handles for edge connections */}
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Left} style={{ visibility: 'hidden' }} />
    </div>
  );
};

export default memo(GroupNode);
