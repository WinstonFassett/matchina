import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as cola from 'webcola';

interface ColaNode extends cola.Node {
  id: string;
  name: string;
  group?: string;
  level: number;
  width: number;
  height: number;
}

interface ColaLink extends cola.Link<ColaNode> {
  event: string;
}

interface ColaGroup {
  name: string;
  leaves: number[];
  padding: number;
}

interface HierarchicalGraphData {
  nodes: Array<{ id: string; name: string; group?: string; level: number }>;
  links: Array<{ source: string; target: string; event: string }>;
}

interface HierarchicalWebColaProps {
  data: HierarchicalGraphData;
  currentState?: string;
  onEventClick?: (event: string) => void;
  layoutMode?: 'springy' | 'static';
}

// Color scheme - matching custom force graph
const COLORS = {
  activeState: '#3b82f6',
  groupNode: '#f5f5f5',
  childNode: '#ffffff',
  nodeBorder: '#374151',
  nodeText: '#1f2937',
  activeEdge: '#3b82f6',
  inactiveEdge: '#9ca3af',
  edgeLabel: '#e5e7eb',
  edgeLabelBg: '#374151',
  containerFill: 'rgba(107, 114, 128, 0.15)',
  containerStroke: '#6b7280',
  containerLabel: '#9ca3af',
};

export default function HierarchicalWebCola({ data, currentState, onEventClick, layoutMode = 'springy' }: HierarchicalWebColaProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions] = useState({ width: 800, height: 600 });

  console.log('WebCola component mounted with data:', data);

  useEffect(() => {
    console.log('WebCola useEffect called');
    try {
      if (!svgRef.current || !data) {
        console.log('WebCola: No svgRef or data, returning');
        return;
      }

      console.log('WebCola: Starting initialization...');

      const svg = svgRef.current;

      // Clear previous content
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }

      // Set SVG dimensions
      svg.setAttribute('width', dimensions.width.toString());
      svg.setAttribute('height', dimensions.height.toString());
      svg.setAttribute('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`);

      // Transform data to Cola format
      const colaNodes: ColaNode[] = data.nodes.map((node, i) => ({
        id: node.id,
        name: node.name,
        group: node.group,
        level: node.level,
        width: 80,  // Match rect width
        height: 32, // Match rect height
        x: dimensions.width / 2 + (Math.random() - 0.5) * 200,
        y: dimensions.height / 2 + (Math.random() - 0.5) * 200,
      }));

      // Create node index map
      const nodeIndex = new Map<string, number>();
      colaNodes.forEach((node, i) => nodeIndex.set(node.id, i));

      // Transform links to use indices
      const colaLinks: ColaLink[] = data.links
        .map(link => {
          const sourceIndex = nodeIndex.get(link.source);
          const targetIndex = nodeIndex.get(link.target);
          console.log(`Link ${link.event}: ${link.source} (${sourceIndex}) -> ${link.target} (${targetIndex})`);
          return {
            source: sourceIndex!,
            target: targetIndex!,
            event: link.event,
          };
        })
        .filter(link => link.source !== undefined && link.target !== undefined);

      console.log(`Created ${colaLinks.length} WebCola links from ${data.links.length} data links`);

      // Create groups from node groupings
      const groupMap = new Map<string, number[]>();
      colaNodes.forEach((node, i) => {
        if (node.group) {
          if (!groupMap.has(node.group)) {
            groupMap.set(node.group, []);
          }
          groupMap.get(node.group)!.push(i);
        }
      });

      const colaGroups: ColaGroup[] = Array.from(groupMap.entries()).map(([name, leaves]) => ({
        name,
        leaves,
        padding: 30,
      }));

      // Create D3 selection for SVG
      const d3Svg = d3.select(svg);

      // Create links using D3 data binding (like the working example)
      const linkSelection = d3Svg.selectAll(".link")
        .data(colaLinks)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", COLORS.inactiveEdge)
        .attr("stroke-width", "1.5")
        .style("cursor", "pointer");

      // Add click handlers to links
      linkSelection.on("click", (event, d: any) => {
        if (onEventClick) {
          onEventClick(d.event);
        }
      });

      // Add hover effects
      linkSelection
        .on("mouseenter", function() {
          d3.select(this).attr("stroke", COLORS.activeEdge).attr("stroke-width", "2.5");
        })
        .on("mouseleave", function() {
          d3.select(this).attr("stroke", COLORS.inactiveEdge).attr("stroke-width", "1.5");
        });

      // Create edge labels using D3 data binding
      const edgeLabelSelection = d3Svg.selectAll(".edge-label")
        .data(colaLinks)
        .enter().append("text")
        .attr("class", "edge-label")
        .text((d: any) => d.event)
        .attr("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("fill", COLORS.edgeLabel)
        .style("pointer-events", "none")
        .style("cursor", "pointer");

      // Create edge label backgrounds using D3 data binding
      const edgeLabelBgSelection = d3Svg.selectAll(".edge-label-bg")
        .data(colaLinks)
        .enter().insert("rect", ".edge-label")
        .attr("class", "edge-label-bg")
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("fill", COLORS.edgeLabelBg)
        .style("cursor", "pointer");

      // Create nodes using D3 data binding
      const nodeSelection = d3Svg.selectAll(".node")
        .data(colaNodes)
        .enter().append("rect")
        .attr("class", "node")
        .attr("width", (d: any) => d.width - 6)
        .attr("height", (d: any) => d.height - 6)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("fill", (d: any) => d.level === 0 ? COLORS.groupNode : COLORS.childNode)
        .attr("stroke", COLORS.nodeBorder)
        .attr("stroke-width", (d: any) => {
          const isActive = d.id === currentState || d.id.endsWith('.' + currentState);
          return isActive ? '3' : '2';
        })
        .style("cursor", "pointer");

      // Create labels using D3 data binding
      const labelSelection = d3Svg.selectAll(".label")
        .data(colaNodes)
        .enter().append("text")
        .attr("class", "label")
        .text((d: any) => d.name)
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("fill", COLORS.nodeText)
        .style("pointer-events", "none");

      // Create groups using D3 data binding
      const groupSelection = d3Svg.selectAll(".group")
        .data(colaGroups)
        .enter().append("rect")
        .attr("class", "group")
        .attr("rx", 8)
        .attr("ry", 8)
        .attr("fill", COLORS.containerFill)
        .attr("stroke", COLORS.containerStroke)
        .attr("stroke-width", "2");

      // Create group labels using D3 data binding
      const groupLabelSelection = d3Svg.selectAll(".group-label")
        .data(colaGroups)
        .enter().append("text")
        .attr("class", "group-label")
        .text((d: any) => d.name)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("fill", COLORS.containerLabel);

      // Create WebCola D3 layout
      console.log('Creating WebCola D3 layout...');
      const d3cola = cola.d3adaptor(d3)
        .linkDistance(100)
        .avoidOverlaps(true)
        .size([dimensions.width, dimensions.height]);

      d3cola.nodes(colaNodes)
        .links(colaLinks)
        .groups(colaGroups as any);

      // Add drag behavior to nodes
      d3Svg.selectAll(".node").call(d3cola.drag());

      // Update function for positions - use D3 selections (like the working example)
      function updatePositions() {
        console.log('updatePositions called');
        
        // Update links using D3 selection (like the working example)
        d3Svg.selectAll(".link")
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        // Update edge labels - position along the line
        d3Svg.selectAll(".edge-label")
          .attr("x", (d: any) => {
            const sx = d.source.x;
            const sy = d.source.y;
            const tx = d.target.x;
            const ty = d.target.y;
            return sx + (tx - sx) * 0.5;
          })
          .attr("y", (d: any) => {
            const sx = d.source.x;
            const sy = d.source.y;
            const tx = d.target.x;
            const ty = d.target.y;
            return sy + (ty - sy) * 0.5 - 10;
          });

        // Update edge label backgrounds to fit text
        d3Svg.selectAll(".edge-label-bg").each(function() {
          const text = d3.select(this.nextSibling);
          const bbox = (text.node() as any).getBBox();
          d3.select(this)
            .attr("x", bbox.x - 4)
            .attr("y", bbox.y - 4)
            .attr("width", bbox.width + 8)
            .attr("height", bbox.height + 8);
        });

        // Update nodes using D3 selection
        d3Svg.selectAll(".node")
          .attr("x", (d: any) => d.x - d.width / 2 + 3)
          .attr("y", (d: any) => d.y - d.height / 2 + 3);

        // Update labels using D3 selection
        d3Svg.selectAll(".label")
          .attr("x", (d: any) => d.x)
          .attr("y", (d: any) => d.y);

        // Update groups using D3 selection
        d3Svg.selectAll(".group")
          .attr("x", (d: any) => (d as any).bounds.x - 10)
          .attr("y", (d: any) => (d as any).bounds.y - 10)
          .attr("width", (d: any) => (d as any).bounds.width() + 20)
          .attr("height", (d: any) => (d as any).bounds.height() + 20);

        // Update group labels using D3 selection
        d3Svg.selectAll(".group-label")
          .attr("x", (d: any) => (d as any).bounds.x + (d as any).bounds.width() / 2)
          .attr("y", (d: any) => (d as any).bounds.y - 15);
      }

      // Register tick handler BEFORE starting layout
      d3cola.on('tick', updatePositions);

      console.log('Starting WebCola layout...');
      d3cola.start(layoutMode === 'static' ? 1 : 30, 20, 20);
      console.log('WebCola layout started');

      return () => {
        d3cola.stop();
      };
    } catch (error) {
      console.error('WebCola component error:', error);
    }
    }, [data, dimensions, currentState, onEventClick, layoutMode]);

  return (
    <div className="hierarchical-webcola">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ border: '1px solid #666', borderRadius: '8px', background: '#1a1a1a' }}
      />
    </div>
  );
}
