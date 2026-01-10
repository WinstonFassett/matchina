import { ELKLayoutEngine } from '../src/viz/ReactFlowV2/layout/engines/ELKLayoutEngine';
import { Node, Edge } from 'reactflow';

// Test with multiple nodes in same layer to see nodeSpacing effect
const testNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
  { id: '3', position: { x: 0, y: 0 }, data: { label: 'Node 3' } },
  { id: '4', position: { x: 0, y: 0 }, data: { label: 'Node 4' } },
];

const testEdges: Edge[] = [
  { id: '1-2', source: '1', target: '2' },
  { id: '2-3', source: '2', target: '3' },
  { id: '3-4', source: '3', target: '4' },
];

async function testNodeSpacing() {
  const engine = new ELKLayoutEngine();
  
  console.log('🧪 Testing nodeSpacing with 4 nodes in same layer');
  
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
  
  // Show the actual ELK options being used
  console.log('\n🔍 ELK options for nodeSpacing=50:');
  // We need to capture the ELK options from the layout calculation
  console.log('(ELK options would be shown in console logs)');
}

testNodeSpacing().catch(console.error);
