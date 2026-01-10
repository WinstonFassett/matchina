import { ELKLayoutEngine } from '../src/viz/ReactFlowV2/layout/engines/ELKLayoutEngine';
import { Node, Edge } from 'reactflow';

const testNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
  { id: '3', position: { x: 0, y: 0 }, data: { label: 'Node 3' } },
];

const testEdges: Edge[] = [
  { id: '1-2', source: '1', target: '2' },
  { id: '2-3', source: '2', target: '3' },
];

async function debugELKOptions() {
  const engine = new ELKLayoutEngine();
  const settings = engine.getDefaultSettings();
  
  console.log('🔍 Default Settings:');
  console.log(JSON.stringify(settings, null, 2));
  
  // Test with different nodeSpacing values
  console.log('\n🧪 Testing nodeSpacing impact:');
  
  const settings1 = { ...settings, nodeSpacing: 50 };
  const layout1 = await engine.calculateLayout(testNodes, testEdges, settings1);
  console.log('nodeSpacing=50 positions:', layout1.nodes.map(n => `${n.id}:(${n.position.x},${n.position.y})`));
  
  const settings2 = { ...settings, nodeSpacing: 200 };
  const layout2 = await engine.calculateLayout(testNodes, testEdges, settings2);
  console.log('nodeSpacing=200 positions:', layout2.nodes.map(n => `${n.id}:(${n.position.x},${n.position.y})`));
  
  // Check if positions changed
  const changed = JSON.stringify(layout1.nodes.map(n => ({x: n.position.x, y: n.position.y}))) !== 
                  JSON.stringify(layout2.nodes.map(n => ({x: n.position.x, y: n.position.y})));
  console.log(`Positions changed: ${changed}`);
  
  // Test thoroughness
  console.log('\n🧪 Testing thoroughness impact:');
  
  const settings3 = { ...settings, thoroughness: 1 };
  const layout3 = await engine.calculateLayout(testNodes, testEdges, settings3);
  console.log('thoroughness=1 positions:', layout3.nodes.map(n => `${n.id}:(${n.position.x},${n.position.y})`));
  
  const settings4 = { ...settings, thoroughness: 20 };
  const layout4 = await engine.calculateLayout(testNodes, testEdges, settings4);
  console.log('thoroughness=20 positions:', layout4.nodes.map(n => `${n.id}:(${n.position.x},${n.position.y})`));
  
  const changed2 = JSON.stringify(layout3.nodes.map(n => ({x: n.position.x, y: n.position.y}))) !== 
                   JSON.stringify(layout4.nodes.map(n => ({x: n.position.x, y: n.position.y})));
  console.log(`Positions changed: ${changed2}`);
}

debugELKOptions().catch(console.error);
