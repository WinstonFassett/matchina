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
    // Apply link forces (springs)
    this.links.forEach(link => {
      const source = this.nodes.find(n => n.id === link.source);
      const target = this.nodes.find(n => n.id === link.target);
      if (!source || !target) return;
      
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const idealDistance = 80;
      const strength = 0.1;
      
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
    
    // Apply charge forces (repulsion)
    this.nodes.forEach((node1, i) => {
      this.nodes.forEach((node2, j) => {
        if (i >= j) return;
        
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0 && distance < 200) {
          const strength = -500 / (distance * distance);
          const fx = dx * strength / distance;
          const fy = dy * strength / distance;
          
          node1.vx += fx;
          node1.vy += fy;
          node2.vx -= fx;
          node2.vy -= fy;
        }
      });
    });
    
    // Apply center force
    this.nodes.forEach(node => {
      const centerX = 400;
      const centerY = 300;
      const strength = 0.01;
      
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
        node.x = node.fx;
        node.y = node.fy;
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
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes as any)
      .force("link", d3.forceLink(data.links as any)
        .id((d: any) => d.id)
        .distance(80))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Group nodes by compound state
    const groups = d3.group(data.nodes, d => d.group || 'root');

    // Calculate convex hull for each group
    function groupPath(groupNodes: HierarchicalNode[]) {
      if (groupNodes.length <= 2) {
        // Handle small groups
        const points = groupNodes.map(d => [d.x || 0, d.y || 0] as [number, number]);
        if (points.length === 2) {
          // Create a small rectangle around 2 points
          const [[x1, y1], [x2, y2]] = points;
          const padding = 20;
          const minX = Math.min(x1, x2) - padding;
          const maxX = Math.max(x1, x2) + padding;
          const minY = Math.min(y1, y2) - padding;
          const maxY = Math.max(y1, y2) + padding;
          return `M${minX},${minY} L${maxX},${minY} L${maxX},${maxY} L${minX},${maxY} Z`;
        }
        return '';
      }
      
      const points = groupNodes.map(d => [d.x || 0, d.y || 0] as [number, number]);
      const hull = d3.polygonHull(points);
      return hull ? `M${hull.join("L")}Z` : '';
    }

    // Create container shapes for groups
    const containers = svg.append("g")
      .attr("class", "containers")
      .selectAll("path")
      .data(Array.from(groups.entries()))
      .enter()
      .append("path")
      .attr("class", "container")
      .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
      .attr("fill-opacity", 0.1)
      .attr("stroke", (d, i) => d3.schemeCategory10[i % 10])
      .attr("stroke-width", 2);

    // Create links
    const link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(data.links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2);

    // Create nodes
    const node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("r", 15)
      .attr("fill", d => d.level === 0 ? "#ff6b6b" : "#4ecdc4")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .call(d3.drag<SVGCircleElement, HierarchicalNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // Add labels
    const labels = svg.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(data.nodes)
      .enter()
      .append("text")
      .text(d => d.name)
      .attr("font-size", "12px")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em");

    // Add group labels
    const groupLabels = svg.append("g")
      .attr("class", "group-labels")
      .selectAll("text")
      .data(Array.from(groups.entries()))
      .enter()
      .append("text")
      .text(([groupName]) => groupName === 'root' ? '' : groupName)
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      labels
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);

      // Update container shapes
      containers.attr("d", ([, groupNodes]) => groupPath(groupNodes));

      // Update group labels to center of containers
      groupLabels.attr("x", ([, groupNodes]) => {
        const centroid = d3.polygonCentroid(groupNodes.map(d => [d.x || 0, d.y || 0] as [number, number]));
        return centroid[0];
      }).attr("y", ([, groupNodes]) => {
        const centroid = d3.polygonCentroid(groupNodes.map(d => [d.x || 0, d.y || 0] as [number, number]));
        return centroid[1];
      });
    });

    function dragstarted(event: any, d: HierarchicalNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: HierarchicalNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: HierarchicalNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, dimensions]);

  return (
    <div className="hierarchical-force-graph">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ border: '1px solid #ccc', borderRadius: '8px' }}
      />
    </div>
  );
}
