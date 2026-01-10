import { ELKLayoutEngine } from '../src/viz/ReactFlowV2/layout/engines/ELKLayoutEngine';
import { Node, Edge } from 'reactflow';

// More complex test case - multiple nodes per layer
const complexNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
  { id: '3', position: { x: 0, y: 0 }, data: { label: 'Node 3' } },
  { id: '4', position: { x: 0, y: 0 }, data: { label: 'Node 4' } },
  { id: '5', position: { x: 0, y: 0 }, data: { label: 'Node 5' } },
  { id: '6', position: { x: 0, y: 0 }, data: { label: 'Node 6' } },
];

const complexEdges: Edge[] = [
  { id: '1-2', source: '1', target: '2' },
  { id: '1-3', source: '1', target: '3' },
  { id: '2-4', source: '2', target: '4' },
  { id: '2-5', source: '2', target: '5' },
  { id: '3-6', source: '3', target: '6' },
  { id: '4-6', source: '4', target: '6' },
];

async function testComplexGraph() {
  const engine = new ELKLayoutEngine();
  const settings = engine.getDefaultSettings();
  
  console.log('🔍 Complex Graph Test - Multiple nodes per layer');
  console.log('Graph: 6 nodes, 6 edges with branching');
  
  // Test nodeSpacing - should affect horizontal spacing
  console.log('\n🧪 Testing nodeSpacing (horizontal spacing):');
  
  const settings1 = { ...settings, nodeSpacing: 50 };
  const layout1 = await engine.calculateLayout(complexNodes, complexEdges, settings1);
  console.log('nodeSpacing=50 positions:');
  layout1.nodes.forEach(n => console.log(`  ${n.id}:(${n.position.x},${n.position.y})`));
  
  const settings2 = { ...settings, nodeSpacing: 200 };
  const layout2 = await engine.calculateLayout(complexNodes, complexEdges, settings2);
  console.log('nodeSpacing=200 positions:');
  layout2.nodes.forEach(n => console.log(`  ${n.id}:(${n.position.x},${n.position.y})`));
  
  const nodeSpacingChanged = JSON.stringify(layout1.nodes.map(n => ({x: n.position.x, y: n.position.y}))) !== 
                          JSON.stringify(layout2.nodes.map(n => ({x: n.position.x, y: n.position.y})));
  console.log(`✅ nodeSpacing affects layout: ${nodeSpacingChanged}`);
  
  // Test thoroughness - should affect crossing minimization
  console.log('\n🧪 Testing thoroughness (crossing minimization):');
  
  const settings3 = { ...settings, thoroughness: 1 };
  const layout3 = await engine.calculateLayout(complexNodes, complexEdges, settings3);
  console.log('thoroughness=1 positions:');
  layout3.nodes.forEach(n => console.log(`  ${n.id}:(${n.position.x},${n.position.y})`));
  
  const settings4 = { ...settings, thoroughness: 20 };
  const layout4 = await engine.calculateLayout(complexNodes, complexEdges, settings4);
  console.log('thoroughness=20 positions:');
  layout4.nodes.forEach(n => console.log(`  ${n.id}:(${n.position.x},${n.position.y})`));
  
  const thoroughnessChanged = JSON.stringify(layout3.nodes.map(n => ({x: n.position.x, y: n.position.y}))) !== 
                            JSON.stringify(layout4.nodes.map(n => ({x: n.position.x, y: n.position.y})));
  console.log(`✅ thoroughness affects layout: ${thoroughnessChanged}`);
  
  // Test nodePlacementStrategy
  console.log('\n🧪 Testing nodePlacementStrategy:');
  
  const settings5 = { ...settings, nodePlacementStrategy: 'NETWORK_SIMPLEX' };
  const layout5 = await engine.calculateLayout(complexNodes, complexEdges, settings5);
  console.log('NETWORK_SIMPLEX positions:');
  layout5.nodes.forEach(n => console.log(`  ${n.id}:(${n.position.x},${n.position.y})`));
  
  const settings6 = { ...settings, nodePlacementStrategy: 'SIMPLE' };
  const layout6 = await engine.calculateLayout(complexNodes, complexEdges, settings6);
  console.log('SIMPLE positions:');
  layout6.nodes.forEach(n => console.log(`  ${n.id}:(${n.position.x},${n.position.y})`));
  
  const placementChanged = JSON.stringify(layout5.nodes.map(n => ({x: n.position.x, y: n.position.y}))) !== 
                         JSON.stringify(layout6.nodes.map(n => ({x: n.position.x, y: n.position.y})));
  console.log(`✅ nodePlacementStrategy affects layout: ${placementChanged}`);
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`nodeSpacing effective: ${nodeSpacingChanged}`);
  console.log(`thoroughness effective: ${thoroughnessChanged}`);
  console.log(`nodePlacementStrategy effective: ${placementChanged}`);
}

testComplexGraph().catch(console.error);
