#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Manually list what we know is tested
const actuallyTested = [
  'hsm-combobox', // visual + functional tests
  'traffic-light', // functional + ReactFlow tests
  'counter', // ReactFlow + smoke tests
  'toggle', // ReactFlow + smoke tests
  'checkout' // smoke tests
];

console.log('Actually tested examples:');
actuallyTested.forEach(ex => console.log(`  ✅ ${ex}`));
console.log(`Total: ${actuallyTested.length} examples`);

// Check if these are in the examples directory
const examplesDir = 'docs/src/content/docs/examples';
const examples = fs.readdirSync(examplesDir)
  .filter(f => f.endsWith('.mdx'))
  .map(f => f.replace('.mdx', ''));

console.log('\nMissing examples:');
examples.forEach(ex => {
  if (!actuallyTested.includes(ex)) {
    console.log(`  ❌ ${ex}`);
  }
});

console.log(`\nCoverage: ${actuallyTested.length}/${examples.length} = ${Math.round((actuallyTested.length / examples.length) * 100)}%`);
