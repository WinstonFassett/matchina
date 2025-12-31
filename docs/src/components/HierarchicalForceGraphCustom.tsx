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
}

export default function HierarchicalForceGraph({ data }: { data: HierarchicalGraphData }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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
      
      console.log('Setting up SVG dimensions...');
      // Set up SVG dimensions
      svg.setAttribute('width', dimensions.width.toString());
      svg.setAttribute('height', dimensions.height.toString());
      svg.setAttribute('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`);

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
        path.setAttribute('fill', '#4ecdc4');
        path.setAttribute('fill-opacity', '0.1');
        path.setAttribute('stroke', '#4ecdc4');
        path.setAttribute('stroke-width', '2');
        containerGroup.appendChild(path);
        containers.push(path);
      });

      // Create links
      const links: SVGLineElement[] = [];
      data.links.forEach(link => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('stroke', '#999');
        line.setAttribute('stroke-opacity', '0.6');
        line.setAttribute('stroke-width', '2');
        linkGroup.appendChild(line);
        links.push(line);
      });

      // Create nodes - set initial positions immediately
      const nodes: SVGCircleElement[] = [];
      forceNodes.forEach(node => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', '15');
        circle.setAttribute('cx', node.x.toString());
        circle.setAttribute('cy', node.y.toString());
        circle.setAttribute('fill', node.level === 0 ? '#ff6b6b' : '#4ecdc4');
        circle.setAttribute('stroke', '#333');
        circle.setAttribute('stroke-width', '2');
        circle.style.cursor = 'pointer';
        nodeGroup.appendChild(circle);
        nodes.push(circle);

        // Add drag functionality
        let isDragging = false;
        circle.addEventListener('mousedown', (e) => {
          isDragging = true;
          node.fx = node.x;
          node.fy = node.y;
          simulation.restart();
          e.preventDefault();
        });

        const handleMouseMove = (e: MouseEvent) => {
          if (!isDragging) return;
          const rect = svg.getBoundingClientRect();
          node.fx = e.clientX - rect.left;
          node.fy = e.clientY - rect.top;
          simulation.restart();
        };

        const handleMouseUp = () => {
          if (isDragging) {
            isDragging = false;
            node.fx = null;
            node.fy = null;
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
        text.setAttribute('fill', '#fff');
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
        text.setAttribute('fill', '#4ecdc4');
        text.textContent = groupName;
        groupLabelGroup.appendChild(text);
        groupLabels.push(text);
      });

      // Animation loop
      function animate() {
        if (simulation.tick()) {
          // Update links - use forceNodes which has the simulation positions
          links.forEach((line, i) => {
            const link = data.links[i];
            const source = forceNodes.find(n => n.id === link.source);
            const target = forceNodes.find(n => n.id === link.target);
            if (source && target) {
              line.setAttribute('x1', source.x.toString());
              line.setAttribute('y1', source.y.toString());
              line.setAttribute('x2', target.x.toString());
              line.setAttribute('y2', target.y.toString());
            }
          });

          // Update nodes
          nodes.forEach((circle, i) => {
            const node = forceNodes[i];
            circle.setAttribute('cx', node.x.toString());
            circle.setAttribute('cy', node.y.toString());
          });

          // Update labels
          labels.forEach((text, i) => {
            const node = forceNodes[i];
            text.setAttribute('x', node.x.toString());
            text.setAttribute('y', node.y.toString());
          });

          // Update containers with padding
          let containerIndex = 0;
          const containerPadding = 35; // Padding around nodes

          groups.forEach((groupNodes, groupName) => {
            if (groupName === 'root') return;

            const points = groupNodes.map(n => [n.x, n.y] as [number, number]);

            // Calculate centroid
            const centroidX = points.reduce((sum, [x]) => sum + x, 0) / points.length;
            const centroidY = points.reduce((sum, [, y]) => sum + y, 0) / points.length;

            if (points.length >= 3) {
              const hull = convexHull(points);
              // Expand hull outward from centroid by padding amount
              const expandedHull = hull.map(([x, y]) => {
                const dx = x - centroidX;
                const dy = y - centroidY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist === 0) return [x, y] as [number, number];
                const scale = (dist + containerPadding) / dist;
                return [centroidX + dx * scale, centroidY + dy * scale] as [number, number];
              });
              const pathData = `M${expandedHull.map(p => p.join(',')).join(' L')} Z`;
              containers[containerIndex].setAttribute('d', pathData);
            } else if (points.length === 2) {
              // Create rectangle around 2 points
              const [[x1, y1], [x2, y2]] = points;
              const minX = Math.min(x1, x2) - containerPadding;
              const maxX = Math.max(x1, x2) + containerPadding;
              const minY = Math.min(y1, y2) - containerPadding;
              const maxY = Math.max(y1, y2) + containerPadding;
              const pathData = `M${minX},${minY} L${maxX},${minY} L${maxX},${maxY} L${minX},${maxY} Z`;
              containers[containerIndex].setAttribute('d', pathData);
            } else if (points.length === 1) {
              // Single point - create circle-like hexagon
              const [[x, y]] = points;
              const r = containerPadding;
              const hexPath = `M${x},${y-r} L${x+r*0.866},${y-r*0.5} L${x+r*0.866},${y+r*0.5} L${x},${y+r} L${x-r*0.866},${y+r*0.5} L${x-r*0.866},${y-r*0.5} Z`;
              containers[containerIndex].setAttribute('d', hexPath);
            }

            // Position group label above the container
            const minY = Math.min(...points.map(([, y]) => y));
            groupLabels[containerIndex].setAttribute('x', centroidX.toString());
            groupLabels[containerIndex].setAttribute('y', (minY - containerPadding - 10).toString());

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
  }, [data, dimensions]);

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