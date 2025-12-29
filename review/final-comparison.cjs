const fs = require('fs');
const path = require('path');

const workingDir = 'review/baseline/working';
const finalDir = 'review/final';

if (!fs.existsSync(workingDir)) {
  console.error('❌ Working directory not found:', workingDir);
  process.exit(1);
}

if (!fs.existsSync(finalDir)) {
  console.error('❌ Final directory not found:', finalDir);
  process.exit(1);
}

const workingFiles = fs.readdirSync(workingDir).filter(f => f.endsWith('.png'));
const finalFiles = fs.readdirSync(finalDir).filter(f => f.endsWith('.png'));

// Also include ReactFlow files from the screenshots directory
const allScreenshotsDir = 'review/screenshots/all-visualizers';
const allScreenshotFiles = fs.readdirSync(allScreenshotsDir).filter(f => f.endsWith('.png'));
const reactflowFiles = allScreenshotFiles.filter(f => f.includes('reactflow'));

console.log('🎉 FINAL VISUALIZER COMPARISON');
console.log('==============================\n');
console.log(`📊 Comparing ${workingFiles.length} working files vs ${finalFiles.length} final files:`);

const commonFiles = workingFiles.filter(f => finalFiles.includes(f));

console.log(`\n📈 Size comparison for ${commonFiles.length} common files:`);

let totalWorkingSize = 0;
let totalFinalSize = 0;
let largerCount = 0;
let smallerCount = 0;
let sameCount = 0;

// Group by visualizer type
const sketchFiles = commonFiles.filter(f => f.includes('sketch'));
const mermaidFiles = commonFiles.filter(f => f.includes('mermaid'));
const reactflowFilesFromScreenshots = reactflowFiles;

console.log(`\n🎯 SKETCH INSPECTOR RESULTS:`);
sketchFiles.forEach(file => {
  const workingPath = path.join(workingDir, file);
  const finalPath = path.join(finalDir, file);
  
  const workingStats = fs.statSync(workingPath);
  const finalStats = fs.statSync(finalPath);
  
  const workingSize = workingStats.size;
  const finalSize = finalStats.size;
  const diff = finalSize - workingSize;
  const percentChange = workingSize > 0 ? (diff / workingSize * 100).toFixed(1) : 0;
  
  totalWorkingSize += workingSize;
  totalFinalSize += finalSize;
  
  if (diff > 0) {
    console.log(`   📈 ${file}: +${diff.toLocaleString()} bytes (+${percentChange}%)`);
    largerCount++;
  } else if (diff < 0) {
    console.log(`   📉 ${file}: ${diff.toLocaleString()} bytes (${percentChange}%)`);
    smallerCount++;
  } else {
    console.log(`   ➖ ${file}: no change`);
    sameCount++;
  }
});

const sketchTotalWorking = sketchFiles.reduce((sum, f) => sum + fs.statSync(path.join(workingDir, f)).size, 0);
const sketchTotalFinal = sketchFiles.reduce((sum, f) => sum + fs.statSync(path.join(finalDir, f)).size, 0);
const sketchPercentChange = ((sketchTotalFinal - sketchTotalWorking) / sketchTotalWorking * 100).toFixed(1);

console.log(`\n📈 SKETCH SUMMARY:`);
console.log(`   Working total: ${sketchTotalWorking.toLocaleString()} bytes`);
console.log(`   Final total:  ${sketchTotalFinal.toLocaleString()} bytes`);
console.log(`   Difference:   ${sketchTotalFinal - sketchTotalWorking > 0 ? '+' : ''}${(sketchTotalFinal - sketchTotalWorking).toLocaleString()} bytes (${sketchPercentChange}%)`);

console.log(`\n🎯 MERMAID INSPECTOR RESULTS:`);
mermaidFiles.forEach(file => {
  const workingPath = path.join(workingDir, file);
  const finalPath = path.join(finalDir, file);
  
  const workingStats = fs.statSync(workingPath);
  const finalStats = fs.statSync(finalPath);
  
  const workingSize = workingStats.size;
  const finalSize = finalStats.size;
  const diff = finalSize - workingSize;
  const percentChange = workingSize > 0 ? (diff / workingSize * 100).toFixed(1) : 0;
  
  if (diff > 0) {
    console.log(`   📈 ${file}: +${diff.toLocaleString()} bytes (+${percentChange}%)`);
  } else if (diff < 0) {
    console.log(`   📉 ${file}: ${diff.toLocaleString()} bytes (${percentChange}%)`);
  } else {
    console.log(`   ➖ ${file}: no change`);
  }
});

const mermaidTotalWorking = mermaidFiles.reduce((sum, f) => sum + fs.statSync(path.join(workingDir, f)).size, 0);
const mermaidTotalFinal = mermaidFiles.reduce((sum, f) => sum + fs.statSync(path.join(finalDir, f)).size, 0);
const mermaidPercentChange = ((mermaidTotalFinal - mermaidTotalWorking) / mermaidTotalWorking * 100).toFixed(1);

console.log(`\n📈 MERMAID SUMMARY:`);
console.log(`   Working total: ${mermaidTotalWorking.toLocaleString()} bytes`);
console.log(`   Final total:  ${mermaidTotalFinal.toLocaleString()} bytes`);
console.log(`   Difference:   ${mermaidTotalFinal - mermaidTotalWorking > 0 ? '+' : ''}${(mermaidTotalFinal - mermaidTotalWorking).toLocaleString()} bytes (${mermaidPercentChange}%)`);

console.log(`\n🎯 REACTFLOW INSPECTOR RESULTS:`);
reactflowFilesFromScreenshots.forEach(file => {
  const finalPath = path.join(allScreenshotsDir, file);
  const finalStats = fs.statSync(finalPath);
  const finalSize = finalStats.size;
  
  console.log(`   ✅ ${file}: ${finalSize.toLocaleString()} bytes (NEW visualizer!)`);
});

const reactflowTotalFinal = reactflowFilesFromScreenshots.reduce((sum, f) => sum + fs.statSync(path.join(allScreenshotsDir, f)).size, 0);

console.log(`\n📈 REACTFLOW SUMMARY:`);
console.log(`   Final total:  ${reactflowTotalFinal.toLocaleString()} bytes`);
console.log(`   Status:      ✅ NEW visualizer added!`);

const totalDiff = totalFinalSize - totalWorkingSize;
const totalPercentChange = totalWorkingSize > 0 ? (totalDiff / totalWorkingSize * 100).toFixed(1) : 0;

console.log(`\n🎉 OVERALL SUMMARY:`);
console.log(`   Working total: ${totalWorkingSize.toLocaleString()} bytes`);
console.log(`   Final total:  ${totalFinalSize.toLocaleString()} bytes`);
console.log(`   Difference:   ${totalDiff > 0 ? '+' : ''}${totalDiff.toLocaleString()} bytes (${totalPercentChange}%)`);
console.log(`   Status:      ${Math.abs(totalPercentChange) < 15 ? '✅ EXCELLENT - Within 15% of baseline' : '⚠️  Significant difference'}`);
