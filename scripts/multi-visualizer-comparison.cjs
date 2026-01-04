#!/usr/bin/env node

/**
 * Multi-Visualizer Comparison - ReactFlow vs ForceGraph vs Mermaid
 * 
 * Uses Ollama for reliable visual analysis of all three visualizers
 * Focus: Human-centric evaluation criteria
 * Goal: Cross-pollination opportunities identification
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../review/screenshots');
const REVIEW_DIR = path.join(__dirname, '../review');

// Ensure directories exist
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
if (!fs.existsSync(REVIEW_DIR)) fs.mkdirSync(REVIEW_DIR, { recursive: true });

// Ollama analysis prompt for multi-visualizer comparison
const MULTI_VIZ_PROMPT = `
Analyze this state machine visualization for human-centric quality assessment.

Evaluate the following criteria (1-10 scale, with detailed comments):

EDGE QUALITY:
- Parallel edge separation and clarity
- Edge routing and path smoothness  
- Overlap prevention and visual hierarchy
- Edge label visibility and positioning

NODE STYLING:
- Theme consistency and color harmony
- Visual hierarchy and node prominence
- Professional appearance and polish
- Label readability and typography

VISIBILITY & CLIPPING:
- Any content cut off or hidden
- Complete label and edge visibility
- Proper spacing and margins
- Responsive layout handling

OVERALL AESTHETICS:
- Visual balance and composition
- Modern appearance and design
- User experience and intuitiveness
- Professional presentation

CROSS-VISUALIZER INSIGHTS:
- What features would inspire other visualizers?
- Which aspects are ahead/behind alternatives?
- What unique strengths does this approach offer?
- What weaknesses need immediate attention?

Respond with JSON structure:
{
  "edgeQuality": {"score": 1-10, "details": "specific feedback"},
  "nodeStyling": {"score": 1-10, "details": "specific feedback"},
  "visibility": {"score": 1-10, "details": "specific feedback"},
  "overallAesthetics": {"score": 1-10, "details": "specific feedback"},
  "crossPollination": {
    "strengthsToShare": ["feature1", "feature2"],
    "weaknessesToFix": ["issue1", "issue2"],
    "inspirationFor": ["ReactFlow", "ForceGraph", "Mermaid"]
  },
  "priorityIssues": ["critical issue 1", "critical issue 2"],
  "recommendations": ["actionable improvement 1", "actionable improvement 2"]
}
`;

// Playwright script for multi-visualizer capture
const CAPTURE_SCRIPT = `
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🎯 Multi-Visualizer Comparison - Toggle Example');
    
    // Navigate to toggle example
    await page.goto('http://localhost:4321/matchina/examples/toggle');
    await page.waitForSelector('.machine-visualizer', { timeout: 5000 });
    
    const visualizers = ['reactflow', 'forcegraph', 'mermaid-statechart'];
    const results = [];
    
    for (const visualizer of visualizers) {
      console.log(\`🔄 Capturing \${visualizer}...\`);
      
      // Switch to visualizer
      const picker = await page.$('[data-testid="visualizer-picker"]');
      if (picker) {
        await picker.selectOption(visualizer);
        await page.waitForTimeout(500);
      }
      
      // Wait for visualizer-specific elements
      try {
        switch (visualizer) {
          case 'reactflow':
            await page.waitForSelector('.react-flow__node', { timeout: 3000 });
            break;
          case 'forcegraph':
            await page.waitForSelector('canvas', { timeout: 3000 });
            break;
          case 'mermaid-statechart':
            await page.waitForSelector('svg', { timeout: 3000 });
            break;
        }
      } catch (error) {
        console.log(\`⚠️  Visualizer \${visualizer} may not be available: \${error.message}\`);
        continue;
      }
      
      // Capture focused screenshot
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = \`multi-comparison-\${visualizer}-\${timestamp}.png\`;
      const filepath = '${SCREENSHOT_DIR}/' + filename;
      
      // Focus on the main content area (visualizer + app)
      const contentArea = await page.$('.machine-visualizer > div:last-child');
      if (contentArea) {
        await contentArea.screenshot({ path: filepath });
        console.log(\`✅ \${visualizer} screenshot saved: \${filename}\`);
        results.push({ visualizer, filename, filepath });
      }
    }
    
    console.log('📊 Capture results:', JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('💥 Capture failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
`;

// Analyze screenshot with Ollama
function analyzeWithOllama(imagePath, visualizer) {
  return new Promise((resolve, reject) => {
    console.log(`🎨 Analyzing ${visualizer} with Ollama...`);
    
    const ollama = spawn('ollama', ['run', 'llava', imagePath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let stderr = '';
    
    ollama.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ollama.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    ollama.on('close', (code) => {
      if (code === 0) {
        try {
          // Try to extract JSON from output
          const jsonMatch = output.match(/\\{[\\s\\S]*\\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            resolve({ visualizer, analysis, rawOutput: output });
          } else {
            // Fallback to raw output
            resolve({ visualizer, analysis: { rawOutput: output }, rawOutput: output });
          }
        } catch (error) {
          console.warn(`⚠️  JSON parsing failed for ${visualizer}:`, error.message);
          resolve({ visualizer, analysis: { rawOutput: output, parseError: error.message }, rawOutput: output });
        }
      } else {
        reject(new Error(`Ollama failed with code ${code}: ${stderr}`));
      }
    });
    
    // Send the prompt
    ollama.stdin.write(MULTI_VIZ_PROMPT);
    ollama.stdin.end();
  });
}

// Run the comparison
async function runMultiVisualizerComparison() {
  console.log('🔍 Starting Multi-Visualizer Comparison...');
  
  try {
    // Step 1: Capture screenshots
    console.log('📸 Step 1: Capturing visualizer screenshots...');
    await new Promise((resolve, reject) => {
      const child = spawn('node', ['-e', CAPTURE_SCRIPT], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
        console.log(data.toString().trim());
      });

      child.stderr.on('data', (data) => {
        console.error('Error:', data.toString());
      });

      child.on('close', (code) => {
        if (code === 0) {
          // Parse results to get captured screenshots
          const resultsMatch = output.match(/📊 Capture results: ([\\s\\S]*)$/m);
          if (resultsMatch) {
            try {
              const results = JSON.parse(resultsMatch[1]);
              resolve(results);
            } catch (error) {
              console.warn('⚠️  Could not parse capture results:', error.message);
              resolve([]);
            }
          } else {
            resolve([]);
          }
        } else {
          reject(new Error(`Capture failed with code ${code}`));
        }
      });
    });

    // Step 2: Analyze with Ollama
    console.log('🧠 Step 2: Analyzing with Ollama...');
    
    // Get latest screenshots for each visualizer
    const screenshots = fs.readdirSync(SCREENSHOT_DIR)
      .filter(file => file.startsWith('multi-comparison-') && file.endsWith('.png'))
      .sort((a, b) => b.localeCompare(a)); // Most recent first
    
    const visualizerScreenshots = {};
    for (const screenshot of screenshots) {
      const visualizer = screenshot.match(/multi-comparison-(\\w+)-/)[1];
      if (!visualizerScreenshots[visualizer]) {
        visualizerScreenshots[visualizer] = path.join(SCREENSHOT_DIR, screenshot);
      }
    }

    const analyses = {};
    for (const [visualizer, imagePath] of Object.entries(visualizerScreenshots)) {
      try {
        const result = await analyzeWithOllama(imagePath, visualizer);
        analyses[visualizer] = result;
        console.log(`✅ ${visualizer} analysis complete`);
      } catch (error) {
        console.error(`❌ ${visualizer} analysis failed:`, error.message);
        analyses[visualizer] = { error: error.message };
      }
    }

    // Step 3: Generate comparison report
    console.log('📋 Step 3: Generating comparison report...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(REVIEW_DIR, `multi-visualizer-comparison-${timestamp}.md`);
    
    let report = `# Multi-Visualizer Comparison Report
**Date**: ${new Date().toISOString()}
**Example**: Toggle State Machine
**Visualizers**: ReactFlow, ForceGraph, Mermaid
**Analysis Model**: LLaVA via Ollama

---

## 📊 Executive Summary

`;

    // Add analyses to report
    for (const [visualizer, result] of Object.entries(analyses)) {
      if (result.error) {
        report += `## ${visualizer.charAt(0).toUpperCase() + visualizer.slice(1)} - Analysis Failed
❌ Error: ${result.error}

`;
      } else {
        const analysis = result.analysis;
        report += `## ${visualizer.charAt(0).toUpperCase() + visualizer.slice(1)} Analysis

### Edge Quality: ${analysis.edgeQuality?.score || 'N/A'}/10
${analysis.edgeQuality?.details || 'No details available'}

### Node Styling: ${analysis.nodeStyling?.score || 'N/A'}/10  
${analysis.nodeStyling?.details || 'No details available'}

### Visibility: ${analysis.visibility?.score || 'N/A'}/10
${analysis.visibility?.details || 'No details available'}

### Overall Aesthetics: ${analysis.overallAesthetics?.score || 'N/A'}/10
${analysis.overallAesthetics?.details || 'No details available'}

### Cross-Pollination Insights
**Strengths to Share**: ${(analysis.crossPollination?.strengthsToShare || []).join(', ')}

**Weaknesses to Fix**: ${(analysis.crossPollination?.weaknessesToFix || []).join(', ')}

**Inspiration For**: ${(analysis.crossPollination?.inspirationFor || []).join(', ')}

### Priority Issues
${(analysis.priorityIssues || []).map(issue => `- ${issue}`).join('\\n')}

### Recommendations  
${(analysis.recommendations || []).map(rec => `- ${rec}`).join('\\n')}

`;
      }
    }

    // Add cross-visualizer comparison
    report += `---

## 🔄 Cross-Visualizer Comparison

### Edge Quality Rankings
`;

    const edgeRankings = Object.entries(analyses)
      .filter(([_, result]) => !result.error && result.analysis.edgeQuality?.score)
      .sort(([,a], [,b]) => (b.analysis.edgeQuality.score || 0) - (a.analysis.edgeQuality.score || 0));

    edgeRankings.forEach(([visualizer, result], index) => {
      report += `${index + 1}. **${visualizer}**: ${result.analysis.edgeQuality.score}/10 - ${result.analysis.edgeQuality.details.substring(0, 100)}...\\n`;
    });

    report += `### Node Styling Rankings
`;

    const nodeRankings = Object.entries(analyses)
      .filter(([_, result]) => !result.error && result.analysis.nodeStyling?.score)
      .sort(([,a], [,b]) => (b.analysis.nodeStyling.score || 0) - (a.analysis.nodeStyling.score || 0));

    nodeRankings.forEach(([visualizer, result], index) => {
      report += `${index + 1}. **${visualizer}**: ${result.analysis.nodeStyling.score}/10 - ${result.analysis.nodeStyling.details.substring(0, 100)}...\\n`;
    });

    report += `---

## 🎯 Next Actions

### Immediate Priorities
1. **ReactFlow Edge Enhancement** - Learn from ForceGraph/Mermaid edge separation
2. **Mermaid Theme Integration** - Learn from ReactFlow styling
3. **ForceGraph Node Refinement** - Learn from ReactFlow professional appearance

### Cross-Pollination Opportunities
- **Edge Handling**: ForceGraph → ReactFlow
- **Styling**: ReactFlow → ForceGraph/Mermaid  
- **Theme Integration**: ReactFlow → Mermaid

---

*Generated by Multi-Visualizer Comparison Agent*  
*Model: LLaVA via Ollama | Branch: refine-toggle-reactflow-forcegraph-mermaid*
`;

    fs.writeFileSync(reportPath, report);
    console.log(`📋 Comparison report saved: ${reportPath}`);

    // Save JSON data for tracking
    const jsonPath = path.join(REVIEW_DIR, `multi-visualizer-analysis-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      example: 'toggle',
      visualizers: Object.keys(analyses),
      analyses: analyses,
      screenshots: visualizerScreenshots
    }, null, 2));
    console.log(`📊 Analysis data saved: ${jsonPath}`);

    console.log('🎉 Multi-Visualizer Comparison Complete!');
    
  } catch (error) {
    console.error('💥 Comparison failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMultiVisualizerComparison().catch(console.error);
}

module.exports = { runMultiVisualizerComparison };
