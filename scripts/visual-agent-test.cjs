#!/usr/bin/env node

/**
 * Visual Coding Agent Test Script
 * 
 * This script demonstrates the workflow:
 * 1. Capture screenshots from the running docs server
 * 2. Analyze them with local LLaVA model
 * 3. Provide structured feedback for layout improvements
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const DOCS_URL = 'http://localhost:4322/matchina/';
const SCREENSHOT_DIR = path.join(__dirname, '../review/screenshots');
const OLLAMA_MODEL = 'llava';

// Ensure screenshot directory exists
async function ensureDir() {
  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Capture screenshot using Playwright
async function captureScreenshot(pageUrl, filename) {
  return new Promise((resolve, reject) => {
    console.log(`📸 Capturing screenshot: ${filename}`);
    
    const playwright = spawn('npx', ['playwright', 'screenshot', pageUrl, filename], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    let output = '';
    playwright.stdout.on('data', (data) => {
      output += data.toString();
    });

    playwright.stderr.on('data', (data) => {
      console.error('Playwright error:', data.toString());
    });

    playwright.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Screenshot saved: ${filename}`);
        resolve(filename);
      } else {
        console.error(`❌ Failed to capture screenshot: ${output}`);
        reject(new Error(`Playwright exited with code ${code}`));
      }
    });
  });
}

// Analyze screenshot with LLaVA
async function analyzeScreenshot(imagePath) {
  return new Promise((resolve, reject) => {
    console.log(`🤖 Analyzing screenshot with ${OLLAMA_MODEL}...`);
    
    const prompt = `Analyze this graph layout screenshot and provide structured feedback:

1. **Node Overlaps**: Are any nodes overlapping each other? List specific examples if yes.
2. **Label Visibility**: Are all node and edge labels fully visible and readable?
3. **Layout Quality**: Rate the overall layout organization (Poor/Fair/Good/Excellent).
4. **Spacing**: Is there adequate spacing between nodes and edges?
5. **Specific Issues**: List any visual problems that need immediate attention.
6. **Recommendations**: Suggest concrete improvements for layout parameters.

Respond in JSON format:
{
  "overlaps": boolean,
  "labelsVisible": boolean, 
  "layoutQuality": "Poor|Fair|Good|Excellent",
  "spacing": "Poor|Fair|Good|Excellent",
  "issues": ["issue1", "issue2"],
  "recommendations": ["rec1", "rec2"]
}`;

    const ollama = spawn('ollama', ['run', OLLAMA_MODEL, prompt], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Send the image path to ollama's stdin
    ollama.stdin.write(imagePath);
    ollama.stdin.end();

    let output = '';
    ollama.stdout.on('data', (data) => {
      output += data.toString();
    });

    ollama.stderr.on('data', (data) => {
      console.error('Ollama error:', data.toString());
    });

    ollama.on('close', (code) => {
      if (code === 0) {
        try {
          // Try to extract JSON from the output
          const jsonMatch = output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            console.log('✅ Analysis complete:', analysis);
            resolve(analysis);
          } else {
            console.log('📝 Full analysis (no JSON found):', output);
            resolve({ rawOutput: output });
          }
        } catch (parseError) {
          console.log('📝 Raw analysis (JSON parse failed):', output);
          resolve({ rawOutput: output });
        }
      } else {
        console.error(`❌ Ollama exited with code ${code}`);
        reject(new Error(`Ollama analysis failed`));
      }
    });
  });
}

// Main workflow
async function runVisualAgentTest() {
  try {
    console.log('🚀 Starting Visual Coding Agent Test...\n');
    
    await ensureDir();
    
    // Test with ReactFlow examples
    const examples = [
      { url: `${DOCS_URL}examples/combobox`, name: 'combobox-reactflow' },
      { url: `${DOCS_URL}examples/hierarchical`, name: 'hierarchical-reactflow' },
      { url: `${DOCS_URL}examples/counter`, name: 'counter-reactflow' }
    ];
    
    for (const example of examples) {
      console.log(`\n📊 Testing: ${example.name}`);
      console.log(`URL: ${example.url}`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(SCREENSHOT_DIR, `${example.name}-${timestamp}.png`);
      
      try {
        // Capture screenshot
        await captureScreenshot(example.url, screenshotPath);
        
        // Wait a moment for the page to render
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Analyze with LLaVA
        const analysis = await analyzeScreenshot(screenshotPath);
        
        // Save analysis
        const analysisPath = screenshotPath.replace('.png', '-analysis.json');
        await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2));
        
        console.log(`💾 Analysis saved: ${analysisPath}\n`);
        
      } catch (error) {
        console.error(`❌ Failed to process ${example.name}:`, error.message);
      }
    }
    
    console.log('🎉 Visual Agent Test Complete!');
    console.log(`📁 Screenshots and analyses saved to: ${SCREENSHOT_DIR}`);
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runVisualAgentTest();
}

module.exports = { captureScreenshot, analyzeScreenshot, runVisualAgentTest };
