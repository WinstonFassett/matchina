import { useEffect, useRef } from 'react';

export default function WorkingG6Example() {
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
    svg.style.border = '1px solid #ccc';
    svg.style.borderRadius = '8px';
    
    // Add nodes
    const nodes = [
      { id: 'Red', x: 150, y: 100 },
      { id: 'Yellow', x: 300, y: 100 },
      { id: 'Green', x: 450, y: 100 },
      { id: 'Flashing', x: 300, y: 250 }
    ];
    
    // Add edges
    const edges = [
      { source: 'Red', target: 'Green' },
      { source: 'Green', target: 'Yellow' },
      { source: 'Yellow', target: 'Red' },
      { source: 'Red', target: 'Flashing' },
      { source: 'Yellow', target: 'Flashing' },
      { source: 'Green', target: 'Flashing' },
      { source: 'Flashing', target: 'Red' }
    ];
    
    // Draw edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', sourceNode.x.toString());
        line.setAttribute('y1', sourceNode.y.toString());
        line.setAttribute('x2', targetNode.x.toString());
        line.setAttribute('y2', targetNode.y.toString());
        line.setAttribute('stroke', '#e2e2e2');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        svg.appendChild(line);
      }
    });
    
    // Add arrow marker
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#e2e2e2');
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);
    
    // Draw nodes
    nodes.forEach(node => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x.toString());
      circle.setAttribute('cy', node.y.toString());
      circle.setAttribute('r', '20');
      circle.setAttribute('fill', '#4ECDC4');
      circle.setAttribute('stroke', '#26A69A');
      circle.setAttribute('stroke-width', '2');
      svg.appendChild(circle);
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x.toString());
      text.setAttribute('y', node.y.toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', '.35em');
      text.setAttribute('fill', 'white');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', 'bold');
      text.textContent = node.id;
      svg.appendChild(text);
    });
    
    container.appendChild(svg);
    
    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div className="working-g6-example">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          <strong>G6 Placeholder:</strong> Basic SVG rendering (will be replaced with actual G6)
        </p>
      </div>
      <div ref={containerRef} />
    </div>
  );
}
