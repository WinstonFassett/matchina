const fs = require('fs');
const path = require('path');

const baselineDir = 'review/baseline/working';
const currentDir = 'review/current';

if (!fs.existsSync(baselineDir)) {
  console.error('❌ Baseline directory not found:', baselineDir);
  process.exit(1);
}

if (!fs.existsSync(currentDir)) {
  console.error('❌ Current directory not found:', currentDir);
  process.exit(1);
}

const baselineFiles = fs.readdirSync(baselineDir).filter(f => f.endsWith('.png'));
const currentFiles = fs.readdirSync(currentDir).filter(f => f.endsWith('.png'));

console.log('🔍 SCREENSHOT COMPARISON REPORT');
console.log('=====================================\n');
console.log(`📊 Comparing ${baselineFiles.length} baseline files (working branch) vs ${currentFiles.length} current files:`);

const commonFiles = baselineFiles.filter(f => currentFiles.includes(f));
const baselineOnly = baselineFiles.filter(f => !currentFiles.includes(f));
const currentOnly = currentFiles.filter(f => !baselineFiles.includes(f));

if (baselineOnly.length > 0) {
  console.log(`\n❌ Missing in current: ${baselineOnly.length} files`);
  baselineOnly.forEach(f => console.log(`   - ${f}`));
}

if (currentOnly.length > 0) {
  console.log(`\n➕ New in current: ${currentOnly.length} files`);
  currentOnly.forEach(f => console.log(`   + ${f}`));
}

if (commonFiles.length === 0) {
  console.log('\n❌ No common files to compare!');
  process.exit(1);
}

console.log(`\n📈 Size comparison for ${commonFiles.length} common files:`);

let totalBaselineSize = 0;
let totalCurrentSize = 0;
let largerCount = 0;
let smallerCount = 0;
let sameCount = 0;

commonFiles.forEach(file => {
  const baselinePath = path.join(baselineDir, file);
  const currentPath = path.join(currentDir, file);
  
  const baselineStats = fs.statSync(baselinePath);
  const currentStats = fs.statSync(currentPath);
  
  const baselineSize = baselineStats.size;
  const currentSize = currentStats.size;
  const diff = currentSize - baselineSize;
  const percentChange = baselineSize > 0 ? (diff / baselineSize * 100).toFixed(1) : 0;
  
  totalBaselineSize += baselineSize;
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

const totalDiff = totalCurrentSize - totalBaselineSize;
const totalPercentChange = totalBaselineSize > 0 ? (totalDiff / totalBaselineSize * 100).toFixed(1) : 0;

console.log('\n📈 SUMMARY:');
console.log(`   Baseline: ${baselineFiles.length} files`);
console.log(`   Current:  ${currentFiles.length} files`);
console.log(`   Common:   ${commonFiles.length} files`);
console.log(`   ✅ All files present for comparison: ${commonFiles.length === baselineFiles.length && commonFiles.length === currentFiles.length ? 'YES' : 'NO'}`);

console.log(`\n💾 SIZE SUMMARY:`);
console.log(`   Baseline total: ${totalBaselineSize.toLocaleString()} bytes`);
console.log(`   Current total:  ${totalCurrentSize.toLocaleString()} bytes`);
console.log(`   Difference:     ${totalDiff > 0 ? '+' : ''}${totalDiff.toLocaleString()} bytes (${totalPercentChange}%)`);

console.log(`\n📊 FILE COUNT CHANGES:`);
console.log(`   Larger: ${largerCount} files`);
console.log(`   Smaller: ${smallerCount} files`);
console.log(`   Same: ${sameCount} files`);

console.log(`\n💡 To see visual differences:`);
console.log(`   Open baseline files in: ${baselineDir}`);
console.log(`   Open current files in: ${currentDir}`);
console.log(`   Or use a visual diff tool like: diff -u ${baselineDir} ${currentDir}`);

if (smallerCount > commonFiles.length * 0.5) {
  console.log(`\n🚨 WARNING: More than half the files are smaller - possible content loss!`);
}
