import { useEffect, useRef } from 'react';

export default function TrafficLightG6Example() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Simple G6 implementation without complex types
    const container = containerRef.current;
    
    // Clear previous content
    container.innerHTML = '';
    
    // Create a simple SVG graph as placeholder for G6
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '600');
    svg.setAttribute('height', '400');
    svg.style.border = '1px solid #333';
    svg.style.borderRadius = '8px';
    svg.style.background = '#1a1a1a';
    
    // Define hierarchical groups
    const trafficLightGroup = { x: 300, y: 100, width: 400, height: 120 };
    const emergencyGroup = { x: 300, y: 280, width: 120, height: 60 };
    
    // Draw group containers (dark theme)
    const trafficLightRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    trafficLightRect.setAttribute('x', (trafficLightGroup.x - trafficLightGroup.width/2).toString());
    trafficLightRect.setAttribute('y', (trafficLightGroup.y - trafficLightGroup.height/2).toString());
    trafficLightRect.setAttribute('width', trafficLightGroup.width.toString());
    trafficLightRect.setAttribute('height', trafficLightGroup.height.toString());
    trafficLightRect.setAttribute('fill', '#2a2a2a');
    trafficLightRect.setAttribute('stroke', '#666');
    trafficLightRect.setAttribute('stroke-width', '1');
    trafficLightRect.setAttribute('stroke-opacity', '0.5');
    trafficLightRect.setAttribute('fill-opacity', '0.5');
    trafficLightRect.setAttribute('rx', '8');
    svg.appendChild(trafficLightRect);
    
    const emergencyRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    emergencyRect.setAttribute('x', (emergencyGroup.x - emergencyGroup.width/2).toString());
    emergencyRect.setAttribute('y', (emergencyGroup.y - emergencyGroup.height/2).toString());
    emergencyRect.setAttribute('width', emergencyGroup.width.toString());
    emergencyRect.setAttribute('height', emergencyGroup.height.toString());
    emergencyRect.setAttribute('fill', '#2a2a2a');
    emergencyRect.setAttribute('stroke', '#666');
    emergencyRect.setAttribute('stroke-width', '1');
    emergencyRect.setAttribute('stroke-opacity', '0.5');
    emergencyRect.setAttribute('fill-opacity', '0.5');
    emergencyRect.setAttribute('rx', '8');
    svg.appendChild(emergencyRect);
    
    // Add group labels (dark theme)
    const trafficLightLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    trafficLightLabel.setAttribute('x', (trafficLightGroup.x - trafficLightGroup.width/2 + 10).toString());
    trafficLightLabel.setAttribute('y', (trafficLightGroup.y - trafficLightGroup.height/2 + 20).toString());
    trafficLightLabel.setAttribute('fill', '#999');
    trafficLightLabel.setAttribute('font-size', '12');
    trafficLightLabel.setAttribute('font-weight', 'bold');
    trafficLightLabel.textContent = 'TrafficLight';
    svg.appendChild(trafficLightLabel);
    
    const emergencyLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    emergencyLabel.setAttribute('x', (emergencyGroup.x - emergencyGroup.width/2 + 10).toString());
    emergencyLabel.setAttribute('y', (emergencyGroup.y - emergencyGroup.height/2 + 20).toString());
    emergencyLabel.setAttribute('fill', '#999');
    emergencyLabel.setAttribute('font-size', '12');
    emergencyLabel.setAttribute('font-weight', 'bold');
    emergencyLabel.textContent = 'Emergency';
    svg.appendChild(emergencyLabel);
    
    // Add nodes (rounded rectangles sized to text)
    const nodes = [
      { id: 'Red', x: 150, y: 100, active: true },
      { id: 'Yellow', x: 300, y: 100, active: false },
      { id: 'Green', x: 450, y: 100, active: false },
      { id: 'Flashing', x: 300, y: 280, active: false }
    ];
    
    // Calculate text dimensions for proper sizing
    const textWidths: Record<string, number> = {
      'Red': 30,
      'Yellow': 45,
      'Green': 35,
      'Flashing': 55
    };
    
    const nodeWidth = 80; // Base width
    const nodeHeight = 32; // Base height
    const padding = 12; // Text padding
    
    // Add edges with labels
    const edges = [
      { source: 'Red', target: 'Green', label: 'Timer' },
      { source: 'Green', target: 'Yellow', label: 'Timer' },
      { source: 'Yellow', target: 'Red', label: 'Timer' },
      { source: 'Red', target: 'Flashing', label: 'Emergency' },
      { source: 'Yellow', target: 'Flashing', label: 'Emergency' },
      { source: 'Green', target: 'Flashing', label: 'Emergency' },
      { source: 'Flashing', target: 'Red', label: 'Reset' }
    ];
    
    // Draw edges first (so they appear behind nodes)
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        // Calculate edge midpoint for label positioning
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        
        // Draw edge line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', sourceNode.x.toString());
        line.setAttribute('y1', sourceNode.y.toString());
        line.setAttribute('x2', targetNode.x.toString());
        line.setAttribute('y2', targetNode.y.toString());
        line.setAttribute('stroke', '#666');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        svg.appendChild(line);
        
        // Add edge label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', midX.toString());
        label.setAttribute('y', (midY - 5).toString());
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', '#999');
        label.setAttribute('font-size', '10');
        label.setAttribute('font-style', 'italic');
        label.textContent = edge.label;
        svg.appendChild(label);
      }
    });
    
    // Add arrow marker
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 8 3, 0 6');
    polygon.setAttribute('fill', '#666');
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);
    
    // Draw nodes as rounded rectangles (ReactFlow/D3 style)
    nodes.forEach(node => {
      const width = Math.max(nodeWidth, textWidths[node.id] + padding);
      const height = nodeHeight;
      
      // Draw rounded rectangle
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', (node.x - width/2).toString());
      rect.setAttribute('y', (node.y - height/2).toString());
      rect.setAttribute('width', width.toString());
      rect.setAttribute('height', height.toString());
      rect.setAttribute('rx', '6'); // Rounded corners
      rect.setAttribute('ry', '6');
      
      // Active state highlighting
      if (node.active) {
        rect.setAttribute('fill', '#ff4444');
        rect.setAttribute('stroke', '#ff6666');
      } else {
        rect.setAttribute('fill', '#4a5568');
        rect.setAttribute('stroke', '#666');
      }
      
      rect.setAttribute('stroke-width', '2');
      svg.appendChild(rect);
      
      // Add text label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x.toString());
      text.setAttribute('y', node.y.toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', '.35em');
      text.setAttribute('fill', node.active ? '#fff' : '#ccc');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', '500');
      text.textContent = node.id;
      svg.appendChild(text);
    });
    
    container.appendChild(svg);
    
    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div className="traffic-light-g6-example">
      <div ref={containerRef} />
    </div>
  );
}