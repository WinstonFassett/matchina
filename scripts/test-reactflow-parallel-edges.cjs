#!/usr/bin/env node

/**
 * Test ReactFlow Parallel Edge Implementation
 * Uses Ollama for visual validation of the new curvature algorithm
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../review/screenshots');

// Playwright script to test ReactFlow parallel edges
const TEST_SCRIPT = `
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing ReactFlow Parallel Edge Implementation...');
    
    // Navigate to toggle example
    await page.goto('http://localhost:4321/matchina/examples/toggle');
    await page.waitForSelector('.machine-visualizer', { timeout: 5000 });
    
    // Switch to ReactFlow visualizer
    const picker = await page.$('[data-testid="visualizer-picker"]');
    if (picker) {
      await picker.selectOption('reactflow');
      await page.waitForTimeout(1000);
    }
    
    // Wait for ReactFlow to load
    await page.waitForSelector('.react-flow__node', { timeout: 3000 });
    
    console.log('✅ ReactFlow loaded');
    
    // Capture screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = \`reactflow-parallel-edges-test-\${timestamp}.png\`;
    const filepath = '${SCREENSHOT_DIR}/' + filename;
    
    // Focus on the main content area (visualizer + app)
    const contentArea = await page.$('.machine-visualizer > div:last-child');
    if (contentArea) {
      await contentArea.screenshot({ path: filepath });
      console.log(\`✅ Screenshot saved: \${filename}\`);
      console.log(\`📸 Screenshot path: \${filepath}\`);
    } else {
      console.log('❌ Could not find content area for screenshot');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
`;

// Analyze screenshot with Ollama
function analyzeWithOllama(imagePath) {
  return new Promise((resolve, reject) => {
    console.log(`🎨 Analyzing ReactFlow parallel edges with Ollama...`);
    
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
        console.log('✅ Ollama analysis complete');
        console.log('📊 Analysis output:');
        console.log(output);
        resolve({ success: true, output, stderr });
      } else {
        console.error('❌ Ollama failed:', stderr);
        reject(new Error(`Ollama failed with code ${code}`));
      }
    });
    
    // Send the analysis prompt
    const prompt = \`
Analyze this ReactFlow visualization for parallel edge quality.

Focus on:
1. **Parallel Edge Separation**: Are the toggle->off and toggle->on edges properly separated?
2. **Edge Curvature**: Do the edges use different curvatures (-0.8 vs +0.8)?
3. **Visual Clarity**: Can you distinguish between parallel transitions?
4. **Edge Overlap**: Is there any edge overlap or collision?

Rate the parallel edge quality from 1-10 and provide specific feedback on what works and what needs improvement.
\`;
    
    ollama.stdin.write(prompt);
    ollama.stdin.end();
  });
}

// Run the test
async function runParallelEdgeTest() {
  console.log('🔍 Starting ReactFlow Parallel Edge Test...');
  
  try {
    // Step 1: Capture screenshot
    console.log('📸 Step 1: Capturing ReactFlow screenshot...');
    
    const screenshotPath = await new Promise((resolve, reject) => {
      const child = spawn('node', ['-e', TEST_SCRIPT], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text.trim());
      });

      child.stderr.on('data', (data) => {
        console.error('Error:', data.toString());
      });

      child.on('close', (code) => {
        if (code === 0) {
          // Extract screenshot path from output
          const pathMatch = output.match(/Screenshot path: (.+\.png)/);
          if (pathMatch) {
            resolve(pathMatch[1]);
          } else {
            reject(new Error('Could not find screenshot path'));
          }
        } else {
          reject(new Error(\`Test failed with code \${code}\`));
        }
      });
    });
    
    console.log(\`📸 Screenshot captured: \${screenshotPath}\`);
    
    // Step 2: Analyze with Ollama
    console.log('🧠 Step 2: Analyzing with Ollama...');
    const analysis = await analyzeWithOllama(screenshotPath);
    
    console.log('🎉 ReactFlow Parallel Edge Test Complete!');
    
    // Step 3: Save analysis results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultPath = path.join(__dirname, '../review', \`reactflow-parallel-test-\${timestamp}.json\`);
    
    const result = {
      timestamp: new Date().toISOString(),
      test: 'reactflow-parallel-edges',
      screenshot: screenshotPath,
      analysis: analysis.output,
      success: true
    };
    
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    console.log(\`📋 Results saved: \${resultPath}\`);
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runParallelEdgeTest().catch(console.error);
}

module.exports = { runParallelEdgeTest };
