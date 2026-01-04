#!/usr/bin/env node

/**
 * Adversarial Visual Comparison Agent
 * 
 * Compares ReactFlow vs ForceGraph visualizers on the same example
 * Focus: Edge routing, parallel edges, onion-layer effect
 * Scoring system: 0-1 scale with detailed feedback
 * Target example: http://localhost:4321/matchina/examples/toggle
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const TOGGLE_URL = 'http://localhost:4321/matchina/examples/toggle';
const SCREENSHOT_DIR = path.join(__dirname, '../review/screenshots');
const FEEDBACK_DIR = path.join(__dirname, '../review/visual-agent/toggle');
const OLLAMA_MODEL = 'llava';

// Visualizers to compare - using visualizer picker approach
const VISUALIZERS = [
  { name: 'reactflow', action: 'click [data-testid="reactflow-option"]' },
  { name: 'forcegraph', action: 'click [data-testid="forcegraph-option"]' }
];

// Timing tracking
class ComparisonTiming {
  constructor() {
    this.starts = new Map();
    this.results = [];
  }

  start(op, viz) {
    this.starts.set(`${op}-${viz}`, process.hrtime.bigint());
  }

  end(op, viz) {
    const start = this.starts.get(`${op}-${viz}`);
    if (!start) return null;
    const duration = Number(process.hrtime.bigint() - start) / 1000000;
    this.results.push({ op, viz, duration });
    return duration;
  }

  getSummary() {
    const byViz = {};
    this.results.forEach(r => {
      if (!byViz[r.viz]) byViz[r.viz] = [];
      byViz[r.viz].push(r.duration);
    });

    const summary = {};
    Object.entries(byViz).forEach(([viz, times]) => {
      const total = times.reduce((sum, t) => sum + t, 0);
      summary[viz] = {
        total,
        count: times.length,
        avg: total / times.length,
        fastest: Math.min(...times),
        slowest: Math.max(...times)
      };
    });

    return summary;
  }
}

// Load existing feedback tracker
async function loadFeedbackTracker() {
  try {
    const content = await fs.readFile(path.join(FEEDBACK_DIR, 'feedback-tracker.json'), 'utf8');
    return JSON.parse(content);
  } catch (error) {
    // Return default structure if file doesn't exist
    return {
      metadata: {
        version: "1.0.0",
        created: new Date().toISOString(),
        focusExample: "toggle",
        focusArea: "edge-routing-comparison"
      },
      visualizers: {
        reactflow: { analyses: [], latestScore: null, issues: [] },
        forcegraph: { analyses: [], latestScore: null, issues: [] }
      },
      comparisons: [],
      scoringEvolution: []
    };
  }
}

// Save feedback tracker
async function saveFeedbackTracker(tracker) {
  tracker.metadata.lastUpdated = new Date().toISOString();
  await fs.writeFile(
    path.join(FEEDBACK_DIR, 'feedback-tracker.json'),
    JSON.stringify(tracker, null, 2)
  );
}

// Capture screenshot for specific visualizer
async function captureVisualizerScreenshot(visualizer, timestamp) {
  return new Promise((resolve, reject) => {
    const filename = `toggle-${visualizer.name}-${timestamp}.png`;
    const outputPath = path.join(SCREENSHOT_DIR, filename);

    const playwright = spawn('npx', [
      'playwright', 'screenshot',
      '--wait-for-selector', '[data-testid="visualizer-picker"]',
      '--timeout', '5000',
      TOGGLE_URL,
      outputPath
    ], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'ignore']
    });

    playwright.on('close', (code) => {
      if (code === 0) {
        resolve({ filename, outputPath });
      } else {
        reject(new Error(`Screenshot failed for ${visualizer.name}`));
      }
    });
  });
}

// Adversarial comparison analysis
async function adversarialComparison(reactflowImage, forcegraphImage) {
  return new Promise((resolve, reject) => {
    const comparisonPrompt = `As a Mike Bostock-level visualization expert, compare these two state machine visualizations and score them.

Focus specifically on:
1. **Edge Routing Quality**: How well are edges routed between nodes?
2. **Parallel Edge Handling**: Are parallel edges properly separated with onion-like layering?
3. **Edge Clarity**: Are edges clearly visible and not obstructed?
4. **Visual Hierarchy**: Do edges help show the flow and relationships?
5. **Overall Aesthetic**: Professional appearance and visual appeal?

Score each visualizer on 0-1 scale (0=terrible, 1=excellent):

JSON format:
{
  "reactflow": {
    "edgeRouting": 0.0-1.0,
    "parallelEdges": 0.0-1.0,
    "edgeClarity": 0.0-1.0,
    "visualHierarchy": 0.0-1.0,
    "aesthetic": 0.0-1.0,
    "overall": 0.0-1.0,
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "recommendations": ["rec1", "rec2"]
  },
  "forcegraph": {
    "edgeRouting": 0.0-1.0,
    "parallelEdges": 0.0-1.0,
    "edgeClarity": 0.0-1.0,
    "visualHierarchy": 0.0-1.0,
    "aesthetic": 0.0-1.0,
    "overall": 0.0-1.0,
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "recommendations": ["rec1", "rec2"]
  },
  "comparison": {
    "winner": "reactflow|forcegraph|tie",
    "margin": 0.0-1.0,
    "keyDifference": "main reason for winner",
    "improvementOpportunity": "what the loser should focus on"
  }
}`;

    const ollama = spawn('ollama', ['run', OLLAMA_MODEL, comparisonPrompt], {
      stdio: ['pipe', 'pipe', 'ignore']
    });

    // Send both images
    ollama.stdin.write(`@${reactflowImage}\n`);
    ollama.stdin.write(`@${forcegraphImage}\n`);
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
            resolve({ parseError: true, rawOutput: output.slice(0, 500) });
          }
        } catch {
          resolve({ parseError: true, rawOutput: output.slice(0, 500) });
        }
      } else {
        reject(new Error('Comparison analysis failed'));
      }
    });
  });
}

// Update feedback tracker with new results
async function updateFeedbackTracker(tracker, comparison, timing, screenshots) {
  const timestamp = new Date().toISOString();
  
  // Update visualizer data
  ['reactflow', 'forcegraph'].forEach(viz => {
    const vizData = comparison[viz];
    if (vizData && !vizData.parseError) {
      tracker.visualizers[viz].analyses.push({
        timestamp,
        overall: vizData.overall,
        edgeRouting: vizData.edgeRouting,
        parallelEdges: vizData.parallelEdges,
        strengths: vizData.strengths,
        weaknesses: vizData.weaknesses,
        recommendations: vizData.recommendations,
        screenshot: screenshots[viz].filename
      });
      
      tracker.visualizers[viz].latestScore = vizData.overall;
      tracker.visualizers[viz].issues = vizData.weaknesses;
    }
  });

  // Add comparison record
  if (comparison.comparison) {
    tracker.comparisons.push({
      timestamp,
      winner: comparison.comparison.winner,
      margin: comparison.comparison.margin,
      keyDifference: comparison.comparison.keyDifference,
      improvementOpportunity: comparison.comparison.improvementOpportunity,
      screenshots
    });

    // Update scoring evolution
    tracker.scoringEvolution.push({
      timestamp,
      reactflow: comparison.reactflow?.overall || null,
      forcegraph: comparison.forcegraph?.overall || null,
      winner: comparison.comparison?.winner || null
    });

    // Update current leader
    if (comparison.comparison.winner) {
      tracker.currentLeader = comparison.comparison.winner;
    }
  }

  tracker.metadata.totalAnalyses = (tracker.metadata.totalAnalyses || 0) + 1;
  tracker.metadata.totalTimeMs = (tracker.metadata.totalTimeMs || 0) + 
    Object.values(timing).reduce((sum, viz) => sum + viz.total, 0);
}

// Generate comparison report with images
async function generateComparisonReport(tracker, comparison, screenshots) {
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(FEEDBACK_DIR, `comparison-${timestamp}.md`);

  const report = `# Adversarial Visual Comparison Report
**Example**: Toggle State Machine  
**Focus**: Edge Routing & Parallel Edges  
**Date**: ${new Date().toLocaleDateString()}  
**Winner**: ${comparison.comparison?.winner || 'Unknown'}  

## Visualizer Comparison

### ReactFlow
![ReactFlow](../../../screenshots/${screenshots.reactflow.filename})

**Score**: ${comparison.reactflow?.overall?.toFixed(2) || 'N/A'} / 1.0

**Strengths**:
${comparison.reactflow?.strengths?.map(s => `- ${s}`).join('\n') || '- None identified'}

**Weaknesses**:
${comparison.reactflow?.weaknesses?.map(w => `- ${w}`).join('\n') || '- None identified'}

**Recommendations**:
${comparison.reactflow?.recommendations?.map(r => `- ${r}`).join('\n') || '- None provided'}

---

### ForceGraph
![ForceGraph](../../../screenshots/${screenshots.forcegraph.filename})

**Score**: ${comparison.forcegraph?.overall?.toFixed(2) || 'N/A'} / 1.0

**Strengths**:
${comparison.forcegraph?.strengths?.map(s => `- ${s}`).join('\n') || '- None identified'}

**Weaknesses**:
${comparison.forcegraph?.weaknesses?.map(w => `- ${w}`).join('\n') || '- None identified'}

**Recommendations**:
${comparison.forcegraph?.recommendations?.map(r => `- ${r}`).join('\n') || '- None provided'}

---

## Head-to-Head Analysis

**Winner**: ${comparison.comparison?.winner || 'Unknown'}  
**Margin**: ${comparison.comparison?.margin?.toFixed(2) || 'N/A'}  
**Key Difference**: ${comparison.comparison?.keyDifference || 'Not identified'}  
**Improvement Opportunity**: ${comparison.comparison?.improvementOpportunity || 'Not identified'}

## Scoring Evolution

${tracker.scoringEvolution.slice(-5).map(e => 
  `- ${new Date(e.timestamp).toLocaleTimeString()}: ReactFlow ${e.reactflow?.toFixed(2)} vs ForceGraph ${e.forcegraph?.toFixed(2)} (Winner: ${e.winner})`
).join('\n')}

## Next Steps

${comparison.comparison?.winner === 'reactflow' ? 
  'ForceGraph should focus on: ' + comparison.comparison.improvementOpportunity :
  comparison.comparison?.winner === 'forcegraph' ? 
  'ReactFlow should focus on: ' + comparison.comparison.improvementOpportunity :
  'Both visualizers need improvements'
}

---

*Generated by Adversarial Visual Comparison Agent*  
*Model: ${OLLAMA_MODEL} | Total Analyses: ${tracker.metadata.totalAnalyses}*
`;

  await fs.writeFile(reportPath, report);
  return reportPath;
}

// Main adversarial comparison workflow
async function runAdversarialComparison() {
  const timing = new ComparisonTiming();
  
  console.log('🔄 Starting adversarial visual comparison...');
  console.log('🎯 Focus: Edge routing between ReactFlow vs ForceGraph');
  console.log('📍 Target: Toggle example');
  
  try {
    // Load existing tracker
    const tracker = await loadFeedbackTracker();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Capture screenshots for both visualizers
    console.log('📸 Capturing ReactFlow screenshot...');
    timing.start('screenshot', 'reactflow');
    const reactflowScreenshot = await captureVisualizerScreenshot(VISUALIZERS[0], timestamp);
    timing.end('screenshot', 'reactflow');
    
    console.log('📸 Capturing ForceGraph screenshot...');
    timing.start('screenshot', 'forcegraph');
    const forcegraphScreenshot = await captureVisualizerScreenshot(VISUALIZERS[1], timestamp);
    timing.end('screenshot', 'forcegraph');
    
    // Run adversarial comparison
    console.log('🤖 Running AI comparison analysis...');
    timing.start('analysis', 'comparison');
    const comparison = await adversarialComparison(
      reactflowScreenshot.outputPath,
      forcegraphScreenshot.outputPath
    );
    timing.end('analysis', 'comparison');
    
    // Update feedback tracker
    const screenshots = {
      reactflow: reactflowScreenshot,
      forcegraph: forcegraphScreenshot
    };
    await updateFeedbackTracker(tracker, comparison, timing.getSummary(), screenshots);
    await saveFeedbackTracker(tracker);
    
    // Generate report with images
    const reportPath = await generateComparisonReport(tracker, comparison, screenshots);
    
    // Display results
    console.log('\n🏆 COMPARISON RESULTS:');
    console.log(`🥇 Winner: ${comparison.comparison?.winner || 'Unknown'}`);
    console.log(`📊 Scores: ReactFlow ${comparison.reactflow?.overall?.toFixed(2) || 'N/A'} vs ForceGraph ${comparison.forcegraph?.overall?.toFixed(2) || 'N/A'}`);
    console.log(`📈 Margin: ${comparison.comparison?.margin?.toFixed(2) || 'N/A'}`);
    console.log(`⏱️  Timing: ${JSON.stringify(timing.getSummary())}`);
    console.log(`📄 Report: ${reportPath}`);
    console.log(`💾 Tracker: ${path.join(FEEDBACK_DIR, 'feedback-tracker.json')}`);
    
    // Show key insights
    if (comparison.comparison?.keyDifference) {
      console.log(`\n💡 Key Difference: ${comparison.comparison.keyDifference}`);
    }
    if (comparison.comparison?.improvementOpportunity) {
      console.log(`🎯 Focus Area: ${comparison.comparison.improvementOpportunity}`);
    }
    
  } catch (error) {
    console.error('❌ Adversarial comparison failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAdversarialComparison();
}

module.exports = { runAdversarialComparison, adversarialComparison };
