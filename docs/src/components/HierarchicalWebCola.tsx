import { useEffect, useRef, useState } from 'react';
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

interface ColaGroup extends cola.Group {
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

export default function HierarchicalWebCola({ data, currentState, onEventClick }: HierarchicalWebColaProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!svgRef.current || !data) return;

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
      .map(link => ({
        source: nodeIndex.get(link.source)!,
        target: nodeIndex.get(link.target)!,
        event: link.event,
      }))
      .filter(link => link.source !== undefined && link.target !== undefined);

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

    // Create SVG groups for layering
    const groupsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    groupsGroup.setAttribute('class', 'groups');
    svg.appendChild(groupsGroup);

    const linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    linksGroup.setAttribute('class', 'links');
    svg.appendChild(linksGroup);

    const edgeLabelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    edgeLabelGroup.setAttribute('class', 'edge-labels');
    svg.appendChild(edgeLabelGroup);

    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodesGroup.setAttribute('class', 'nodes');
    svg.appendChild(nodesGroup);

    const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelsGroup.setAttribute('class', 'labels');
    svg.appendChild(labelsGroup);

    const groupLabelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    groupLabelsGroup.setAttribute('class', 'group-labels');
    svg.appendChild(groupLabelsGroup);

    // Create group rectangles
    const groupRects: SVGRectElement[] = colaGroups.map(group => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('rx', '8');
      rect.setAttribute('ry', '8');
      rect.setAttribute('fill', COLORS.containerFill);
      rect.setAttribute('stroke', COLORS.containerStroke);
      rect.setAttribute('stroke-width', '2');
      groupsGroup.appendChild(rect);
      return rect;
    });

    // Create group labels
    const groupLabelTexts: SVGTextElement[] = colaGroups.map(group => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('font-size', '14px');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', COLORS.containerLabel);
      text.textContent = group.name;
      groupLabelsGroup.appendChild(text);
      return text;
    });

    // Create links as paths (for curves) and edge labels
    const linkPaths: SVGPathElement[] = [];
    const edgeLabelElements: Array<{ labelBg: SVGRectElement; labelText: SVGTextElement; link: ColaLink }> = [];

    colaLinks.forEach(link => {
      // Create curved path for link
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', COLORS.inactiveEdge);
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('pointer-events', 'stroke');
      path.style.cursor = 'pointer';
      linksGroup.appendChild(path);
      linkPaths.push(path);

      // Create edge label background
      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      labelBg.setAttribute('rx', '3');
      labelBg.setAttribute('ry', '3');
      labelBg.setAttribute('fill', COLORS.edgeLabelBg);
      labelBg.style.cursor = 'pointer';
      edgeLabelGroup.appendChild(labelBg);

      // Create edge label text
      const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelText.setAttribute('font-size', '11px');
      labelText.setAttribute('text-anchor', 'middle');
      labelText.setAttribute('dy', '.35em');
      labelText.setAttribute('fill', COLORS.edgeLabel);
      labelText.setAttribute('pointer-events', 'none');
      labelText.textContent = link.event;
      edgeLabelGroup.appendChild(labelText);

      // Add click handler
      const handleClick = () => {
        if (onEventClick) {
          onEventClick(link.event);
        }
      };
      path.addEventListener('click', handleClick);
      labelBg.addEventListener('click', handleClick);

      // Add hover effects
      const handleMouseEnter = () => {
        path.setAttribute('stroke', COLORS.activeEdge);
        path.setAttribute('stroke-width', '2.5');
        labelBg.setAttribute('fill', COLORS.activeEdge);
        labelText.setAttribute('fill', '#fff');
      };
      const handleMouseLeave = () => {
        path.setAttribute('stroke', COLORS.inactiveEdge);
        path.setAttribute('stroke-width', '1.5');
        labelBg.setAttribute('fill', COLORS.edgeLabelBg);
        labelText.setAttribute('fill', COLORS.edgeLabel);
      };
      path.addEventListener('mouseenter', handleMouseEnter);
      path.addEventListener('mouseleave', handleMouseLeave);
      labelBg.addEventListener('mouseenter', handleMouseEnter);
      labelBg.addEventListener('mouseleave', handleMouseLeave);

      edgeLabelElements.push({ labelBg, labelText, link });
    });

    // Create nodes as rounded rectangles (to match custom force graph)
    const nodeWidth = 80;
    const nodeHeight = 32;
    const nodeRadius = 8;
    const nodeRects: SVGRectElement[] = colaNodes.map(node => {
      const isActive = node.id === currentState || node.id.endsWith('.' + currentState);
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', nodeWidth.toString());
      rect.setAttribute('height', nodeHeight.toString());
      rect.setAttribute('rx', nodeRadius.toString());
      rect.setAttribute('ry', nodeRadius.toString());
      rect.setAttribute('fill', isActive ? COLORS.activeState : (node.level === 0 ? COLORS.groupNode : COLORS.childNode));
      rect.setAttribute('stroke', COLORS.nodeBorder);
      rect.setAttribute('stroke-width', isActive ? '3' : '2');
      rect.style.cursor = 'pointer';
      rect.style.transition = 'fill 0.2s, stroke-width 0.2s';
      nodesGroup.appendChild(rect);
      return rect;
    });

    // Create node labels
    const nodeLabelTexts: SVGTextElement[] = colaNodes.map(node => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('font-size', '12px');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', '.35em');
      text.setAttribute('fill', COLORS.nodeText);
      text.setAttribute('pointer-events', 'none');
      text.textContent = node.name;
      labelsGroup.appendChild(text);
      return text;
    });

    // Create WebCola layout
    const layout = new cola.Layout()
      .size([dimensions.width, dimensions.height])
      .nodes(colaNodes)
      .links(colaLinks)
      .groups(colaGroups)
      .linkDistance(100)
      .avoidOverlaps(true)
      .handleDisconnected(true)
      .start(30, 20, 20);

    // Update function for positions
    function updatePositions() {
      // Update links with curved paths
      linkPaths.forEach((path, i) => {
        const link = colaLinks[i];
        const source = colaNodes[link.source as number];
        const target = colaNodes[link.target as number];
        if (source && target) {
          // Create curved path (arc)
          const dx = (target.x || 0) - (source.x || 0);
          const dy = (target.y || 0) - (source.y || 0);
          const dr = Math.sqrt(dx * dx + dy * dy) * 0.8;
          const pathData = `M${source.x || 0},${source.y || 0} A${dr},${dr} 0 0,1 ${target.x || 0},${target.y || 0}`;
          path.setAttribute('d', pathData);
        }
      });

      // Update edge labels
      edgeLabelElements.forEach(({ labelBg, labelText, link }) => {
        const source = colaNodes[link.source as number];
        const target = colaNodes[link.target as number];
        if (source && target) {
          const midX = ((source.x || 0) + (target.x || 0)) / 2;
          const midY = ((source.y || 0) + (target.y || 0)) / 2 - 10;
          labelText.setAttribute('x', midX.toString());
          labelText.setAttribute('y', midY.toString());

          // Update label background to fit text
          const bbox = labelText.getBBox();
          const padding = 4;
          labelBg.setAttribute('x', (bbox.x - padding).toString());
          labelBg.setAttribute('y', (bbox.y - padding).toString());
          labelBg.setAttribute('width', (bbox.width + padding * 2).toString());
          labelBg.setAttribute('height', (bbox.height + padding * 2).toString());
        }
      });

      // Update nodes (rounded rectangles)
      nodeRects.forEach((rect, i) => {
        const node = colaNodes[i];
        rect.setAttribute('x', ((node.x || 0) - nodeWidth / 2).toString());
        rect.setAttribute('y', ((node.y || 0) - nodeHeight / 2).toString());
      });

      // Update node labels
      nodeLabelTexts.forEach((text, i) => {
        const node = colaNodes[i];
        text.setAttribute('x', (node.x || 0).toString());
        text.setAttribute('y', (node.y || 0).toString());
      });

      // Update groups
      colaGroups.forEach((group, i) => {
        const bounds = group.bounds;
        if (bounds) {
          const padding = 10;
          groupRects[i].setAttribute('x', (bounds.x - padding).toString());
          groupRects[i].setAttribute('y', (bounds.y - padding).toString());
          groupRects[i].setAttribute('width', (bounds.width() + padding * 2).toString());
          groupRects[i].setAttribute('height', (bounds.height() + padding * 2).toString());

          // Position group label above
          groupLabelTexts[i].setAttribute('x', (bounds.x + bounds.width() / 2).toString());
          groupLabelTexts[i].setAttribute('y', (bounds.y - padding - 5).toString());
        }
      });
    }

    // Register tick handler
    layout.on('tick', updatePositions);

    // Add drag behavior
    nodeRects.forEach((rect, i) => {
      const node = colaNodes[i];
      let isDragging = false;

      rect.addEventListener('mousedown', (e) => {
        isDragging = true;
        layout.stop();
        e.preventDefault();
      });

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const svgRect = svg.getBoundingClientRect();
        node.x = e.clientX - svgRect.left;
        node.y = e.clientY - svgRect.top;
        updatePositions();
      };

      const handleMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          layout.resume();
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });

    // Initial update
    updatePositions();

    return () => {
      layout.stop();
    };
    }, [data, dimensions, currentState, onEventClick]);

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
