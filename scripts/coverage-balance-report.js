#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Coverage balance assessment tool
 */

// Get all examples
const examplesDir = 'docs/src/content/docs/examples';
const examples = fs.readdirSync(examplesDir)
  .filter(f => f.endsWith('.mdx'))
  .map(f => f.replace('.mdx', ''));

// Get all E2E tests
const testDirs = ['test/e2e/functional', 'test/e2e/visual'];
const testFiles = [];

testDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.spec.ts'));
  files.forEach(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Extract example URLs from goto calls
    const gotoMatches = content.match(/goto.*\/matchina\/examples\/([^'"]+)/g);
    if (gotoMatches) {
      gotoMatches.forEach(match => {
        const example = match.split('/').pop().replace(/['"]/g, '');
        testFiles.push({
          file: path.join(dir, file),
          example: example.replace(/\/$/, ''),
          category: dir.split('/').pop(),
          content: content
        });
      });
    }
  });
});

// Analyze coverage
function analyzeCoverage() {
  const coverage = {
    totalExamples: examples.length,
    testedExamples: new Set(testFiles.map(t => t.example)).size,
    coverage: Math.round((new Set(testFiles.map(t => t.example)).size / examples.length) * 100),
    examples,
    tests: testFiles
  };
  
  // Coverage by example
  const exampleCoverage = {};
  examples.forEach(example => {
    const tests = testFiles.filter(t => t.example === example);
    exampleCoverage[example] = {
      tested: tests.length > 0,
      testCount: tests.length,
      categories: [...new Set(tests.map(t => t.category))]
    };
  });
  
  // Coverage by visualizer
  const visualizerCoverage = {};
  testFiles.forEach(test => {
    const vizMatches = test.content.match(/selectOption\(['"]([^'"]+)['"]/g);
    if (vizMatches) {
      vizMatches.forEach(match => {
        const viz = match.match(/['"]([^'"]+)['"]/)[1];
        visualizerCoverage[viz] = (visualizerCoverage[viz] || 0) + 1;
      });
    }
  });
  
  // Coverage by category
  const categoryCoverage = {};
  testFiles.forEach(test => {
    categoryCoverage[test.category] = (categoryCoverage[test.category] || 0) + 1;
  });
  
  return { coverage, exampleCoverage, visualizerCoverage, categoryCoverage };
}

function generateBalanceReport() {
  const { coverage, exampleCoverage, visualizerCoverage, categoryCoverage } = analyzeCoverage();
  
  console.log('🎯 E2E Coverage Balance Report');
  console.log('============================');
  console.log(`Total Examples: ${coverage.totalExamples}`);
  console.log(`Tested Examples: ${coverage.testedExamples}`);
  console.log(`Coverage: ${coverage.coverage}%`);
  console.log('');
  
  // Missing examples
  const missing = examples.filter(ex => !exampleCoverage[ex].tested);
  if (missing.length > 0) {
    console.log('❌ Missing Examples:');
    missing.forEach(ex => console.log(`  - ${ex}`));
    console.log('');
  }
  
  // Tested examples with details
  const tested = examples.filter(ex => exampleCoverage[ex].tested);
  if (tested.length > 0) {
    console.log('✅ Tested Examples:');
    tested.forEach(ex => {
      const details = exampleCoverage[ex];
      console.log(`  - ${ex} (${details.testCount} tests, ${details.categories.join(', ')})`);
    });
    console.log('');
  }
  
  // Visualizer balance
  console.log('🎨 Visualizer Coverage:');
  Object.entries(visualizerCoverage).sort((a, b) => b[1] - a[1]).forEach(([viz, count]) => {
    console.log(`  ${viz}: ${count} tests`);
  });
  console.log('');
  
  // Category balance
  console.log('📁 Category Coverage:');
  Object.entries(categoryCoverage).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} tests`);
  });
  console.log('');
  
  // Balance assessment
  console.log('📊 Balance Assessment:');
  
  // Visualizer balance score
  const vizScores = Object.values(visualizerCoverage);
  const maxVizScore = Math.max(...vizScores);
  const minVizScore = Math.min(...vizScores);
  const vizBalance = maxVizScore > 0 ? (minVizScore / maxVizScore) * 100 : 100;
  console.log(`  Visualizer Balance: ${vizBalance.toFixed(1)}% (${minVizScore}-${maxVizScore} range)`);
  
  // Category balance score
  const catScores = Object.values(categoryCoverage);
  const maxCatScore = Math.max(...catScores);
  const minCatScore = Math.min(...catScores);
  const catBalance = maxCatScore > 0 ? (minCatScore / maxCatScore) * 100 : 100;
  console.log(`  Category Balance: ${catBalance.toFixed(1)}% (${minCatScore}-${maxCatScore} range)`);
  
  // Overall balance score
  const allScores = [...vizScores, ...catScores];
  const maxScore = Math.max(...allScores);
  const minScore = Math.min(...allScores);
  const overallBalance = maxScore > 0 ? (minScore / maxScore) * 100 : 100;
  console.log(`  Overall Balance: ${overallBalance.toFixed(1)}% (${minScore}-${maxScore} range)`);
  
  // Recommendations
  console.log('');
  console.log('🎯 Recommendations:');
  
  if (coverage.coverage < 50) {
    console.log('  🚨 LOW COVERAGE - Add smoke tests for missing examples');
  } else if (coverage.coverage < 80) {
    console.log('  ⚠️ MODERATE COVERAGE - Expand smoke tests');
  } else {
    console.log('  ✅ GOOD COVERAGE - Focus on quality');
  }
  
  if (vizBalance < 50) {
    console.log('  🚨 UNBALANCED VISUALIZERS - Add tests for underused visualizers');
  } else if (vizBalance < 70) {
    console.log('  ⚠️ MODERATE BALANCE - Consider visualizer diversity');
  } else {
    console.log('  ✅ GOOD VISUALIZER BALANCE');
  }
  
  if (catBalance < 50) {
    console.log('  🚨 UNBALANCED CATEGORIES - Balance functional vs visual tests');
  } else if (catBalance < 70) {
    console.log('  ⚠️ MODERATE BALANCE - Consider test type diversity');
  } else {
    console.log('  ✅ GOOD CATEGORY BALANCE');
  }
  
  return { coverage, exampleCoverage, visualizerCoverage, categoryCoverage };
}

// CLI interface
const args = process.argv.slice(2);

if (args.length === 0) {
  generateBalanceReport();
} else if (args[0] === 'json') {
  const report = generateBalanceReport();
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Usage:');
  console.log('  node scripts/coverage-balance-report.js          # Show balance report');
  console.log('  node scripts/coverage-balance-report.js json      # Export as JSON');
}
