import { ELKLayoutEngine } from '../src/viz/ReactFlowV2/layout/engines/ELKLayoutEngine';
import { Node, Edge } from 'reactflow';

// Test with nodes that should be in the same layer (branching)
const testNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Start' } },
  { id: '2', position: { x: 0, y: 0 }, data: { label: 'Option A' } },
  { id: '3', position: { x: 0, y: 0 }, data: { label: 'Option B' } },
  { id: '4', position: { x: 0, y: 0 }, data: { label: 'End' } },
];

const testEdges: Edge[] = [
  { id: '1-2', source: '1', target: '2' },
  { id: '1-3', source: '1', target: '3' },
  { id: '2-4', source: '2', target: '4' },
  { id: '3-4', source: '3', target: '4' },
];

async function testHorizontalSpacing() {
  const engine = new ELKLayoutEngine();
  
  console.log('🧪 Testing nodeSpacing with branching graph (nodes 2&3 should be in same layer)');
  
  // Test with minimal spacing
  const settings1 = { ...engine.getDefaultSettings(), nodeSpacing: 50 };
  const layout1 = await engine.calculateLayout(testNodes, testEdges, settings1);
  console.log('nodeSpacing=50:');
  layout1.nodes.forEach(n => console.log(`  ${n.id}:(${n.position.x.toFixed(1)},${n.position.y.toFixed(1)})`));
  
  // Test with maximum spacing
  const settings2 = { ...engine.getDefaultSettings(), nodeSpacing: 300 };
  const layout2 = await engine.calculateLayout(testNodes, testEdges, settings2);
  console.log('nodeSpacing=300:');
  layout2.nodes.forEach(n => console.log(`  ${n.id}:(${n.position.x.toFixed(1)},${n.position.y.toFixed(1)})`));
  
  // Check if positions changed
  const positions1 = layout1.nodes.map(n => ({x: n.position.x, y: n.position.y}));
  const positions2 = layout2.nodes.map(n => ({x: n.position.x, y: n.position.y}));
  const changed = JSON.stringify(positions1) !== JSON.stringify(positions2);
  
  console.log(`\n✅ nodeSpacing affects layout: ${changed}`);
  
  if (changed) {
    console.log('\n📊 Horizontal spacing differences:');
    layout1.nodes.forEach(n1 => {
      const n2 = layout2.nodes.find(n => n.id === n1.id);
      if (n2) {
        const xDiff = Math.abs(n1.position.x - n2.position.x);
        if (xDiff > 1) {
          console.log(`  ${n1.id}: ${xDiff.toFixed(1)}px horizontal difference`);
        }
      }
    });
  }
}

testHorizontalSpacing().catch(console.error);
