#!/usr/bin/env node

/**
 * Context-Optimized Visual Analysis Agent
 * 
 * Optimized for minimal context usage:
 * - Suppress verbose stderr output
 * - Streamlined logging
 * - Concise JSON output
 * - Efficient data structures
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const DOCS_BASE_URL = 'http://localhost:4321/matchina/examples/';
const SCREENSHOT_DIR = path.join(__dirname, '../review/screenshots');
const OLLAMA_MODEL = 'llava';

// Streamlined test cases
const OPTIMIZED_TESTS = [
  { 
    name: 'hsm-combobox-flat', 
    url: `${DOCS_BASE_URL}hsm-combobox`,
    focus: 'edge-layout-contrast'
  },
  { 
    name: 'hsm-combobox-nested', 
    url: `${DOCS_BASE_URL}hsm-combobox`,
    focus: 'containment-hierarchy'
  }
];

// Minimal timing tracking
class MinimalTiming {
  constructor() {
    this.starts = new Map();
    this.results = [];
  }

  start(op) {
    this.starts.set(op, process.hrtime.bigint());
  }

  end(op) {
    const start = this.starts.get(op);
    if (!start) return null;
    const duration = Number(process.hrtime.bigint() - start) / 1000000;
    this.results.push({ op, duration });
    return duration;
  }

  getSummary() {
    const total = this.results.reduce((sum, r) => sum + r.duration, 0);
    return { total, count: this.results.length, avg: total / this.results.length };
  }
}

// Silent Playwright execution
async function silentScreenshot(url, outputPath) {
  return new Promise((resolve, reject) => {
    const playwright = spawn('npx', [
      'playwright', 'screenshot', 
      '--wait-for-selector', '[data-testid="visualizer-picker"]',
      '--timeout', '10000',
      url, outputPath
    ], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'] // Keep stderr for error detection
    });

    let stderr = '';
    playwright.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    playwright.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`Playwright failed: ${stderr.slice(0, 200)}`)); // Truncate error
      }
    });
  });
}

// Streamlined LLaVA analysis with minimal prompt
async function minimalAnalysis(imagePath, focusType) {
  return new Promise((resolve, reject) => {
    const prompts = {
      'edge-layout-contrast': `Analyze ReactFlow diagram for critical issues:
1. Edge connections/routing (Poor/Fair/Good/Excellent)
2. Node overlaps (boolean)
3. Text contrast (Poor/Fair/Good/Excellent)
4. Layout spacing (Poor/Fair/Good/Excellent)

JSON: {"edgeQuality":"Poor|Fair|Good|Excellent","overlaps":boolean,"contrast":"Poor|Fair|Good|Excellent","spacing":"Poor|Fair|Good|Excellent","criticalIssues":["issue1","issue2"]}`,

      'containment-hierarchy': `Analyze ReactFlow hierarchy for critical issues:
1. Parent-child containment (Poor/Fair/Good/Excellent)
2. Node overlaps (boolean)
3. Visual hierarchy (Poor/Fair/Good/Excellent)
4. Element clipping (boolean)

JSON: {"containment":"Poor|Fair|Good|Excellent","overlaps":boolean,"hierarchy":"Poor|Fair|Good|Excellent","clipping":boolean,"criticalIssues":["issue1","issue2"]}`
    };

    const prompt = prompts[focusType] || prompts['edge-layout-contrast'];
    
    const ollama = spawn('ollama', ['run', OLLAMA_MODEL, prompt], {
      stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr completely
    });

    ollama.stdin.write(`@${imagePath}\n`);
    ollama.stdin.end();

    let output = '';
    ollama.stdout.on('data', (data) => {
      output += data.toString();
    });

    ollama.on('close', (code) => {
      if (code === 0) {
        try {
          const jsonMatch = output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            resolve(JSON.parse(jsonMatch[0]));
          } else {
            resolve({ rawOutput: output.slice(0, 500) }); // Truncate raw output
          }
        } catch {
          resolve({ parseError: true, rawOutput: output.slice(0, 500) });
        }
      } else {
        reject(new Error('Analysis failed'));
      }
    });
  });
}

// Compact result saving
async function saveCompactResult(result, testName) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${testName}-${timestamp}.json`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  
  await fs.writeFile(filepath, JSON.stringify({
    test: testName,
    timestamp,
    model: OLLAMA_MODEL,
    ...result
  }));
  
  return filepath;
}

// Main optimized workflow
async function runOptimizedAnalysis() {
  const timing = new MinimalTiming();
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  
  console.log('🔍 Starting context-optimized visual analysis...');
  
  const results = [];
  
  for (const test of OPTIMIZED_TESTS) {
    try {
      timing.start('screenshot');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(SCREENSHOT_DIR, `${test.name}-${timestamp}.png`);
      
      await silentScreenshot(test.url, screenshotPath);
      timing.end('screenshot');
      
      timing.start('analysis');
      const analysis = await minimalAnalysis(screenshotPath, test.focus);
      timing.end('analysis');
      
      const result = {
        testName: test.name,
        focus: test.focus,
        screenshot: path.basename(screenshotPath),
        timing: timing.getSummary(),
        analysis
      };
      
      await saveCompactResult(result, test.name);
      results.push(result);
      
      console.log(`✅ ${test.name}: ${analysis.overlaps ? 'OVERLAPS' : 'Clean'} | ${analysis.contrast || analysis.edgeQuality} contrast`);
      
    } catch (error) {
      console.error(`❌ ${test.name}: ${error.message}`);
      results.push({ testName: test.name, error: error.message });
    }
  }
  
  // Generate minimal summary
  const summary = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    successful: results.filter(r => !r.error).length,
    criticalIssues: results.filter(r => r.analysis?.criticalIssues?.length > 0).length,
    timing: timing.getSummary(),
    recommendations: results.flatMap(r => r.analysis?.criticalIssues || []).slice(0, 5)
  };
  
  const summaryPath = path.join(SCREENSHOT_DIR, `summary-${new Date().toISOString().split('T')[0]}.json`);
  await fs.writeFile(summaryPath, JSON.stringify(summary));
  
  console.log(`\n📊 Summary: ${summary.successful}/${summary.totalTests} successful`);
  console.log(`🚨 Critical issues: ${summary.criticalIssues}`);
  console.log(`⏱️  Total time: ${(summary.timing.total / 1000).toFixed(1)}s`);
  console.log(`💾 Results: ${SCREENSHOT_DIR}`);
  
  return summary;
}

// Run if called directly
if (require.main === module) {
  runOptimizedAnalysis();
}

module.exports = { runOptimizedAnalysis, minimalAnalysis };
