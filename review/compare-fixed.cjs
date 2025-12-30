const fs = require('fs');
const path = require('path');

const workingDir = 'review/baseline/working';
const currentDir = 'review/current-fixed';

if (!fs.existsSync(workingDir)) {
  console.error('❌ Working directory not found:', workingDir);
  process.exit(1);
}

if (!fs.existsSync(currentDir)) {
  console.error('❌ Current directory not found:', currentDir);
  process.exit(1);
}

const workingFiles = fs.readdirSync(workingDir).filter(f => f.endsWith('.png'));
const currentFiles = fs.readdirSync(currentDir).filter(f => f.endsWith('.png'));

console.log('🔍 SKETCHINSPECTOR FLAT MODE FIX COMPARISON');
console.log('==========================================\n');
console.log(`📊 Comparing ${workingFiles.length} working files vs ${currentFiles.length} current files:`);

const commonFiles = workingFiles.filter(f => currentFiles.includes(f));

console.log(`\n📈 Size comparison for ${commonFiles.length} common files:`);

let totalWorkingSize = 0;
let totalCurrentSize = 0;
let largerCount = 0;
let smallerCount = 0;
let sameCount = 0;

// Focus on sketch flat files
const sketchFlatFiles = commonFiles.filter(f => f.includes('sketch') && f.includes('flat'));

console.log(`\n🎯 SKETCH FLAT MODE RESULTS:`);
sketchFlatFiles.forEach(file => {
  const workingPath = path.join(workingDir, file);
  const currentPath = path.join(currentDir, file);
  
  const workingStats = fs.statSync(workingPath);
  const currentStats = fs.statSync(currentPath);
  
  const workingSize = workingStats.size;
  const currentSize = currentStats.size;
  const diff = currentSize - workingSize;
  const percentChange = workingSize > 0 ? (diff / workingSize * 100).toFixed(1) : 0;
  
  totalWorkingSize += workingSize;
  totalCurrentSize += currentSize;
  
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

const totalDiff = totalCurrentSize - totalWorkingSize;
const totalPercentChange = totalWorkingSize > 0 ? (totalDiff / totalWorkingSize * 100).toFixed(1) : 0;

console.log(`\n📈 SKETCH FLAT SUMMARY:`);
console.log(`   Working total: ${totalWorkingSize.toLocaleString()} bytes`);
console.log(`   Current total:  ${totalCurrentSize.toLocaleString()} bytes`);
console.log(`   Difference:    ${totalDiff > 0 ? '+' : ''}${totalDiff.toLocaleString()} bytes (${totalPercentChange}%)`);

if (Math.abs(totalPercentChange) < 10) {
  console.log(`\n✅ SUCCESS: Sketch flat mode file sizes are now within 10% of working baseline!`);
} else if (totalPercentChange > 0) {
  console.log(`\n🎯 IMPROVEMENT: Sketch flat mode files are now ${totalPercentChange}% larger (better!)`);
} else {
  console.log(`\n⚠️  STILL SMALLER: Sketch flat mode files are still ${Math.abs(totalPercentChange)}% smaller`);
}
