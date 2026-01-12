import React, { memo } from 'react';
import { type NodeProps, Handle, Position } from '@xyflow/react';

interface SimpleNodeData extends Record<string, unknown> {
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
const SimpleNode = ({ data }: NodeProps<any>) => {
  const getNodeStyle = () => {
    // Detect theme for proper styling
    const isDarkTheme = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (data?.isActive) {
      return {
        background: '#2563eb', // Exact V1 blue-600
        color: '#fff',
        borderColor: '#1d4ed8', // Exact V1 blue-700  
        borderWidth: '2px', // Ensure border is visible like V1
        boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4), 0 4px 6px -2px rgba(59, 130, 246, 0.3)', // Exact V1 shadow-lg
      };
    }
    if (data?.isPrevious) {
      return {
        background: isDarkTheme ? 'rgba(55, 65, 81, 0.85)' : '#f3f4f6', // Dark theme translucent, V1 gray-100
        color: isDarkTheme ? 'rgb(209, 213, 219)' : '#374151', // Dark theme light gray, V1 gray-700
        borderColor: '#60a5fa', // Exact V1 blue-400
        borderWidth: '2px',
        borderStyle: 'solid',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // Exact V1 shadow-sm
      };
    }
    if (data?.isCompound) {
      return {
        background: isDarkTheme ? 'rgba(88, 28, 135, 0.15)' : '#faf5ff', // Dark theme translucent purple, V1 purple-50
        color: isDarkTheme ? 'rgb(196, 181, 253)' : '#6b21a8', // Dark theme light purple, V1 purple-800
        borderColor: isDarkTheme ? 'rgb(167, 139, 250)' : '#c084fc', // Dark theme purple-300, V1 purple-300
        borderStyle: 'dashed',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      };
    }
    return {
      background: isDarkTheme ? 'rgba(31, 41, 55, 0.85)' : '#ffffff', // Dark theme translucent, V1 white
      color: isDarkTheme ? 'rgb(209, 213, 219)' : '#1f2937', // Dark theme light gray, V1 gray-800
      borderColor: isDarkTheme ? 'rgb(75, 85, 99)' : '#d1d5db', // Dark theme gray-600, V1 gray-300
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
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
          // Override ReactFlow defaults completely
          background: 'transparent', // Remove any default background
          border: 'none', // Remove any default border
          padding: '0', // Remove default padding
          margin: '0', // Remove default margin
        }}
      >
        <div
          style={{
            padding: '16px', // Exact V1 px-4 py-2 (1rem = 16px, 0.5rem = 8px, but px-4 py-2 = 1rem 0.5rem)
            paddingTop: '8px',
            paddingBottom: '8px',
            paddingLeft: '16px', 
            paddingRight: '16px',
            // Use combined border style to avoid conflicts
            border: nodeStyle.borderStyle 
              ? `${nodeStyle.borderWidth || '2px'} ${nodeStyle.borderStyle} ${nodeStyle.borderColor}`
              : `2px solid ${nodeStyle.borderColor}`,
            borderRadius: '8px', // Exact V1 rounded-lg
            minWidth: '100px',
            textAlign: 'center',
            fontSize: '14px', // Standard font size
            fontWeight: '500', // Exact V1 font-medium
            transition: 'all 300ms', // Exact V1 duration-300
            // Merge all node styles including boxShadow
            background: nodeStyle.background,
            color: nodeStyle.color,
            boxShadow: nodeStyle.boxShadow,
          }}
        >
          {data?.label}
        </div>
      </div>
    </>
  );
};

export default memo(SimpleNode);
