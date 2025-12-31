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

export default function HierarchicalWebCola({ data }: { data: HierarchicalGraphData }) {
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
    const nodeSize = 30;
    const colaNodes: ColaNode[] = data.nodes.map((node, i) => ({
      id: node.id,
      name: node.name,
      group: node.group,
      level: node.level,
      width: nodeSize,
      height: nodeSize,
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
      rect.setAttribute('fill', '#4ecdc4');
      rect.setAttribute('fill-opacity', '0.15');
      rect.setAttribute('stroke', '#4ecdc4');
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
      text.setAttribute('fill', '#4ecdc4');
      text.textContent = group.name;
      groupLabelsGroup.appendChild(text);
      return text;
    });

    // Create links
    const linkLines: SVGLineElement[] = colaLinks.map(link => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', '#999');
      line.setAttribute('stroke-opacity', '0.6');
      line.setAttribute('stroke-width', '2');
      linksGroup.appendChild(line);
      return line;
    });

    // Create nodes
    const nodeCircles: SVGCircleElement[] = colaNodes.map(node => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '15');
      circle.setAttribute('fill', node.level === 0 ? '#ff6b6b' : '#4ecdc4');
      circle.setAttribute('stroke', '#333');
      circle.setAttribute('stroke-width', '2');
      circle.style.cursor = 'pointer';
      nodesGroup.appendChild(circle);
      return circle;
    });

    // Create node labels
    const nodeLabelTexts: SVGTextElement[] = colaNodes.map(node => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('font-size', '11px');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', '.35em');
      text.setAttribute('fill', '#fff');
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
      // Update links
      linkLines.forEach((line, i) => {
        const link = colaLinks[i];
        const source = colaNodes[link.source as number];
        const target = colaNodes[link.target as number];
        if (source && target) {
          line.setAttribute('x1', (source.x || 0).toString());
          line.setAttribute('y1', (source.y || 0).toString());
          line.setAttribute('x2', (target.x || 0).toString());
          line.setAttribute('y2', (target.y || 0).toString());
        }
      });

      // Update nodes
      nodeCircles.forEach((circle, i) => {
        const node = colaNodes[i];
        circle.setAttribute('cx', (node.x || 0).toString());
        circle.setAttribute('cy', (node.y || 0).toString());
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
    nodeCircles.forEach((circle, i) => {
      const node = colaNodes[i];
      let isDragging = false;

      circle.addEventListener('mousedown', (e) => {
        isDragging = true;
        layout.stop();
        e.preventDefault();
      });

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const rect = svg.getBoundingClientRect();
        node.x = e.clientX - rect.left;
        node.y = e.clientY - rect.top;
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
  }, [data, dimensions]);

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
