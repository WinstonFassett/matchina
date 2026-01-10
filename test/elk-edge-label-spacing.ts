import { ELKLayoutEngine } from '../src/viz/ReactFlowV2/layout/engines/ELKLayoutEngine';
import { Node, Edge } from 'reactflow';

// Test with edge label spacing requirements
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

async function testEdgeLabelSpacing() {
  const engine = new ELKLayoutEngine();
  
  console.log('🧪 Testing edge label spacing requirements');
  console.log('User requirement: 75-100% of node width for edge labels');
  console.log('For 132px nodes: 99-132px edge label space needed');
  
  // Test with new default (400px)
  const settings = engine.getDefaultSettings();
  console.log(`\n📊 New defaults: nodeSpacing=${settings.nodeSpacing}, layerSpacing=${settings.layerSpacing}`);
  
  const layout = await engine.calculateLayout(testNodes, testEdges, settings);
  console.log('\nLayout with new defaults:');
  layout.nodes.forEach(n => console.log(`  ${n.id}:(${n.position.x.toFixed(1)},${n.position.y.toFixed(1)})`));
  
  // Calculate actual spacing between nodes 2 and 3
  const node2 = layout.nodes.find(n => n.id === '2');
  const node3 = layout.nodes.find(n => n.id === '3');
  if (node2 && node3) {
    const horizontalSpacing = Math.abs(node3.position.x - node2.position.x);
    const nodeWidth = 132; // Actual ReactFlow node width
    const edgeLabelSpace = horizontalSpacing - nodeWidth;
    const edgeLabelPercentage = (edgeLabelSpace / nodeWidth) * 100;
    
    console.log('\n📏 Edge label spacing analysis:');
    console.log(`  Horizontal spacing: ${horizontalSpacing.toFixed(1)}px`);
    console.log(`  Node width: ${nodeWidth}px`);
    console.log(`  Edge label space: ${edgeLabelSpace.toFixed(1)}px`);
    console.log(`  Edge label percentage: ${edgeLabelPercentage.toFixed(1)}%`);
    
    if (edgeLabelPercentage >= 75 && edgeLabelPercentage <= 100) {
      console.log('✅ PERFECT: Edge label spacing meets 75-100% requirement!');
    } else if (edgeLabelPercentage < 75) {
      console.log('⚠️  WARNING: Edge label space too small (<75%)');
    } else {
      console.log('✅ GOOD: Edge label space adequate (>100%)');
    }
  }
}

testEdgeLabelSpacing().catch(console.error);
