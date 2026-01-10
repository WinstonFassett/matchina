import { ELKLayoutEngine } from '../src/viz/ReactFlowV2/layout/engines/ELKLayoutEngine';
import { Node, Edge } from 'reactflow';

// Simple test nodes
const testNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
  { id: '3', position: { x: 0, y: 0 }, data: { label: 'Node 3' } },
];

const testEdges: Edge[] = [
  { id: '1-2', source: '1', target: '2' },
  { id: '2-3', source: '2', target: '3' },
];

async function testSetting(settingName: string, value1: any, value2: any, algorithm: string = 'layered'): Promise<boolean> {
  const engine = new ELKLayoutEngine();
  
  const settings1 = engine.getDefaultSettings();
  (settings1 as any)[settingName] = value1;
  const layout1 = await engine.calculateLayout(testNodes, testEdges, settings1);
  
  const settings2 = engine.getDefaultSettings();
  (settings2 as any)[settingName] = value2;
  const layout2 = await engine.calculateLayout(testNodes, testEdges, settings2);
  
  const positions1 = layout1.nodes.map(n => `${n.id}:${n.position.x},${n.position.y}`).join('|');
  const positions2 = layout2.nodes.map(n => `${n.id}:${n.position.x},${n.position.y}`).join('|');
  
  return positions1 !== positions2;
}

async function main() {
  console.log('🧪 ELK Settings Impact Test\n');
  
  const algorithms = ['layered', 'stress', 'force', 'mrtree'];
  
  for (const algorithm of algorithms) {
    console.log(`📊 ${algorithm.toUpperCase()}:`);
    
    // Tests for this algorithm
    const tests = [
      { setting: 'nodeSpacing', values: [50, 150] },
      { setting: 'edgeSpacing', values: [10, 50] },
      { setting: 'layerSpacing', values: [50, 200] },
      { setting: 'direction', values: ['DOWN', 'RIGHT'] },
    ];
    
    // Algorithm-specific tests
    if (algorithm === 'layered') {
      tests.push(
        { setting: 'thoroughness', values: [1, 20] },
        { setting: 'nodePlacementStrategy', values: ['NETWORK_SIMPLEX', 'SIMPLE'] },
        { setting: 'edgeRoutingStrategy', values: ['ORTHOGONAL', 'POLYLINE'] },
        { setting: 'compactionStrategy', values: ['NONE', 'EDGE_LENGTH'] },
        { setting: 'cycleBreakingStrategy', values: ['DEPTH_FIRST', 'GREEDY'] }
      );
    } else if (algorithm === 'stress') {
      tests.push({ setting: 'iterationLimit', values: [50, 500] });
    } else if (algorithm === 'force') {
      tests.push({ setting: 'forceIterations', values: [50, 1000] });
    }
    
    const effective: string[] = [];
    const ineffective: string[] = [];
    
    for (const test of tests) {
      const hasImpact = await testSetting(test.setting, test.values[0], test.values[1], algorithm);
      if (hasImpact) {
        effective.push(test.setting);
      } else {
        ineffective.push(test.setting);
      }
    }
    
    console.log(`  ✅ Effective (${effective.length}): ${effective.join(', ')}`);
    if (ineffective.length > 0) {
      console.log(`  ❌ Ineffective (${ineffective.length}): ${ineffective.join(', ')}`);
    }
    console.log('');
  }
}

main().catch(console.error);
