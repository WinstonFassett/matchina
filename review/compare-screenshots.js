#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const baselineDir = 'review/baseline/upstream';
const currentDir = 'review/current';

function getFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.png'));
}

function compareScreenshots() {
  const baselineFiles = getFiles(baselineDir);
  const currentFiles = getFiles(currentDir);
  
  console.log('\n🔍 SCREENSHOT COMPARISON REPORT');
  console.log('=====================================\n');
  
  // Check for missing files
  const missingInCurrent = baselineFiles.filter(f => !currentFiles.includes(f));
  const missingInBaseline = currentFiles.filter(f => !baselineFiles.includes(f));
  
  if (missingInCurrent.length > 0) {
    console.log('❌ Missing in current branch:');
    missingInCurrent.forEach(f => console.log(`   - ${f}`));
  }
  
  if (missingInBaseline.length > 0) {
    console.log('✨ New files in current branch:');
    missingInBaseline.forEach(f => console.log(`   + ${f}`));
  }
  
  // Compare existing files
  const commonFiles = baselineFiles.filter(f => currentFiles.includes(f));
  
  if (commonFiles.length > 0) {
    console.log(`\n📊 Comparing ${commonFiles.length} files:`);
    
    commonFiles.forEach(file => {
      const baselinePath = path.join(baselineDir, file);
      const currentPath = path.join(currentDir, file);
      
      const baselineStats = fs.statSync(baselinePath);
      const currentStats = fs.statSync(currentPath);
      
      const sizeDiff = currentStats.size - baselineStats.size;
      const percentDiff = ((sizeDiff / baselineStats.size) * 100).toFixed(1);
      
      if (Math.abs(sizeDiff) > 100) { // Only show significant differences
        const icon = sizeDiff > 0 ? '📈' : '📉';
        console.log(`   ${icon} ${file}: ${sizeDiff > 0 ? '+' : ''}${sizeDiff} bytes (${percentDiff}%)`);
      }
    });
  }
  
  // Summary
  console.log(`\n📈 SUMMARY:`);
  console.log(`   Baseline: ${baselineFiles.length} files`);
  console.log(`   Current:  ${currentFiles.length} files`);
  console.log(`   Common:   ${commonFiles.length} files`);
  
  if (missingInCurrent.length === 0 && missingInBaseline.length === 0) {
    console.log(`   ✅ All files present for comparison`);
  } else {
    console.log(`   ⚠️  Some files missing from comparison`);
  }
  
  // Visual diff suggestion
  console.log(`\n💡 To see visual differences:`);
  console.log(`   Open baseline files in: ${baselineDir}`);
  console.log(`   Open current files in: ${currentDir}`);
  console.log(`   Or use a visual diff tool like: diff -u ${baselineDir} ${currentDir}`);
}

compareScreenshots();
