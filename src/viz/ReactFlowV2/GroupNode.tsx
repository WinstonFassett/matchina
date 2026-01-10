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
  // Detect theme for proper styling
  const isDarkTheme = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  
  const getBorderStyle = () => {
    if (data?.isActive) {
      return '2px solid rgb(37, 99, 235)'; // blue-600
    }
    if (data?.isPrevious) {
      return '2px solid rgb(96, 165, 250)'; // blue-400
    }
    return '2px dashed rgb(147, 112, 219)'; // purple dashed
  };

  const getContainerBackground = () => {
    if (data?.isActive) {
      return isDarkTheme 
        ? 'rgba(37, 99, 235, 0.08)'  // Dark theme translucent blue
        : 'rgba(37, 99, 235, 0.05)'; // Light theme translucent blue
    }
    if (data?.isPrevious) {
      return isDarkTheme 
        ? 'rgba(96, 165, 250, 0.08)'  // Dark theme translucent blue
        : 'rgba(96, 165, 250, 0.05)'; // Light theme translucent blue
    }
    return isDarkTheme 
      ? 'rgba(88, 28, 135, 0.08)'  // Dark theme translucent purple
      : 'rgba(147, 112, 219, 0.05)'; // Light theme translucent purple
  };

  const getLabelBackground = () => {
    if (data?.isActive) {
      return 'rgb(37, 99, 235)'; // blue-600
    }
    if (data?.isPrevious) {
      return 'rgb(96, 165, 250)'; // blue-400
    }
    return isDarkTheme 
      ? 'rgba(88, 28, 135, 0.7)'  // Dark theme translucent purple
      : 'rgba(147, 112, 219, 0.7)'; // Light theme translucent purple
  };

  return (
    <div style={{
      boxSizing: 'border-box',
      width: '100%',
      height: '100%',
      backgroundColor: getContainerBackground(),
      border: getBorderStyle(),
      borderRadius: '8px',
      padding: '8px', // Reduced from 16px to save space
      minWidth: '150px',
      minHeight: '80px', // Reduced from 100px to save space
      position: 'relative',
      // Ensure proper sizing sync
      overflow: 'visible',
    }}>
      {/* Label at top of group - no weird background */}
      <div style={{
        position: 'absolute',
        top: '-12px',
        left: '15px',
        backgroundColor: getLabelBackground(),
        color: 'white',
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 'bold',
        // Remove shadow for cleaner look
        boxShadow: 'none',
      }}>
        {data?.label}
      </div>
      
      {/* Hidden handles for ReactFlow compatibility */}
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Left} style={{ visibility: 'hidden' }} />
    </div>
  );
};

export default memo(GroupNode);
