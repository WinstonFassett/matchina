#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Test Dashboard - What to run and what results to expect
 */

function findTestFiles() {
  const testDirs = ['test/e2e/functional', 'test/e2e/visual'];
  const tests = [];
  
  testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.spec.ts'));
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract test names
      const testMatches = content.match(/test\(['"`]([^'"`]+)['"`]/g);
      const testNames = testMatches ? testMatches.map(m => m.match(/test\(['"`]([^'"`]+)['"`]/)[1]) : [];
      
      // Extract examples
      const gotoMatches = content.match(/(?:goto.*\/matchina\/examples\/([^'"]+)|gotoExample.*'([^']+)')/g);
      const examples = gotoMatches ? gotoMatches.map(match => {
        if (match.includes('gotoExample')) {
          const matchResult = match.match(/gotoExample.*'([^']+)'/);
          return matchResult ? matchResult[1] : null;
        } else {
          return match.split('/').pop().replace(/['"]/g, '');
        }
      }).filter(Boolean) : [];
      
      tests.push({
        file: file,
        path: filePath,
        category: dir.split('/').pop(),
        testCount: testNames.length,
        testNames,
        examples,
        description: getTestDescription(file, content)
      });
    });
  });
  
  return tests;
}

function getTestDescription(filename, content) {
  const descriptions = {
    'checkout-smoke.spec.ts': 'Visual smoke tests for checkout, toggle, counter examples',
    'visual-smoke.spec.ts': 'Take pictures of all examples (checkout, toggle, counter, traffic-light, hsm-combobox)',
    'all-visualizers-complete.spec.ts': 'Complete visual test of all visualizers (sketch, mermaid, reactflow)',
    'combobox-comparison.spec.ts': 'Compare flat vs nested combobox behavior',
    'reactflow-toggle.spec.ts': 'Test ReactFlow visualizer with toggle/counter/traffic-light',
    'forcegraph-basic.spec.ts': 'Basic forcegraph visualizer test',
    'hsm-traffic-light-flattened-flowchart.spec.ts': 'Mermaid flowchart for HSM traffic light',
    'hsm-traffic-light-nested-statechart.spec.ts': 'Mermaid statechart for HSM traffic light'
  };
  
  return descriptions[filename] || 'Test file';
}

function generateDashboard() {
  const tests = findTestFiles();
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Dashboard - ${tests.length} test files</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            background: #0a0a0a; 
            color: #fff; 
            padding: 20px;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 30px; 
            border-radius: 12px; 
            margin-bottom: 30px;
            text-align: center;
        }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 40px; 
        }
        .stat { 
            background: #1a1a1a; 
            padding: 20px; 
            border-radius: 12px; 
            text-align: center; 
            border: 1px solid #333;
        }
        .stat-value { font-size: 32px; font-weight: 700; color: #667eea; }
        .stat-label { font-size: 14px; color: #999; text-transform: uppercase; margin-top: 8px; }
        
        .commands { 
            background: #1a1a1a; 
            padding: 20px; 
            border-radius: 12px; 
            margin-bottom: 40px; 
            border: 1px solid #333;
        }
        .commands h2 { color: #667eea; margin-bottom: 15px; }
        .command-group { margin-bottom: 20px; }
        .command-group h3 { color: #fff; margin-bottom: 10px; font-size: 16px; }
        .command { 
            background: #2a2a2a; 
            padding: 10px 15px; 
            border-radius: 8px; 
            margin-bottom: 8px; 
            font-family: 'Monaco', 'Menlo', monospace; 
            font-size: 13px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .command:hover { background: #3a3a3a; }
        .command-desc { color: #999; font-size: 12px; margin-top: 5px; }
        
        .tests { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); 
            gap: 20px; 
        }
        .test { 
            background: #1a1a1a; 
            border-radius: 12px; 
            padding: 20px; 
            border: 1px solid #333;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .test:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        .test-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 15px;
        }
        .test-title { 
            font-size: 18px; 
            font-weight: 600; 
            color: #667eea;
        }
        .test-category { 
            background: #667eea; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 12px; 
            text-transform: uppercase;
        }
        .test-description { 
            color: #ccc; 
            margin-bottom: 15px; 
            font-size: 14px;
        }
        .test-details { 
            font-size: 13px; 
            color: #999; 
        }
        .test-detail { 
            margin-bottom: 5px; 
        }
        .test-detail strong { color: #fff; }
        .run-btn { 
            background: #667eea; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 6px; 
            cursor: pointer; 
            margin-top: 15px; 
            font-size: 12px;
            transition: background 0.2s;
        }
        .run-btn:hover { background: #5568d3; }
        
        .status { 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 20px;
        }
        .status.good { background: #2d5a2d; border: 1px solid #4a7c4a; }
        .status.bad { background: #5a2d2d; border: 1px solid #7c4a4a; }
        .status.warning { background: #5a5a2d; border: 1px solid #7c7c4a; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Test Dashboard</h1>
        <p>${tests.length} test files • Run tests and see results</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-value">${tests.length}</div>
            <div class="stat-label">Test Files</div>
        </div>
        <div class="stat">
            <div class="stat-value">${tests.reduce((sum, t) => sum + t.testCount, 0)}</div>
            <div class="stat-label">Total Tests</div>
        </div>
        <div class="stat">
            <div class="stat-value">${new Set(tests.flatMap(t => t.examples)).size}</div>
            <div class="stat-label">Examples Tested</div>
        </div>
        <div class="stat">
            <div class="stat-value">${tests.filter(t => t.category === 'visual').length}</div>
            <div class="stat-label">Visual Tests</div>
        </div>
    </div>
    
    <div class="commands">
        <h2>🚀 Quick Commands</h2>
        
        <div class="command-group">
            <h3>📸 Visual Tests (Watch Screenshots)</h3>
            <div class="command" onclick="runCommand('npm run test:visual:headed')">
                npm run test:visual:headed
                <div class="command-desc">Watch visual smoke tests take pictures (5 examples)</div>
            </div>
            <div class="command" onclick="runCommand('npm run test:smoke:headed')">
                npm run test:smoke:headed
                <div class="command-desc">Watch smoke tests (3 examples: checkout, toggle, counter)</div>
            </div>
        </div>
        
        <div class="command-group">
            <h3>📊 Results & Reports</h3>
            <div class="command" onclick="runCommand('npm run screenshots:gallery')">
                npm run screenshots:gallery
                <div class="command-desc">Browse all screenshots in scrollable gallery</div>
            </div>
            <div class="command" onclick="runCommand('npm run screenshots:html')">
                npm run screenshots:html
                <div class="command-desc">Generate HTML report with test context and diffs</div>
            </div>
            <div class="command" onclick="runCommand('npm run coverage:balance')">
                npm run coverage:balance
                <div class="command-desc">See test coverage balance (19% coverage)</div>
            </div>
        </div>
        
        <div class="command-group">
            <h3>🔧 Fix & Update</h3>
            <div class="command" onclick="runCommand('npm run test:e2e:smoke --update-snapshots')">
                npm run test:e2e:smoke --update-snapshots
                <div class="command-desc">Update smoke test baselines (fix screenshot failures)</div>
            </div>
            <div class="command" onclick="runCommand('npx playwright test test/e2e/visual/visual-smoke.spec.ts --update-snapshots')">
                npx playwright test visual-smoke.spec.ts --update-snapshots
                <div class="command-desc">Update visual smoke test baselines</div>
            </div>
        </div>
    </div>
    
    <div class="tests">
        ${tests.map(test => `
        <div class="test">
            <div class="test-header">
                <div class="test-title">${test.file}</div>
                <div class="test-category">${test.category}</div>
            </div>
            <div class="test-description">${test.description}</div>
            <div class="test-details">
                <div class="test-detail"><strong>${test.testCount}</strong> tests</div>
                <div class="test-detail"><strong>Examples:</strong> ${test.examples.join(', ') || 'None'}</div>
                <div class="test-detail"><strong>Tests:</strong> ${test.testNames.slice(0, 3).join(', ')}${test.testNames.length > 3 ? '...' : ''}</div>
            </div>
            <button class="run-btn" onclick="runTest('${test.path}')">Run This Test</button>
        </div>
        `).join('')}
    </div>
    
    <script>
        function runCommand(command) {
            console.log('Running:', command);
            // Copy to clipboard
            navigator.clipboard.writeText(command);
            alert('Command copied to clipboard!\\n\\nRun it in your terminal:\\n' + command);
        }
        
        function runTest(testPath) {
            const command = 'npx playwright test ' + testPath + ' --headed';
            runCommand(command);
        }
    </script>
</body>
</html>`;

  const dashboardPath = 'test-results/test-dashboard.html';
  fs.writeFileSync(dashboardPath, html);
  
  console.log(`🎯 Dashboard created: ${dashboardPath}`);
  console.log(`📊 ${tests.length} test files organized`);
  
  return dashboardPath;
}

// Open dashboard in browser
const dashboardPath = generateDashboard();

import('child_process').then(({ exec }) => {
  const platform = process.platform;
  let command;
  
  if (platform === 'darwin') {
    command = `open "${dashboardPath}"`;
  } else if (platform === 'win32') {
    command = `start "${dashboardPath}"`;
  } else {
    command = `xdg-open "${dashboardPath}"`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.error(`Failed to open dashboard: ${error.message}`);
    } else {
      console.log(`🌐 Dashboard opened in browser`);
    }
  });
});
