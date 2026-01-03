#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

/**
 * Generate HTML report without starting server
 */

function generateHTMLReport() {
  console.log('🔍 Generating Playwright HTML report...');
  
  // Run Playwright with HTML reporter but don't start server
  const testProcess = exec('npx playwright test --reporter=html', {
    cwd: process.cwd(),
    stdio: 'pipe'
  });
  
  let output = '';
  testProcess.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  testProcess.stderr.on('data', (data) => {
    output += data.toString();
  });
  
  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ HTML report generated successfully');
      console.log('📁 Report location: playwright-report/index.html');
      console.log('');
      console.log('🔍 To view the report:');
      console.log('  open playwright-report/index.html');
      console.log('');
      console.log('📊 Report summary:');
      const lines = output.split('\n');
      const summaryLines = lines.filter(line => line.includes('✓') || line.includes('✗') || line.includes('passed') || line.includes('failed'));
      summaryLines.forEach(line => console.log(line));
    } else {
      console.error('❌ HTML report generation failed');
      console.error('Exit code:', code);
      if (output) {
        console.error('Output:', output);
      }
    }
  });
}

// Run the report generation
generateHTMLReport();
