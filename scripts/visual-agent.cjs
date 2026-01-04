#!/usr/bin/env node

/**
 * Visual Coding Agent - Production Workflow
 * 
 * Optimized workflow for visual analysis of Matchina state machines
 * Uses local LLaVA model via Ollama for fast, private analysis
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const DOCS_BASE_URL = 'http://localhost:4321/matchina/examples/';
const SCREENSHOT_DIR = path.join(__dirname, '../review/screenshots');
const OLLAMA_MODEL = 'llava';

// Test cases with different visualizer modes
const TEST_CASES = [
  { 
    name: 'hsm-combobox-flattened', 
    url: `${DOCS_BASE_URL}hsm-combobox`,
    mode: 'flattened',
    visualizer: 'ReactFlow'
  },
  { 
    name: 'hsm-combobox-nested', 
    url: `${DOCS_BASE_URL}hsm-combobox`,
    mode: 'nested',
    visualizer: 'ReactFlow'
  },
  { 
    name: 'reactflow-subflow-test', 
    url: `${DOCS_BASE_URL}reactflow-subflow-test`,
    mode: 'default',
    visualizer: 'ReactFlow'
  }
];

// Ensure directory exists
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Execute Playwright command
async function runPlaywright(pageUrl, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`📸 Capturing: ${path.basename(outputPath)}`);
    
    const playwright = spawn('npx', [
      'playwright', 'screenshot', 
      '--wait-for-selector', '[data-testid="visualizer-picker"]',
      '--timeout', '10000',
      pageUrl, 
      outputPath
    ], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    playwright.stdout.on('data', (data) => {
      output += data.toString();
    });

    playwright.stderr.on('data', (data) => {
      const errorText = data.toString();
      if (!errorText.includes('WARN') && !errorText.includes('INFO')) {
        console.error('Playwright stderr:', errorText);
      }
    });

    playwright.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Screenshot saved`);
        resolve(outputPath);
      } else {
        console.error(`❌ Playwright failed (code ${code}): ${output}`);
        reject(new Error(`Playwright exited with code ${code}`));
      }
    });
  });
}

// Analyze with LLaVA
async function analyzeWithLLaVA(imagePath, analysisType = 'layout') {
  return new Promise((resolve, reject) => {
    console.log(`🤖 Analyzing with ${OLLAMA_MODEL}...`);
    
    const prompts = {
      layout: `Analyze this ReactFlow graph layout screenshot and provide structured feedback:

1. **Node Overlaps**: Are any nodes overlapping each other?
2. **Label Visibility**: Are all node and edge labels fully visible?
3. **Layout Quality**: Rate overall organization (Poor/Fair/Good/Excellent)
4. **Spacing**: Is there adequate spacing between elements?
5. **Edge Clarity**: Are edges and their labels clear?
6. **Issues**: List specific visual problems
7. **Recommendations**: Suggest concrete layout improvements

Respond in JSON format:
{
  "overlaps": boolean,
  "labelsVisible": boolean,
  "layoutQuality": "Poor|Fair|Good|Excellent",
  "spacing": "Poor|Fair|Good|Excellent", 
  "edgeClarity": "Poor|Fair|Good|Excellent",
  "issues": ["issue1", "issue2"],
  "recommendations": ["rec1", "rec2"]
}`,

      comparison: `Compare this ReactFlow layout with others. Analyze:

1. **Hierarchy Clarity**: How well are parent-child relationships shown?
2. **Layout Organization**: Which shows better organization?
3. **Visual Complexity**: Is the layout clean or cluttered?
4. **State Understanding**: Which makes the state machine clearer?
5. **Preferred Mode**: Nested, Flattened, or Tie?
6. **Reasoning**: Detailed explanation of preference

Respond in JSON format:
{
  "hierarchyClarity": "Nested|Flattened|Tie",
  "layoutOrganization": "Nested|Flattened|Tie",
  "visualComplexity": "Nested|Flattened|Tie", 
  "stateUnderstanding": "Nested|Flattened|Tie",
  "recommendation": "Nested|Flattened|Tie",
  "reasoning": "detailed explanation"
}`
    };

    const prompt = prompts[analysisType] || prompts.layout;
    
    const ollama = spawn('ollama', ['run', OLLAMA_MODEL, prompt], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Send image path to stdin
    ollama.stdin.write(`@${imagePath}\n`);
    ollama.stdin.end();

    let output = '';
    ollama.stdout.on('data', (data) => {
      output += data.toString();
    });

    ollama.stderr.on('data', (data) => {
      console.error('Ollama stderr:', data.toString());
    });

    ollama.on('close', (code) => {
      if (code === 0) {
        try {
          // Extract JSON from output
          const jsonMatch = output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            console.log('✅ Analysis complete');
            resolve(analysis);
          } else {
            console.log('📝 No JSON found, returning raw output');
            resolve({ rawOutput: output, jsonError: true });
          }
        } catch (parseError) {
          console.log('📝 JSON parse failed, returning raw output');
          resolve({ rawOutput: output, jsonError: true, parseError: parseError.message });
        }
      } else {
        console.error(`❌ Ollama failed (code ${code})`);
        reject(new Error(`Ollama analysis failed`));
      }
    });
  });
}

// Save analysis results
async function saveAnalysis(analysis, screenshotPath, testName) {
  const analysisPath = screenshotPath.replace('.png', '-analysis.json');
  const metadata = {
    testName,
    timestamp: new Date().toISOString(),
    model: OLLAMA_MODEL,
    screenshotPath: path.basename(screenshotPath),
    analysis
  };
  
  await fs.writeFile(analysisPath, JSON.stringify(metadata, null, 2));
  console.log(`💾 Analysis saved: ${path.basename(analysisPath)}`);
  return analysisPath;
}

// Generate summary report
async function generateSummary(allResults) {
  const summaryPath = path.join(SCREENSHOT_DIR, `summary-${new Date().toISOString().split('T')[0]}.json`);
  
  const summary = {
    timestamp: new Date().toISOString(),
    model: OLLAMA_MODEL,
    totalTests: allResults.length,
    successfulAnalyses: allResults.filter(r => !r.analysis?.jsonError).length,
    results: allResults.map(r => ({
      testName: r.testName,
      screenshot: path.basename(r.screenshotPath),
      hasAnalysis: !r.analysis?.jsonError,
      keyFindings: r.analysis?.overlaps ? 'Has overlaps' : 'No overlaps detected',
      layoutQuality: r.analysis?.layoutQuality || 'Unknown'
    }))
  };
  
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📊 Summary saved: ${path.basename(summaryPath)}`);
  return summary;
}

// Main workflow
async function runVisualAgent() {
  try {
    console.log('🚀 Visual Coding Agent - Starting Analysis...\n');
    
    await ensureDir(SCREENSHOT_DIR);
    
    const results = [];
    
    for (const testCase of TEST_CASES) {
      console.log(`\n📊 Testing: ${testCase.name}`);
      console.log(`URL: ${testCase.url}`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(SCREENSHOT_DIR, `${testCase.name}-${timestamp}.png`);
      
      try {
        // Capture screenshot
        await runPlaywright(testCase.url, screenshotPath);
        
        // Analyze with LLaVA
        const analysisType = testCase.name.includes('nested') ? 'comparison' : 'layout';
        const analysis = await analyzeWithLLaVA(screenshotPath, analysisType);
        
        // Save results
        await saveAnalysis(analysis, screenshotPath, testCase.name);
        
        results.push({
          testName: testCase.name,
          screenshotPath,
          analysis,
          success: true
        });
        
        console.log(`✅ Completed: ${testCase.name}\n`);
        
      } catch (error) {
        console.error(`❌ Failed: ${testCase.name} - ${error.message}`);
        results.push({
          testName: testCase.name,
          error: error.message,
          success: false
        });
      }
    }
    
    // Generate summary
    await generateSummary(results);
    
    console.log('\n🎉 Visual Agent Analysis Complete!');
    console.log(`📁 Results saved to: ${SCREENSHOT_DIR}`);
    console.log(`📊 Successful analyses: ${results.filter(r => r.success).length}/${results.length}`);
    
  } catch (error) {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runVisualAgent();
}

module.exports = { runVisualAgent, analyzeWithLLaVA, runPlaywright };
