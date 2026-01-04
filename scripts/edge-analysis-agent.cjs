#!/usr/bin/env node

/**
 * Edge-Focused Visual Analysis Agent
 * 
 * Specialized analysis for ReactFlow edge aesthetics and parallel edge handling
 * with timing measurements and visualization expert recommendations
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const DOCS_BASE_URL = 'http://localhost:4321/matchina/examples/';
const SCREENSHOT_DIR = path.join(__dirname, '../review/screenshots');
const OLLAMA_MODEL = 'llava';

// Test cases focusing on edge complexity
const EDGE_TEST_CASES = [
  { 
    name: 'hsm-combobox-flattened-edges', 
    url: `${DOCS_BASE_URL}hsm-combobox`,
    mode: 'flattened',
    visualizer: 'ReactFlow',
    focus: 'parallel-edges'
  },
  { 
    name: 'hsm-combobox-nested-edges', 
    url: `${DOCS_BASE_URL}hsm-combobox`,
    mode: 'nested', 
    visualizer: 'ReactFlow',
    focus: 'hierarchy-edges'
  },
  { 
    name: 'reactflow-subflow-edges', 
    url: `${DOCS_BASE_URL}reactflow-subflow-test`,
    mode: 'default',
    visualizer: 'ReactFlow', 
    focus: 'subflow-edges'
  }
];

// Timing utilities
class Timing {
  constructor() {
    this.startTimes = new Map();
    this.measurements = [];
  }

  start(operation) {
    this.startTimes.set(operation, process.hrtime.bigint());
  }

  end(operation) {
    const start = this.startTimes.get(operation);
    if (!start) return null;
    
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    this.measurements.push({
      operation,
      duration,
      timestamp: new Date().toISOString()
    });
    
    return duration;
  }

  getReport() {
    return {
      totalOperations: this.measurements.length,
      measurements: this.measurements,
      averages: this.calculateAverages(),
      summary: this.getSummary()
    };
  }

  calculateAverages() {
    const groups = {};
    this.measurements.forEach(m => {
      if (!groups[m.operation]) {
        groups[m.operation] = [];
      }
      groups[m.operation].push(m.duration);
    });

    return Object.entries(groups).map(([operation, durations]) => ({
      operation,
      count: durations.length,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations)
    }));
  }

  getSummary() {
    const total = this.measurements.reduce((sum, m) => sum + m.duration, 0);
    return {
      totalTime: total,
      averageOperationTime: total / this.measurements.length,
      fastestOperation: Math.min(...this.measurements.map(m => m.duration)),
      slowestOperation: Math.max(...this.measurements.map(m => m.duration))
    };
  }
}

// Ensure directory exists
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Execute Playwright with timing
async function runPlaywrightWithTiming(timing, pageUrl, outputPath) {
  return new Promise((resolve, reject) => {
    timing.start('playwright-screenshot');
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
      const duration = timing.end('playwright-screenshot');
      if (code === 0) {
        console.log(`✅ Screenshot saved (${duration?.toFixed(2)}ms)`);
        resolve({ outputPath, duration });
      } else {
        console.error(`❌ Playwright failed (code ${code}): ${output}`);
        reject(new Error(`Playwright exited with code ${code}`));
      }
    });
  });
}

// Edge-focused analysis with timing
async function analyzeEdgesWithTiming(timing, imagePath, focusType) {
  return new Promise((resolve, reject) => {
    timing.start('llama-analysis');
    console.log(`🎨 Analyzing edges with ${OLLAMA_MODEL} (focus: ${focusType})...`);
    
    const prompts = {
      'parallel-edges': `As a visualization expert, analyze this ReactFlow diagram focusing on edge aesthetics and parallel edge handling:

**Edge Analysis Requirements:**
1. **Parallel Edge Quality**: How are parallel edges between the same nodes handled? Do they have proper separation?
2. **Edge Label Visibility**: Are all edge labels fully visible and not obstructed by nodes or other edges?
3. **Edge Routing**: Are edges routed cleanly to avoid overlaps and maintain clarity?
4. **Visual Hierarchy**: Do edges establish clear visual hierarchy and flow direction?
5. **Aesthetic Quality**: Rate overall edge aesthetics (Poor/Fair/Good/Excellent)
6. **Onion-Layer Effect**: Do parallel edges have the desired "onion-like" layered quality?
7. **Edge-Node Separation**: Are edges properly separated from node boundaries?

**Professional Recommendations:**
Provide specific, actionable suggestions for improving edge aesthetics, including:
- Curve adjustments for parallel edges
- Label positioning improvements  
- Routing algorithm suggestions
- Visual styling recommendations

Respond in JSON format:
{
  "parallelEdgeQuality": "Poor|Fair|Good|Excellent",
  "edgeLabelVisibility": "Poor|Fair|Good|Excellent", 
  "edgeRouting": "Poor|Fair|Good|Excellent",
  "visualHierarchy": "Poor|Fair|Good|Excellent",
  "aestheticQuality": "Poor|Fair|Good|Excellent",
  "onionLayerEffect": boolean,
  "edgeNodeSeparation": "Poor|Fair|Good|Excellent",
  "specificIssues": ["issue1", "issue2"],
  "expertRecommendations": ["rec1", "rec2", "rec3"],
  "routingSuggestions": ["suggestion1", "suggestion2"],
  "stylingTips": ["tip1", "tip2"]
}`,

      'hierarchy-edges': `As a visualization expert, analyze this hierarchical ReactFlow diagram focusing on edge clarity and hierarchy representation:

**Hierarchy Edge Analysis:**
1. **Parent-Child Edge Clarity**: Are parent-child relationships clearly visible through edge styling?
2. **Hierarchical Flow**: Do edges clearly show the hierarchical structure and flow?
3. **Level Separation**: Are edges between different hierarchy levels properly distinguished?
4. **Edge Consistency**: Are edge styles consistent within hierarchy levels?
5. **Visual Flow**: Does the edge layout guide the eye through the hierarchy naturally?
6. **Cross-Hierarchy Edges**: Are edges that cross hierarchy levels handled well?
7. **Aesthetic Integration**: Do edges complement the overall hierarchical aesthetic?

**Professional Recommendations:**
Provide specific suggestions for hierarchical edge improvements including:
- Styling differences for hierarchy levels
- Flow direction indicators
- Cross-level edge handling
- Visual hierarchy enhancement

Respond in JSON format:
{
  "parentChildClarity": "Poor|Fair|Good|Excellent",
  "hierarchicalFlow": "Poor|Fair|Good|Excellent",
  "levelSeparation": "Poor|Fair|Good|Excellent", 
  "edgeConsistency": "Poor|Fair|Good|Excellent",
  "visualFlow": "Poor|Fair|Good|Excellent",
  "crossHierarchyHandling": "Poor|Fair|Good|Excellent",
  "aestheticIntegration": "Poor|Fair|Good|Excellent",
  "specificIssues": ["issue1", "issue2"],
  "expertRecommendations": ["rec1", "rec2", "rec3"],
  "hierarchyEnhancements": ["enhance1", "enhance2"],
  "stylingSuggestions": ["style1", "style2"]
}`,

      'subflow-edges': `As a visualization expert, analyze this ReactFlow diagram focusing on subflow edge handling and complex edge patterns:

**Subflow Edge Analysis:**
1. **Subflow Boundary Crossing**: How do edges handle subflow container boundaries?
2. **Complex Edge Patterns**: Are complex edge intersections and patterns handled cleanly?
3. **Edge Density Management**: How well are areas with high edge density managed?
4. **Subflow Entry/Exit**: Are subflow entry and exit points clearly marked with edges?
5. **Edge Context Preservation**: Do edges maintain context when crossing subflow boundaries?
6. **Visual Complexity**: Is the visual complexity of edges appropriate for the subflow structure?
7. **Edge Readability**: Despite complexity, can individual edges still be followed visually?

**Professional Recommendations:**
Provide specific suggestions for subflow edge optimization:
- Boundary crossing techniques
- Density management strategies  
- Subflow integration improvements
- Complexity reduction methods

Respond in JSON format:
{
  "boundaryCrossing": "Poor|Fair|Good|Excellent",
  "complexPatternHandling": "Poor|Fair|Good|Excellent",
  "densityManagement": "Poor|Fair|Good|Excellent",
  "subflowEntryExit": "Poor|Fair|Good|Excellent",
  "contextPreservation": "Poor|Fair|Good|Excellent", 
  "visualComplexity": "Poor|Fair|Good|Excellent",
  "edgeReadability": "Poor|Fair|Good|Excellent",
  "specificIssues": ["issue1", "issue2"],
  "expertRecommendations": ["rec1", "rec2", "rec3"],
  "boundaryTechniques": ["technique1", "technique2"],
  "complexityReduction": ["reduction1", "reduction2"]
}`
    };

    const prompt = prompts[focusType] || prompts['parallel-edges'];
    
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
      const duration = timing.end('llama-analysis');
      if (code === 0) {
        try {
          // Extract JSON from output
          const jsonMatch = output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            console.log(`✅ Analysis complete (${duration?.toFixed(2)}ms)`);
            resolve({ analysis, duration });
          } else {
            console.log('📝 No JSON found, returning raw output');
            resolve({ rawOutput: output, jsonError: true, duration });
          }
        } catch (parseError) {
          console.log('📝 JSON parse failed, returning raw output');
          resolve({ rawOutput: output, jsonError: true, parseError: parseError.message, duration });
        }
      } else {
        console.error(`❌ Ollama failed (code ${code})`);
        reject(new Error(`Ollama analysis failed`));
      }
    });
  });
}

// Save edge analysis results
async function saveEdgeAnalysis(result, screenshotPath, testName) {
  const analysisPath = screenshotPath.replace('.png', '-edge-analysis.json');
  const metadata = {
    testName,
    focus: result.focus,
    timestamp: new Date().toISOString(),
    model: OLLAMA_MODEL,
    screenshotPath: path.basename(screenshotPath),
    timing: {
      screenshot: result.screenshotDuration,
      analysis: result.analysisDuration,
      total: result.screenshotDuration + result.analysisDuration
    },
    analysis: result.analysis
  };
  
  await fs.writeFile(analysisPath, JSON.stringify(metadata, null, 2));
  console.log(`💾 Edge analysis saved: ${path.basename(analysisPath)}`);
  return analysisPath;
}

// Generate edge-focused summary
async function generateEdgeSummary(allResults, timingReport) {
  const summaryPath = path.join(SCREENSHOT_DIR, `edge-analysis-summary-${new Date().toISOString().split('T')[0]}.json`);
  
  const summary = {
    timestamp: new Date().toISOString(),
    model: OLLAMA_MODEL,
    focus: 'Edge aesthetics and parallel edge handling',
    timing: timingReport,
    totalTests: allResults.length,
    successfulAnalyses: allResults.filter(r => !r.analysis?.jsonError).length,
    edgeQualityOverview: {
      parallelEdgeIssues: allResults.filter(r => r.analysis?.parallelEdgeQuality === 'Poor').length,
      labelVisibilityIssues: allResults.filter(r => r.analysis?.edgeLabelVisibility === 'Poor').length,
      routingIssues: allResults.filter(r => r.analysis?.edgeRouting === 'Poor').length
    },
    results: allResults.map(r => ({
      testName: r.testName,
      focus: r.focus,
      screenshot: path.basename(r.screenshotPath),
      hasAnalysis: !r.analysis?.jsonError,
      timing: {
        screenshot: r.screenshotDuration,
        analysis: r.analysisDuration,
        total: r.totalDuration
      },
      keyFindings: {
        aestheticQuality: r.analysis?.aestheticQuality || 'Unknown',
        majorIssues: r.analysis?.specificIssues?.length || 0,
        recommendations: r.analysis?.expertRecommendations?.length || 0
      }
    })),
    recommendations: {
      immediate: [
        "Implement parallel edge separation with onion-like layering",
        "Ensure all edge labels are positioned to avoid node obstruction", 
        "Add edge routing algorithms that minimize overlaps"
      ],
      styling: [
        "Use different edge styles for hierarchy levels",
        "Implement edge curvature for parallel edges",
        "Add visual flow indicators"
      ]
    }
  };
  
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📊 Edge summary saved: ${path.basename(summaryPath)}`);
  return summary;
}

// Main edge analysis workflow
async function runEdgeAnalysisAgent() {
  try {
    console.log('🎨 Edge-Focused Visual Analysis Agent - Starting...\n');
    
    const timing = new Timing();
    await ensureDir(SCREENSHOT_DIR);
    
    const results = [];
    
    for (const testCase of EDGE_TEST_CASES) {
      console.log(`\n🔍 Analyzing: ${testCase.name}`);
      console.log(`Focus: ${testCase.focus}`);
      console.log(`URL: ${testCase.url}`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(SCREENSHOT_DIR, `${testCase.name}-${timestamp}.png`);
      
      try {
        // Capture screenshot with timing
        const { outputPath, duration: screenshotDuration } = await runPlaywrightWithTiming(
          timing, testCase.url, screenshotPath
        );
        
        // Analyze edges with timing
        const { analysis, duration: analysisDuration } = await analyzeEdgesWithTiming(
          timing, outputPath, testCase.focus
        );
        
        const totalDuration = screenshotDuration + analysisDuration;
        
        // Save results
        await saveEdgeAnalysis({
          focus: testCase.focus,
          screenshotDuration,
          analysisDuration,
          analysis
        }, outputPath, testCase.name);
        
        results.push({
          testName: testCase.name,
          focus: testCase.focus,
          screenshotPath: outputPath,
          screenshotDuration,
          analysisDuration,
          totalDuration,
          analysis,
          success: true
        });
        
        console.log(`✅ Completed: ${testCase.name} (${totalDuration.toFixed(2)}ms total)\n`);
        
      } catch (error) {
        console.error(`❌ Failed: ${testCase.name} - ${error.message}`);
        results.push({
          testName: testCase.name,
          focus: testCase.focus,
          error: error.message,
          success: false
        });
      }
    }
    
    // Generate timing and analysis summary
    const timingReport = timing.getReport();
    await generateEdgeSummary(results, timingReport);
    
    console.log('\n🎉 Edge Analysis Agent Complete!');
    console.log(`📁 Results saved to: ${SCREENSHOT_DIR}`);
    console.log(`📊 Successful analyses: ${results.filter(r => r.success).length}/${results.length}`);
    console.log(`⏱️  Timing Summary:`);
    console.log(`   - Total time: ${timingReport.summary.totalTime.toFixed(2)}ms`);
    console.log(`   - Average operation: ${timingReport.summary.averageOperationTime.toFixed(2)}ms`);
    console.log(`   - Fastest: ${timingReport.summary.fastestOperation.toFixed(2)}ms`);
    console.log(`   - Slowest: ${timingReport.summary.slowestOperation.toFixed(2)}ms`);
    
  } catch (error) {
    console.error('💥 Edge analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runEdgeAnalysisAgent();
}

module.exports = { runEdgeAnalysisAgent, analyzeEdgesWithTiming, Timing };
