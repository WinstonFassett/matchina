import { ELKLayoutEngine } from '../src/viz/ReactFlowV2/layout/engines/ELKLayoutEngine';
import { Node, Edge } from 'reactflow';

// Simple test nodes for layout testing
const testNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
  { id: '3', position: { x: 0, y: 0 }, data: { label: 'Node 3' } },
];

const testEdges: Edge[] = [
  { id: '1-2', source: '1', target: '2' },
  { id: '2-3', source: '2', target: '3' },
];

// Test if changing a setting actually changes node positions
export async function testSettingImpact(
  settingName: string,
  value1: any,
  value2: any,
  algorithm: string = 'layered'
): Promise<{ hasImpact: boolean; positions1: any[]; positions2: any[] }> {
  const engine = new ELKLayoutEngine();
  
  // Test with first value
  const settings1 = engine.getDefaultSettings();
  (settings1 as any)[settingName] = value1;
  const layout1 = await engine.calculateLayout(testNodes, testEdges, settings1);
  
  // Test with second value
  const settings2 = engine.getDefaultSettings();
  (settings2 as any)[settingName] = value2;
  const layout2 = await engine.calculateLayout(testNodes, testEdges, settings2);
  
  // Extract positions
  const positions1 = layout1.nodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }));
  const positions2 = layout2.nodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }));
  
  // Check if positions changed
  const hasImpact = JSON.stringify(positions1) !== JSON.stringify(positions2);
  
  return { hasImpact, positions1, positions2 };
}

// Test all settings for a specific algorithm
export async function testAlgorithmSettings(algorithm: string): Promise<{
  setting: string;
  hasImpact: boolean;
  testValues: any[];
}[]> {
  const engine = new ELKLayoutEngine();
  const defaultSettings = engine.getDefaultSettings();
  
  const tests = [
    // Basic spacing settings
    { setting: 'nodeSpacing', values: [50, 150] },
    { setting: 'edgeSpacing', values: [10, 50] },
    { setting: 'layerSpacing', values: [50, 200] },
    
    // Direction
    { setting: 'direction', values: ['DOWN', 'RIGHT'] },
    
    // Algorithm-specific settings
    ...(algorithm === 'layered' ? [
      { setting: 'thoroughness', values: [1, 20] },
      { setting: 'nodePlacementStrategy', values: ['NETWORK_SIMPLEX', 'SIMPLE'] },
      { setting: 'edgeRoutingStrategy', values: ['ORTHOGONAL', 'POLYLINE'] },
      { setting: 'compactionStrategy', values: ['NONE', 'EDGE_LENGTH'] },
      { setting: 'cycleBreakingStrategy', values: ['DEPTH_FIRST', 'GREEDY'] },
    ] : []),
    
    ...(algorithm === 'stress' ? [
      { setting: 'iterationLimit', values: [50, 500] },
    ] : []),
    
    ...(algorithm === 'force' ? [
      { setting: 'forceIterations', values: [50, 1000] },
    ] : []),
    
    ...(algorithm === 'mrtree' ? [
      // mrtree doesn't have many user-configurable options
    ] : []),
  ];
  
  const results = [];
  
  for (const test of tests) {
    const { hasImpact } = await testSettingImpact(
      test.setting,
      test.values[0],
      test.values[1],
      algorithm
    );
    
    results.push({
      setting: test.setting,
      hasImpact,
      testValues: test.values
    });
  }
  
  return results;
}

// Run comprehensive test
async function runELKSettingsTest(): Promise<void> {
  console.log('🧪 Testing ELK Settings Impact...\n');
  
  const algorithms = ['layered', 'stress', 'force', 'mrtree'];
  
  for (const algorithm of algorithms) {
    console.log(`📊 Testing ${algorithm.toUpperCase()} algorithm:`);
    
    const results = await testAlgorithmSettings(algorithm);
    
    const effective = results.filter(r => r.hasImpact);
    const ineffective = results.filter(r => !r.hasImpact);
    
    console.log(`  ✅ Effective settings (${effective.length}):`);
    effective.forEach(r => console.log(`    - ${r.setting}`));
    
    if (ineffective.length > 0) {
      console.log(`  ❌ Ineffective settings (${ineffective.length}):`);
      ineffective.forEach(r => console.log(`    - ${r.setting}`));
    }
    
    console.log('');
  }
}

// Run the test
runELKSettingsTest().catch(console.error);
