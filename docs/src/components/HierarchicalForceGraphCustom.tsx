import { useEffect, useRef, useState } from 'react';

// Custom force simulation - no external dependencies
interface ForceNode {
  id: string;
  name: string;
  group?: string;
  level: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
}

interface ForceLink {
  source: string;
  target: string;
  event: string;
}

interface HierarchicalGraphData {
  nodes: ForceNode[];
  links: ForceLink[];
}

interface HierarchicalForceGraphProps {
  data: HierarchicalGraphData;
  currentState?: string;
  onEventClick?: (event: string) => void;
  layoutMode?: 'springy' | 'static';
}

// Simple convex hull calculation
function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;
  
  // Graham scan algorithm
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  };
  
  const lower: [number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
      lower.pop();
    }
    lower.push(points[i]);
  }
  
  const upper: [number, number][] = [];
  for (let i = points.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
      upper.pop();
    }
    upper.push(points[i]);
  }
  
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

// Create smooth curved path from points using cardinal spline
function smoothHullPath(points: [number, number][], tension: number = 0.5): string {
  if (points.length < 3) {
    // For 2 points, create a rounded rectangle
    if (points.length === 2) {
      const [[x1, y1], [x2, y2]] = points;
      const padding = 35;
      const radius = 15;
      const minX = Math.min(x1, x2) - padding;
      const maxX = Math.max(x1, x2) + padding;
      const minY = Math.min(y1, y2) - padding;
      const maxY = Math.max(y1, y2) + padding;
      return `M${minX + radius},${minY}
              L${maxX - radius},${minY} Q${maxX},${minY} ${maxX},${minY + radius}
              L${maxX},${maxY - radius} Q${maxX},${maxY} ${maxX - radius},${maxY}
              L${minX + radius},${maxY} Q${minX},${maxY} ${minX},${maxY - radius}
              L${minX},${minY + radius} Q${minX},${minY} ${minX + radius},${minY} Z`;
    }
    return '';
  }

  // Close the loop by adding first point at end
  const closed = [...points, points[0], points[1]];

  let path = `M${points[0][0]},${points[0][1]}`;

  for (let i = 0; i < closed.length - 2; i++) {
    const p0 = closed[Math.max(0, i - 1)];
    const p1 = closed[i];
    const p2 = closed[i + 1];
    const p3 = closed[Math.min(closed.length - 1, i + 2)];

    // Calculate control points using Catmull-Rom to Bezier conversion
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6 * tension;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6 * tension;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6 * tension;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6 * tension;

    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }

  return path + ' Z';
}

// Simple force simulation implementation
class ForceSimulation {
  nodes: ForceNode[];
  links: ForceLink[];
  alpha: number = 1;
  alphaMin: number = 0.001;
  alphaDecay: number = 0.0228;
  alphaTarget: number = 0;
  
  constructor(nodes: ForceNode[], links: ForceLink[]) {
    this.nodes = nodes;
    this.links = links;
    this.initializePositions();
  }
  
  initializePositions() {
    // Initialize nodes in a circle
    const centerX = 400;
    const centerY = 300;
    const radius = 200;
    
    this.nodes.forEach((node, i) => {
      const angle = (i / this.nodes.length) * Math.PI * 2;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
      node.vx = 0;
      node.vy = 0;
    });
  }
  
  applyForces() {
    // Apply link forces (springs) - increased ideal distance
    this.links.forEach(link => {
      const source = this.nodes.find(n => n.id === link.source);
      const target = this.nodes.find(n => n.id === link.target);
      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const idealDistance = 120; // Increased from 80
      const strength = 0.05; // Reduced to allow more spreading

      if (distance > 0) {
        const force = (distance - idealDistance) * strength / distance;
        const fx = dx * force;
        const fy = dy * force;

        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }
    });

    // Apply charge forces (repulsion) - stronger repulsion
    this.nodes.forEach((node1, i) => {
      this.nodes.forEach((node2, j) => {
        if (i >= j) return;

        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0 && distance < 400) { // Increased range
          // Stronger repulsion, especially for compound nodes
          const baseStrength = -2000; // Increased from -500
          const strength = baseStrength / (distance * distance);
          const fx = dx * strength / distance;
          const fy = dy * strength / distance;

          node1.vx += fx;
          node1.vy += fy;
          node2.vx -= fx;
          node2.vy -= fy;
        }
      });
    });

    // Apply very gentle center force - just to prevent drift
    this.nodes.forEach(node => {
      const centerX = 400;
      const centerY = 300;
      const strength = 0.002; // Reduced from 0.01

      node.vx += (centerX - node.x) * strength;
      node.vy += (centerY - node.y) * strength;
    });
  }
  
  updatePositions() {
    this.nodes.forEach(node => {
      if (node.fx === null) {
        node.vx *= 0.9; // Damping
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;
      } else {
        node.x = node.fx || 0;
        node.y = node.fy || 0;
        node.vx = 0;
        node.vy = 0;
      }
    });
  }
  
  tick() {
    if (this.alpha < this.alphaMin) return false;
    
    this.applyForces();
    this.updatePositions();
    this.alpha *= (1 - this.alphaDecay);
    
    return true;
  }
  
  restart() {
    this.alpha = 1;
  }
  
  setStaticMode(staticMode: boolean) {
    if (staticMode) {
      // In static mode, set alpha to 0 to stop animation
      this.alpha = 0;
      this.alphaDecay = 0; // Prevent any decay
    } else {
      // In springy mode, reset to default decay rate
      this.alphaDecay = 0.0228;
    }
  }
}

// Color scheme - matching ReactFlow docs aesthetic
const COLORS = {
  // Node colors (light nodes like ReactFlow)
  activeState: '#3b82f6',     // Blue - current state
  groupNode: '#f5f5f5',       // Light gray - compound/group states
  childNode: '#ffffff',       // White - child states
  nodeBorder: '#374151',      // Gray-700 border
  nodeText: '#1f2937',        // Dark gray text

  // Edge colors
  activeEdge: '#3b82f6',      // Blue - can fire from current state
  inactiveEdge: '#9ca3af',    // Gray-400 - softer
  edgeLabel: '#e5e7eb',       // Gray-200
  edgeLabelBg: '#374151',     // Gray-700

  // Container colors (semi-transparent like ReactFlow groups)
  containerFill: 'rgba(107, 114, 128, 0.15)',   // Gray with transparency
  containerStroke: '#6b7280', // Gray-500
  containerLabel: '#9ca3af',  // Gray-400

  // Background
  background: '#1a1a1a',
};

export default function HierarchicalForceGraphCustom({
  data,
  currentState,
  onEventClick,
  layoutMode = 'springy'
}: HierarchicalForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dimensions = { width: 800, height: 600 };

  useEffect(() => {
    console.log('HierarchicalForceGraph: useEffect called with data:', data);
    
    if (!svgRef.current || !data) {
      console.log('No svgRef or data, returning');
      return;
    }

    console.log('Starting force graph rendering...');
    
    try {
      const svg = svgRef.current;
      
      // Clear previous content
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }

      console.log('Creating force simulation...');
      // Transform data to ForceNode format
      const forceNodes = data.nodes.map(node => ({
        ...node,
        x: 0, y: 0, vx: 0, vy: 0, fx: null, fy: null
      }));
      
      const simulation = new ForceSimulation(forceNodes, data.links);
      
      // Apply layout mode
      if (layoutMode === 'static') {
        simulation.setStaticMode(true);
      }
      
      console.log('Setting up SVG dimensions...');
      // Set up SVG dimensions
      svg.setAttribute('width', dimensions.width.toString());
      svg.setAttribute('height', dimensions.height.toString());
      svg.setAttribute('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`);

      // Create defs for arrow markers
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.appendChild(defs);

      // Arrow marker for inactive edges
      const arrowMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      arrowMarker.setAttribute('id', 'arrow');
      arrowMarker.setAttribute('viewBox', '0 -5 10 10');
      arrowMarker.setAttribute('refX', '45'); // Adjusted for rectangular nodes (width 80)
      arrowMarker.setAttribute('refY', '0');
      arrowMarker.setAttribute('markerWidth', '6');
      arrowMarker.setAttribute('markerHeight', '6');
      arrowMarker.setAttribute('orient', 'auto');
      const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      arrowPath.setAttribute('d', 'M0,-5L10,0L0,5');
      arrowPath.setAttribute('fill', COLORS.inactiveEdge);
      arrowMarker.appendChild(arrowPath);
      defs.appendChild(arrowMarker);

      // Arrow marker for active edges
      const activeArrowMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      activeArrowMarker.setAttribute('id', 'arrow-active');
      activeArrowMarker.setAttribute('viewBox', '0 -5 10 10');
      activeArrowMarker.setAttribute('refX', '45'); // Adjusted for rectangular nodes (width 80)
      activeArrowMarker.setAttribute('refY', '0');
      activeArrowMarker.setAttribute('markerWidth', '6');
      activeArrowMarker.setAttribute('markerHeight', '6');
      activeArrowMarker.setAttribute('orient', 'auto');
      const activeArrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      activeArrowPath.setAttribute('d', 'M0,-5L10,0L0,5');
      activeArrowPath.setAttribute('fill', COLORS.activeEdge);
      activeArrowMarker.appendChild(activeArrowPath);
      defs.appendChild(activeArrowMarker);

      // Group nodes by compound state
      const groups = new Map<string, ForceNode[]>();
      forceNodes.forEach(node => {
        const groupName = node.group || 'root';
        if (!groups.has(groupName)) {
          groups.set(groupName, []);
        }
        groups.get(groupName)!.push(node);
      });

      // Create SVG elements
      const containerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      containerGroup.setAttribute('class', 'containers');
      svg.appendChild(containerGroup);

      const linkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      linkGroup.setAttribute('class', 'links');
      svg.appendChild(linkGroup);

      const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      nodeGroup.setAttribute('class', 'nodes');
      svg.appendChild(nodeGroup);

      const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      labelGroup.setAttribute('class', 'labels');
      svg.appendChild(labelGroup);

      const groupLabelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      groupLabelGroup.setAttribute('class', 'group-labels');
      svg.appendChild(groupLabelGroup);

      // Create container shapes
      const containers: SVGPathElement[] = [];
      groups.forEach((groupNodes, groupName) => {
        if (groupName === 'root') return;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'container');
        path.setAttribute('fill', COLORS.containerFill);
        path.setAttribute('stroke', COLORS.containerStroke);
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('stroke-dasharray', '4,2');
        containerGroup.appendChild(path);
        containers.push(path);
      });

      // Create edge label group (rendered after links but before nodes)
      const edgeLabelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      edgeLabelGroup.setAttribute('class', 'edge-labels');

      // Create links as paths (for curves) with labels
      interface LinkElements {
        path: SVGPathElement;
        labelBg: SVGRectElement;
        labelText: SVGTextElement;
        link: ForceLink;
      }
      const linkElements: LinkElements[] = [];

      data.links.forEach(link => {
        // Create path for the edge
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const isActive = link.source === currentState;
        path.setAttribute('stroke', isActive ? COLORS.activeEdge : COLORS.inactiveEdge);
        path.setAttribute('stroke-width', isActive ? '2.5' : '1.5');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', isActive ? 'url(#arrow-active)' : 'url(#arrow)');
        path.style.cursor = 'pointer';
        path.style.transition = 'stroke 0.2s, stroke-width 0.2s';
        linkGroup.appendChild(path);

        // Create label background
        const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        labelBg.setAttribute('fill', COLORS.edgeLabelBg);
        labelBg.setAttribute('rx', '4');
        labelBg.setAttribute('ry', '4');
        labelBg.style.cursor = 'pointer';
        edgeLabelGroup.appendChild(labelBg);

        // Create label text
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('font-size', '10px');
        labelText.setAttribute('text-anchor', 'middle');
        labelText.setAttribute('dy', '.35em');
        labelText.setAttribute('fill', isActive ? COLORS.activeEdge : COLORS.edgeLabel);
        labelText.setAttribute('font-weight', isActive ? 'bold' : 'normal');
        labelText.textContent = link.event;
        labelText.style.cursor = 'pointer';
        labelText.style.pointerEvents = 'none';
        edgeLabelGroup.appendChild(labelText);

        // Add click handler to path and label
        const handleClick = () => {
          if (onEventClick) {
            onEventClick(link.event);
          }
        };
        path.addEventListener('click', handleClick);
        labelBg.addEventListener('click', handleClick);

        // Add hover effect
        const handleMouseEnter = () => {
          path.setAttribute('stroke-width', '3');
          labelBg.setAttribute('fill', COLORS.activeEdge);
          labelText.setAttribute('fill', '#fff');
        };
        const handleMouseLeave = () => {
          path.setAttribute('stroke-width', isActive ? '2.5' : '1.5');
          labelBg.setAttribute('fill', COLORS.edgeLabelBg);
          labelText.setAttribute('fill', isActive ? COLORS.activeEdge : COLORS.edgeLabel);
        };
        path.addEventListener('mouseenter', handleMouseEnter);
        path.addEventListener('mouseleave', handleMouseLeave);
        labelBg.addEventListener('mouseenter', handleMouseEnter);
        labelBg.addEventListener('mouseleave', handleMouseLeave);

        linkElements.push({ path, labelBg, labelText, link });
      });

      // Insert edge labels after links but before nodes
      svg.insertBefore(edgeLabelGroup, nodeGroup);

      // Create nodes as rounded rectangles - set initial positions immediately
      const nodeWidth = 80;
      const nodeHeight = 32;
      const nodeRadius = 8;
      const nodes: SVGRectElement[] = [];
      forceNodes.forEach(node => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', nodeWidth.toString());
        rect.setAttribute('height', nodeHeight.toString());
        rect.setAttribute('x', (node.x - nodeWidth / 2).toString());
        rect.setAttribute('y', (node.y - nodeHeight / 2).toString());
        rect.setAttribute('rx', nodeRadius.toString());
        rect.setAttribute('ry', nodeRadius.toString());
        // Use COLORS: compound states (level 0) = amber, child states = emerald
        const isActive = node.id === currentState || node.id.endsWith('.' + currentState);
        rect.setAttribute('fill', isActive ? COLORS.activeState : (node.level === 0 ? COLORS.groupNode : COLORS.childNode));
        rect.setAttribute('stroke', COLORS.nodeBorder);
        rect.setAttribute('stroke-width', isActive ? '3' : '2');
        rect.style.cursor = 'pointer';
        rect.style.transition = 'fill 0.2s, stroke-width 0.2s';
        nodeGroup.appendChild(rect);
        nodes.push(rect);

        // Add drag functionality
        let isDragging = false;
        rect.addEventListener('mousedown', (e) => {
          isDragging = true;
          (node as any).fx = node.x;
          (node as any).fy = node.y;
          // Temporarily enable animation for smooth dragging
          if (layoutMode === 'static') {
            simulation.alphaDecay = 0.0228; // Enable animation during drag
          }
          simulation.restart();
          e.preventDefault();
        });

        const handleMouseMove = (e: MouseEvent) => {
          if (!isDragging) return;
          const rect = svg.getBoundingClientRect();
          (node as any).fx = e.clientX - rect.left;
          (node as any).fy = e.clientY - rect.top;
          simulation.restart();
        };

        const handleMouseUp = () => {
          if (isDragging) {
            isDragging = false;
            (node as any).fx = null;
            (node as any).fy = null;
            // Restore static mode if needed
            if (layoutMode === 'static') {
              simulation.setStaticMode(true);
            }
            simulation.restart();
          }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      });

      // Create labels - set initial positions immediately
      const labels: SVGTextElement[] = [];
      forceNodes.forEach(node => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x.toString());
        text.setAttribute('y', node.y.toString());
        text.setAttribute('font-size', '12px');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dy', '.35em');
        text.setAttribute('fill', COLORS.nodeText);
        text.textContent = node.name;
        labelGroup.appendChild(text);
        labels.push(text);
      });

      // Create group labels with initial positions
      const groupLabels: SVGTextElement[] = [];
      groups.forEach((groupNodes, groupName) => {
        if (groupName === 'root') return;

        // Calculate initial center position
        const centerX = groupNodes.reduce((sum, n) => sum + n.x, 0) / groupNodes.length;
        const centerY = groupNodes.reduce((sum, n) => sum + n.y, 0) / groupNodes.length;

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', centerX.toString());
        text.setAttribute('y', (centerY - 30).toString()); // Position above group
        text.setAttribute('font-size', '14px');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dy', '.35em');
        text.setAttribute('fill', COLORS.containerLabel);
        text.textContent = groupName;
        groupLabelGroup.appendChild(text);
        groupLabels.push(text);
      });

      // Animation loop
      function animate() {
        if (simulation.tick()) {
          // Update links and edge labels - use forceNodes which has the simulation positions
          linkElements.forEach(({ path, labelBg, labelText, link }) => {
            const source = forceNodes.find(n => n.id === link.source);
            const target = forceNodes.find(n => n.id === link.target);
            if (source && target) {
              // Create curved path (arc)
              const dx = target.x - source.x;
              const dy = target.y - source.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const dr = distance * 0.8; // Curve radius
              const pathData = `M${source.x},${source.y} A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
              path.setAttribute('d', pathData);

              // Position label along the arc curve (at approximately 40% of the path)
              // For an arc from source to target, calculate point at t=0.4
              // Using parametric representation of the arc
              const t = 0.4;
              const angle = Math.atan2(dy, dx);
              const midDistance = distance * t;
              const centerX = source.x + dx * 0.5;
              const centerY = source.y + dy * 0.5;
              
              // Calculate point on arc at parameter t
              // This approximates the curved path position
              const arcPoint = Math.sin((t - 0.5) * Math.PI) * (dr - distance / 2);
              const labelX = source.x + dx * t - Math.sin(angle) * arcPoint;
              const labelY = source.y + dy * t + Math.cos(angle) * arcPoint - 10; // Offset above

              // Update label background to fit text
              const bbox = labelText.getBBox();
              const padding = 4;
              labelBg.setAttribute('x', (bbox.x - padding).toString());
              labelBg.setAttribute('y', (bbox.y - padding).toString());
              labelBg.setAttribute('width', (bbox.width + padding * 2).toString());
              labelBg.setAttribute('height', (bbox.height + padding * 2).toString());
            }
          });

          // Update nodes (rounded rectangles centered on position)
          const nodeWidth = 80;
          const nodeHeight = 32;
          nodes.forEach((rect, i) => {
            const node = forceNodes[i];
            rect.setAttribute('x', (node.x - nodeWidth / 2).toString());
            rect.setAttribute('y', (node.y - nodeHeight / 2).toString());
          });

          // Update labels
          labels.forEach((text, i) => {
            const node = forceNodes[i];
            text.setAttribute('x', node.x.toString());
            text.setAttribute('y', node.y.toString());
          });

          // Update containers with smooth curved edges
          let containerIndex = 0;
          const minPadding = 40; // Minimum padding around nodes

          groups.forEach((groupNodes, groupName) => {
            if (groupName === 'root') return;

            const points = groupNodes.map(n => [n.x, n.y] as [number, number]);

            // Calculate centroid
            const centroidX = points.reduce((sum, [x]) => sum + x, 0) / points.length;
            const centroidY = points.reduce((sum, [, y]) => sum + y, 0) / points.length;

            if (points.length >= 3) {
              const hull = convexHull(points);
              // Expand hull outward from centroid by padding amount + node radius
              // Use max of node half-width/height plus minimum padding
              const nodePadding = Math.max(nodeWidth / 2, nodeHeight / 2) + minPadding;
              const expandedHull = hull.map(([x, y]) => {
                const dx = x - centroidX;
                const dy = y - centroidY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist === 0) return [x, y] as [number, number];
                const scale = (dist + nodePadding) / dist;
                return [centroidX + dx * scale, centroidY + dy * scale] as [number, number];
              });
              // Use smooth curved path instead of sharp edges
              const pathData = smoothHullPath(expandedHull, 2.5);
              containers[containerIndex].setAttribute('d', pathData);
            } else if (points.length === 2) {
              // For 2 points, use smooth rounded rectangle from smoothHullPath
              // Expand to account for node dimensions
              const nodeRadius = Math.max(nodeWidth / 2, nodeHeight / 2) + minPadding;
              const expandedPoints = points.map(([x, y]) => {
                const dx = x - centroidX;
                const dy = y - centroidY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist === 0) return [x, y] as [number, number];
                const scale = (dist + nodeRadius) / dist;
                return [centroidX + dx * scale, centroidY + dy * scale] as [number, number];
              });
              const pathData = smoothHullPath(expandedPoints, 1);
              containers[containerIndex].setAttribute('d', pathData);
            } else if (points.length === 1) {
              // Single point - create rounded rectangle with node padding
              const [[x, y]] = points;
              const nodePadding = Math.max(nodeWidth / 2, nodeHeight / 2) + minPadding;
              const cr = 12; // corner radius
              const pathData = `M${x - nodePadding + cr},${y - nodePadding}
                L${x + nodePadding - cr},${y - nodePadding} Q${x + nodePadding},${y - nodePadding} ${x + nodePadding},${y - nodePadding + cr}
                L${x + nodePadding},${y + nodePadding - cr} Q${x + nodePadding},${y + nodePadding} ${x + nodePadding - cr},${y + nodePadding}
                L${x - nodePadding + cr},${y + nodePadding} Q${x - nodePadding},${y + nodePadding} ${x - nodePadding},${y + nodePadding - cr}
                L${x - nodePadding},${y - nodePadding + cr} Q${x - nodePadding},${y - nodePadding} ${x - nodePadding + cr},${y - nodePadding} Z`;
              containers[containerIndex].setAttribute('d', pathData);
            }

            // Position group label above the container
            const nodePadding = Math.max(nodeWidth / 2, nodeHeight / 2) + minPadding;
            const minY = Math.min(...points.map(([, y]) => y));
            groupLabels[containerIndex].setAttribute('x', centroidX.toString());
            groupLabels[containerIndex].setAttribute('y', (minY - nodePadding - 10).toString());

            containerIndex++;
          });

          requestAnimationFrame(animate);
        }
      }

      animate();

      console.log('Force graph rendering complete!');
      
      return () => {
        simulation.alpha = 0;
      };
    } catch (error) {
      console.error('Error in force graph rendering:', error);
    }
  }, [data, dimensions, layoutMode]);

  return (
    <div className="hierarchical-force-graph">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ border: '1px solid #666', borderRadius: '8px', background: '#1a1a1a' }}
      />
    </div>
  );
}