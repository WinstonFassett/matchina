import { useEffect, useRef } from 'react';
import * as G6 from '@antv/g6';

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
  const graphRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    // Destroy existing graph
    if (graphRef.current) {
      graphRef.current.destroy();
    }

    // Process data for G6 v5
    const g6Data: any = {
      nodes: data.nodes.map(node => ({
        id: node.id,
        data: {
          label: node.name,
          cluster: node.group || node.cluster,
        },
        style: {
          fill: node.level === 0 ? '#FF6B6B' : '#4ECDC4',
          stroke: node.level === 0 ? '#FF5252' : '#26A69A',
        },
      })),
      edges: data.edges.map(edge => ({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        data: {
          label: edge.event,
        },
        style: {
          stroke: '#e2e2e2',
          lineWidth: 2,
          endArrow: true,
        },
      })),
    };

    // Add combo data for hierarchical groups
    const groups = new Map<string, string[]>();
    data.nodes.forEach(node => {
      if (node.group && node.group !== 'root') {
        if (!groups.has(node.group)) {
          groups.set(node.group, []);
        }
        groups.get(node.group)!.push(node.id);
      }
    });

    if (groups.size > 0) {
      const combos = Array.from(groups.entries()).map(([groupName, nodeIds]) => ({
        id: groupName,
        data: {
          label: groupName,
        },
        children: nodeIds,
        style: {
          fill: '#F3F9FF',
          stroke: '#5B8FF9',
          lineWidth: 2,
          strokeOpacity: 0.3,
          fillOpacity: 0.1,
        },
      }));
      
      g6Data.combos = combos;
    }

    // Create graph instance
    const graph = new G6.Graph({
      container: containerRef.current,
      width,
      height,
      autoFit: 'view',
      data: g6Data,
      node: {
        style: {
          size: 40,
        },
      },
      edge: {
        style: {
          lineWidth: 2,
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