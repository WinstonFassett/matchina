import { useEffect, useRef, useState } from 'react';
import { Graph } from '@antv/g6';

export interface G6HierarchicalData {
  nodes: Array<{
    id: string;
    name: string;
    group?: string;
    level: number;
    cluster?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    event: string;
  }>;
}

interface G6HierarchicalViewProps {
  data: G6HierarchicalData;
  width?: number;
  height?: number;
  layout?: 'dagre' | 'force' | 'circular' | 'concentric';
  animate?: boolean;
}

export default function G6HierarchicalView({
  data,
  width = 800,
  height = 600,
  layout = 'dagre',
  animate = true
}: G6HierarchicalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    // Destroy existing graph
    if (graphRef.current) {
      graphRef.current.destroy();
    }

    // Process data for G6
    const g6Data = {
      nodes: data.nodes.map(node => ({
        id: node.id,
        label: node.name,
        cluster: node.group || node.cluster,
        style: {
          fill: node.level === 0 ? '#FF6B6B' : '#4ECDC4',
          stroke: node.level === 0 ? '#FF5252' : '#26A69A',
        },
      })),
      edges: data.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        label: edge.event,
      })),
    };

    // Create graph instance
    const graph = new Graph({
      container: containerRef.current,
      width,
      height,
      autoFit: 'view',
      data: g6Data,
      node: {
        style: {
          size: 40,
          fill: '#C6E5FF',
          stroke: '#5B8FF9',
          lineWidth: 2,
        },
        palette: {
          type: 'group',
          field: 'cluster',
        },
      },
      layout: {
        type: layout === 'dagre' ? 'dagre' : 'd3-force',
        rankdir: 'TB', // Top to bottom for hierarchical
        nodesep: 50,
        ranksep: 100,
        preventOverlap: true,
      },
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
    });

    // Render the graph
    graph.render();

    // Add subgraph support for compound states using combo data
    const groups = new Map<string, string[]>();
    data.nodes.forEach(node => {
      if (node.group && node.group !== 'root') {
        if (!groups.has(node.group)) {
          groups.set(node.group, []);
        }
        groups.get(node.group)!.push(node.id);
      }
    });

    // Create combo data for hierarchical groups
    if (groups.size > 0) {
      const comboData = Array.from(groups.entries()).map(([groupName, nodeIds]) => ({
        id: groupName,
        label: groupName,
        children: nodeIds,
        style: {
          fill: '#F3F9FF',
          stroke: '#5B8FF9',
          lineWidth: 2,
          strokeOpacity: 0.3,
          fillOpacity: 0.1,
        },
      }));

      // Add combo data to the graph
      graph.addComboData(comboData);
    }

    graphRef.current = graph;

    return () => {
      if (graphRef.current) {
        graphRef.current.destroy();
        graphRef.current = null;
      }
    };
  }, [data, width, height, layout, animate]);

  return (
    <div className="g6-hierarchical-view">
      <div ref={containerRef} style={{ border: '1px solid #ccc', borderRadius: '8px' }} />
    </div>
  );
}
