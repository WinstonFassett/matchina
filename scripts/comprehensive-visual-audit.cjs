#!/usr/bin/env node

/**
 * Comprehensive Visual Audit Agent
 * 
 * Complete visual analysis covering:
 * - Edge issues (parallel edges, labels, routing)
 * - Containment and overlap problems
 * - Clipping issues
 * - Color and contrast accessibility
 * - Overall usability
 * 
 * Generates detailed report with actionable fixes and ticket recommendations
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const DOCS_BASE_URL = 'http://localhost:4321/matchina/examples/';
const SCREENSHOT_DIR = path.join(__dirname, '../review/screenshots');
const OLLAMA_MODEL = 'llava';

// Comprehensive test cases
const COMPREHENSIVE_TESTS = [
  { 
    name: 'hsm-combobox-flattened-comprehensive', 
    url: `${DOCS_BASE_URL}hsm-combobox`,
    mode: 'flattened',
    visualizer: 'ReactFlow',
    focus: 'comprehensive-audit'
  },
  { 
    name: 'hsm-combobox-nested-comprehensive', 
    url: `${DOCS_BASE_URL}hsm-combobox`,
    mode: 'nested', 
    visualizer: 'ReactFlow',
    focus: 'comprehensive-audit'
  },
  { 
    name: 'reactflow-subflow-comprehensive', 
    url: `${DOCS_BASE_URL}reactflow-subflow-test`,
    mode: 'default',
    visualizer: 'ReactFlow', 
    focus: 'comprehensive-audit'
  },
  { 
    name: 'hsm-traffic-light-comprehensive', 
    url: `${DOCS_BASE_URL}hsm-traffic-light`,
    mode: 'default',
    visualizer: 'ReactFlow', 
    focus: 'comprehensive-audit'
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
    const total = this.measurements.reduce((sum, m) => sum + m.duration, 0);
    return {
      totalOperations: this.measurements.length,
      totalTime: total,
      averageTime: total / this.measurements.length,
      measurements: this.measurements
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
      '--timeout', '15000',
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

// Comprehensive visual analysis
async function comprehensiveVisualAnalysis(timing, imagePath, testInfo) {
  return new Promise((resolve, reject) => {
    timing.start('comprehensive-analysis');
    console.log(`🔍 Running comprehensive visual analysis...`);
    
    const comprehensivePrompt = `As a senior UX/UI accessibility expert and visualization specialist, conduct a comprehensive audit of this ReactFlow state machine diagram. Analyze ALL of the following categories in detail:

## 1. EDGE ANALYSIS
- **Parallel Edge Handling**: Are parallel edges between same nodes properly separated with onion-like layering?
- **Edge Label Visibility**: Are all edge labels fully visible, not obstructed by nodes/other edges?
- **Edge Routing Quality**: Are edges routed cleanly without overlaps or awkward paths?
- **Edge-Node Separation**: Proper spacing between edges and node boundaries?
- **Edge Hierarchy**: Clear visual hierarchy showing importance/flow direction?

## 2. CONTAINMENT & OVERLAP ANALYSIS  
- **Node Overlaps**: Any nodes overlapping each other?
- **Parent-Child Containment**: In nested mode, are child nodes properly contained within parent boundaries?
- **Element Clipping**: Any visual elements clipped at container edges?
- **Boundary Violations**: Elements extending beyond their intended containers?
- **Visual Hierarchy**: Clear parent-child relationships visible?

## 3. COLOR & CONTRAST ACCESSIBILITY
- **Text Contrast**: All text meets WCAG AA standards (4.5:1 minimum)?
- **Edge-Background Contrast**: Edges clearly visible against background?
- **Node-Edge Contrast**: Clear distinction between nodes and edges?
- **Color Blindness Friendly**: Usable for color-blind users (not color-only differentiation)?
- **Theme Consistency**: Consistent color scheme across light/dark modes?

## 4. USABILITY & USER EXPERIENCE
- **Readability**: Overall text and diagram readability?
- **Visual Noise**: Excessive visual clutter or distractions?
- **Information Hierarchy**: Clear visual hierarchy guiding user attention?
- **Interactive Elements**: Interactive elements clearly identifiable?
- **State Indication**: Active/inactive states clearly visible?

## 5. LAYOUT & SPACING
- **Element Spacing**: Adequate spacing between all elements?
- **Alignment**: Proper visual alignment of elements?
- **Balance**: Visual balance of the composition?
- **Density**: Appropriate information density vs whitespace?
- **Responsive Behavior**: Layout adapts well to different sizes?

## 6. SPECIFIC ISSUES IDENTIFICATION
For each category above, identify:
- Critical issues (must fix)
- Major issues (should fix) 
- Minor issues (nice to fix)
- Specific locations/elements affected

## 7. FIX RECOMMENDATIONS
Provide specific, actionable recommendations for each issue:
- Immediate fixes needed
- Code-level suggestions where appropriate
- CSS/styling improvements
- Layout algorithm adjustments

Respond in detailed JSON format:
{
  "overallScore": "Critical|Poor|Fair|Good|Excellent",
  "edgeAnalysis": {
    "parallelEdgeQuality": "Critical|Poor|Fair|Good|Excellent",
    "edgeLabelVisibility": "Critical|Poor|Fair|Good|Excellent", 
    "edgeRouting": "Critical|Poor|Fair|Good|Excellent",
    "edgeNodeSeparation": "Critical|Poor|Fair|Good|Excellent",
    "edgeHierarchy": "Critical|Poor|Fair|Good|Excellent",
    "criticalIssues": ["edge issue 1", "edge issue 2"],
    "majorIssues": ["edge issue 3"],
    "recommendations": ["edge fix 1", "edge fix 2"]
  },
  "containmentOverlap": {
    "nodeOverlaps": "Critical|Poor|Fair|Good|Excellent",
    "parentChildContainment": "Critical|Poor|Fair|Good|Excellent",
    "elementClipping": "Critical|Poor|Fair|Good|Excellent",
    "boundaryViolations": "Critical|Poor|Fair|Good|Excellent",
    "visualHierarchy": "Critical|Poor|Fair|Good|Excellent",
    "criticalIssues": ["containment issue 1"],
    "majorIssues": ["containment issue 2"],
    "recommendations": ["containment fix 1"]
  },
  "colorContrast": {
    "textContrast": "Critical|Poor|Fair|Good|Excellent",
    "edgeBackgroundContrast": "Critical|Poor|Fair|Good|Excellent",
    "nodeEdgeContrast": "Critical|Poor|Fair|Good|Excellent", 
    "colorBlindnessFriendly": boolean,
    "themeConsistency": "Critical|Poor|Fair|Good|Excellent",
    "criticalIssues": ["contrast issue 1"],
    "majorIssues": ["contrast issue 2"],
    "recommendations": ["contrast fix 1"]
  },
  "usability": {
    "readability": "Critical|Poor|Fair|Good|Excellent",
    "visualNoise": "Critical|Poor|Fair|Good|Excellent",
    "informationHierarchy": "Critical|Poor|Fair|Good|Excellent",
    "interactiveElements": "Critical|Poor|Fair|Good|Excellent",
    "stateIndication": "Critical|Poor|Fair|Good|Excellent",
    "criticalIssues": ["usability issue 1"],
    "majorIssues": ["usability issue 2"], 
    "recommendations": ["usability fix 1"]
  },
  "layoutSpacing": {
    "elementSpacing": "Critical|Poor|Fair|Good|Excellent",
    "alignment": "Critical|Poor|Fair|Good|Excellent",
    "balance": "Critical|Poor|Fair|Good|Excellent",
    "density": "Critical|Poor|Fair|Good|Excellent",
    "responsiveBehavior": "Critical|Poor|Fair|Good|Excellent",
    "criticalIssues": ["layout issue 1"],
    "majorIssues": ["layout issue 2"],
    "recommendations": ["layout fix 1"]
  },
  "summary": {
    "totalCriticalIssues": number,
    "totalMajorIssues": number,
    "priorityFixes": ["fix 1", "fix 2", "fix 3"],
    "accessibilityScore": "Critical|Poor|Fair|Good|Excellent",
    "userExperienceScore": "Critical|Poor|Fair|Good|Excellent"
  }
}`;
    
    const ollama = spawn('ollama', ['run', OLLAMA_MODEL, comprehensivePrompt], {
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
      const duration = timing.end('comprehensive-analysis');
      if (code === 0) {
        try {
          // Extract JSON from output
          const jsonMatch = output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            console.log(`✅ Comprehensive analysis complete (${duration?.toFixed(2)}ms)`);
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

// Save comprehensive analysis
async function saveComprehensiveAnalysis(result, screenshotPath, testName) {
  const analysisPath = screenshotPath.replace('.png', '-comprehensive-analysis.json');
  const metadata = {
    testName,
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
  console.log(`💾 Comprehensive analysis saved: ${path.basename(analysisPath)}`);
  return analysisPath;
}

// Generate comprehensive report with tickets
async function generateComprehensiveReport(allResults, timingReport) {
  const reportPath = path.join(SCREENSHOT_DIR, `comprehensive-visual-audit-${new Date().toISOString().split('T')[0]}.json`);
  
  // Aggregate all issues across tests
  const aggregatedIssues = {
    critical: [],
    major: [],
    byCategory: {
      edges: [],
      containment: [],
      contrast: [],
      usability: [],
      layout: []
    }
  };

  allResults.forEach(result => {
    if (result.analysis && !result.analysis.jsonError) {
      const analysis = result.analysis;
      
      // Aggregate critical issues
      ['edgeAnalysis', 'containmentOverlap', 'colorContrast', 'usability', 'layoutSpacing'].forEach(category => {
        if (analysis[category]) {
          if (analysis[category].criticalIssues) {
            aggregatedIssues.critical.push(...analysis[category].criticalIssues.map(issue => ({
              issue,
              category,
              test: result.testName
            })));
          }
          if (analysis[category].majorIssues) {
            aggregatedIssues.major.push(...analysis[category].majorIssues.map(issue => ({
              issue,
              category,
              test: result.testName
            })));
          }
        }
      });
    }
  });

  // Generate ticket recommendations
  const ticketRecommendations = generateTicketRecommendations(aggregatedIssues);

  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      model: OLLAMA_MODEL,
      totalTests: allResults.length,
      successfulAnalyses: allResults.filter(r => !r.analysis?.jsonError).length,
      timing: timingReport
    },
    executiveSummary: {
      overallHealth: aggregatedIssues.critical.length > 5 ? 'Critical' : 
                    aggregatedIssues.critical.length > 2 ? 'Poor' : 
                    aggregatedIssues.critical.length > 0 ? 'Fair' : 'Good',
      totalCriticalIssues: aggregatedIssues.critical.length,
      totalMajorIssues: aggregatedIssues.major.length,
      priorityLevel: aggregatedIssues.critical.length > 3 ? 'HIGH' : 
                   aggregatedIssues.critical.length > 0 ? 'MEDIUM' : 'LOW'
    },
    aggregatedIssues,
    ticketRecommendations,
    detailedResults: allResults.map(r => ({
      testName: r.testName,
      success: r.success,
      timing: {
        screenshot: r.screenshotDuration,
        analysis: r.analysisDuration,
        total: r.totalDuration
      },
      keyMetrics: r.analysis ? {
        overallScore: r.analysis.overallScore,
        criticalIssues: r.analysis.summary?.totalCriticalIssues || 0,
        majorIssues: r.analysis.summary?.totalMajorIssues || 0,
        accessibilityScore: r.analysis.summary?.accessibilityScore,
        userExperienceScore: r.analysis.summary?.userExperienceScore
      } : null,
      hasAnalysis: !r.analysis?.jsonError
    }))
  };
  
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Comprehensive report saved: ${path.basename(reportPath)}`);
  return report;
}

// Generate specific ticket recommendations
function generateTicketRecommendations(issues) {
  const tickets = [];

  // Edge issues
  const edgeIssues = issues.byCategory.edges;
  if (edgeIssues.length > 0) {
    tickets.push({
      title: "Fix ReactFlow Edge Rendering and Parallel Edge Handling",
      priority: issues.critical.filter(i => i.category === 'edges').length > 0 ? 'HIGH' : 'MEDIUM',
      description: "Address edge routing, parallel edge layering, and label visibility issues",
      issues: edgeIssues,
      estimatedComplexity: edgeIssues.length > 3 ? 'HIGH' : 'MEDIUM',
      recommendedActions: [
        "Implement parallel edge separation algorithm",
        "Fix edge label positioning to avoid obstruction",
        "Improve edge routing for cleaner paths",
        "Add edge-node separation spacing"
      ]
    });
  }

  // Containment/overlap issues
  const containmentIssues = issues.byCategory.containment;
  if (containmentIssues.length > 0) {
    tickets.push({
      title: "Fix Node Containment and Overlap Issues",
      priority: issues.critical.filter(i => i.category === 'containment').length > 0 ? 'HIGH' : 'MEDIUM',
      description: "Resolve node overlaps, parent-child containment, and element clipping",
      issues: containmentIssues,
      estimatedComplexity: 'MEDIUM',
      recommendedActions: [
        "Fix node overlap detection and prevention",
        "Ensure proper parent-child containment in nested mode",
        "Fix element clipping at container boundaries",
        "Improve visual hierarchy representation"
      ]
    });
  }

  // Color/contrast issues
  const contrastIssues = issues.byCategory.contrast;
  if (contrastIssues.length > 0) {
    tickets.push({
      title: "Improve Color Contrast and Accessibility",
      priority: issues.critical.filter(i => i.category === 'contrast').length > 0 ? 'HIGH' : 'MEDIUM',
      description: "Fix contrast issues and improve accessibility compliance",
      issues: contrastIssues,
      estimatedComplexity: 'LOW',
      recommendedActions: [
        "Ensure WCAG AA compliance for text contrast",
        "Improve edge-background contrast",
        "Test color-blindness compatibility",
        "Standardize theme consistency"
      ]
    });
  }

  // Layout issues
  const layoutIssues = issues.byCategory.layout;
  if (layoutIssues.length > 0) {
    tickets.push({
      title: "Optimize Layout Spacing and Visual Balance",
      priority: 'MEDIUM',
      description: "Improve element spacing, alignment, and overall layout quality",
      issues: layoutIssues,
      estimatedComplexity: 'MEDIUM',
      recommendedActions: [
        "Adjust element spacing for better readability",
        "Improve visual alignment and balance",
        "Optimize information density",
        "Enhance responsive behavior"
      ]
    });
  }

  // Usability issues
  const usabilityIssues = issues.byCategory.usability;
  if (usabilityIssues.length > 0) {
    tickets.push({
      title: "Enhance Overall Usability and User Experience",
      priority: 'MEDIUM',
      description: "Address readability, visual noise, and interaction issues",
      issues: usabilityIssues,
      estimatedComplexity: 'LOW',
      recommendedActions: [
        "Improve overall readability",
        "Reduce visual noise and clutter",
        "Enhance information hierarchy",
        "Improve interactive element visibility"
      ]
    });
  }

  return tickets;
}

// Main comprehensive audit workflow
async function runComprehensiveVisualAudit() {
  try {
    console.log('🔍 Comprehensive Visual Audit Agent - Starting...\n');
    
    const timing = new Timing();
    await ensureDir(SCREENSHOT_DIR);
    
    const results = [];
    
    for (const testCase of COMPREHENSIVE_TESTS) {
      console.log(`\n🎯 Auditing: ${testCase.name}`);
      console.log(`URL: ${testCase.url}`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(SCREENSHOT_DIR, `${testCase.name}-${timestamp}.png`);
      
      try {
        // Capture screenshot with timing
        const { outputPath, duration: screenshotDuration } = await runPlaywrightWithTiming(
          timing, testCase.url, screenshotPath
        );
        
        // Run comprehensive analysis
        const { analysis, duration: analysisDuration } = await comprehensiveVisualAnalysis(
          timing, outputPath, testCase
        );
        
        const totalDuration = screenshotDuration + analysisDuration;
        
        // Save results
        await saveComprehensiveAnalysis({
          screenshotDuration,
          analysisDuration,
          analysis
        }, outputPath, testCase.name);
        
        results.push({
          testName: testCase.name,
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
          error: error.message,
          success: false
        });
      }
    }
    
    // Generate comprehensive report
    const timingReport = timing.getReport();
    const report = await generateComprehensiveReport(results, timingReport);
    
    console.log('\n🎉 Comprehensive Visual Audit Complete!');
    console.log(`📁 Results saved to: ${SCREENSHOT_DIR}`);
    console.log(`📊 Successful analyses: ${results.filter(r => r.success).length}/${results.length}`);
    console.log(`⏱️  Total audit time: ${timingReport.totalTime.toFixed(2)}ms`);
    console.log(`🚨 Critical issues found: ${report.executiveSummary.totalCriticalIssues}`);
    console.log(`⚠️  Major issues found: ${report.executiveSummary.totalMajorIssues}`);
    console.log(`🎫 Tickets recommended: ${report.ticketRecommendations.length}`);
    
    // Print ticket summary
    console.log('\n📋 RECOMMENDED TICKETS:');
    report.ticketRecommendations.forEach((ticket, i) => {
      console.log(`${i + 1}. [${ticket.priority}] ${ticket.title}`);
      console.log(`   Issues: ${ticket.issues.length} | Complexity: ${ticket.estimatedComplexity}`);
    });
    
  } catch (error) {
    console.error('💥 Comprehensive audit failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runComprehensiveVisualAudit();
}

module.exports = { runComprehensiveVisualAudit, comprehensiveVisualAnalysis };
