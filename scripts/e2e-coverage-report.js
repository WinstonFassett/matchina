#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Find all example files
const examplesDir = 'docs/src/content/docs/examples';
const exampleFiles = fs.readdirSync(examplesDir)
  .filter(f => f.endsWith('.mdx'))
  .map(f => f.replace('.mdx', ''));

// Find all e2e test files and extract examples they test
const testDirs = ['test/e2e/functional', 'test/e2e/visual'];
const testedExamples = new Set();

testDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  
  const testFiles = fs.readdirSync(dir).filter(f => f.endsWith('.spec.ts'));
  
  testFiles.forEach(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Extract example URLs from goto calls
    const gotoMatches = content.match(/goto.*\/matchina\/examples\/([^'"]+)/g);
    if (gotoMatches) {
      gotoMatches.forEach(match => {
        const example = match.split('/').pop().replace(/['"]/g, '');
        testedExamples.add(example.replace(/\/$/, ''));
      });
    }
  });
});

// Generate coverage report
const coverage = {
  totalExamples: exampleFiles.length,
  testedExamples: testedExamples.size,
  coverage: Math.round((testedExamples.size / exampleFiles.length) * 100),
  missingExamples: exampleFiles.filter(ex => !testedExamples.has(ex)),
  testedExamplesList: Array.from(testedExamples).sort()
};

console.log('📊 E2E Example Coverage Report');
console.log('================================');
console.log(`Total Examples: ${coverage.totalExamples}`);
console.log(`Tested Examples: ${coverage.testedExamples}`);
console.log(`Coverage: ${coverage.coverage}%`);
console.log('');
console.log('✅ Tested Examples:');
coverage.testedExamplesList.forEach(ex => console.log(`  - ${ex}`));
console.log('');
console.log('❌ Missing Examples:');
coverage.missingExamples.forEach(ex => console.log(`  - ${ex}`));
console.log('');

// Save detailed report
fs.writeFileSync('review/E2E_COVERAGE_REPORT.md', `
# E2E Example Coverage Report

## Summary
- **Total Examples**: ${coverage.totalExamples}
- **Tested Examples**: ${coverage.testedExamples}  
- **Coverage**: ${coverage.coverage}%

## Tested Examples ✅
${coverage.testedExamplesList.map(ex => `- ${ex}`).join('\n')}

## Missing Examples ❌
${coverage.missingExamples.map(ex => `- ${ex}`).join('\n')}

## Coverage Gaps by Category

### Critical Examples (High Priority)
- \`checkout\` - Complex HSM with payment flow
- \`auth-flow\` - Authentication state machine
- \`stopwatch\` - Classic example with effects
- \`rock-paper-scissors\` - Game logic example

### Advanced Examples (Medium Priority)  
- \`hsm-checkout\` - Hierarchical checkout
- \`async-calculator\` - Async state management
- \`promise-machine-fetcher\` - Promise integration

### Simple Examples (Low Priority)
- \`color-scheme-explorer\` - UI theming
- \`fetcher-*\` - Data fetching examples
- \`stopwatch-*\` - Stopwatch variations

## Recommendations

### Immediate (Priority 1)
1. **Dark mode smoke test** - Every example in dark mode
2. **Default visualizer test** - Each example with auto-selected visualizer
3. **Critical examples** - Add basic tests for checkout, auth-flow, stopwatch

### Short Term (Priority 2)  
1. **State transition tests** - Click through states for critical examples
2. **Multi-visualizer tests** - Test each example with all available visualizers
3. **Advanced examples** - Add tests for complex HSM scenarios

### Long Term (Priority 3)
1. **Full matrix testing** - All examples × all visualizers × all themes
2. **Interaction testing** - User workflows in each example
3. **Performance testing** - Load times and rendering performance

## Test Strategy Matrix

| Level | Scope | Examples | Visualizers | Themes | Frequency |
|-------|--------|----------|------------|--------|----------|
| **Smoke** | Load + Dark Mode | All 22 | Auto | Both | Every PR |
| **Basic** | State Transitions | Critical 6 | Auto | Light | Weekly |
| **Full** | All Visualizers | Critical 6 | All 4 | Both | Release |
| **Deep** | All Interactions | All 22 | All 4 | Both | Major Release |

## Automation

Generate this report with:
\`\`\`bash
node scripts/e2e-coverage-report.js
\`\`\`

Current coverage: **${coverage.coverage}%** - Target: **100%**
`);

console.log(`📄 Detailed report saved to: review/E2E_COVERAGE_REPORT.md`);
console.log(`🎯 Current coverage: ${coverage.coverage}% - Target: 100%`);
