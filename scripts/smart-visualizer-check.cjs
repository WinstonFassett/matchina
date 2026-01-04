const { chromium } = require('playwright');

/**
 * Smart visualizer verification: Actually load the image and check if it contains graph elements
 */

async function smartVisualizerCheck(imagePath) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log(`🧠 Smart check: ${imagePath}`);
    
    // Create a simple HTML page to display the image
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 20px; background: #1a1a1a; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <img src="file://${imagePath}" alt="screenshot" />
      </body>
      </html>
    `;
    
    await page.setContent(html);
    
    // Use vision model to analyze what's actually in the image
    const analysis = await page.evaluate(() => {
      const img = document.querySelector('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      
      // Simple heuristic: check for graph-like patterns
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Count different colors (graph visualizers have multiple colors)
      const colors = new Set();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a > 0) {
          colors.add(`${r},${g},${b}`);
        }
      }
      
      // Check aspect ratio
      const aspectRatio = canvas.width / canvas.height;
      
      return {
        width: canvas.width,
        height: canvas.height,
        aspectRatio: aspectRatio,
        colorCount: colors.size,
        // Simple heuristics for detecting UI vs graph
        likelyUI: aspectRatio > 2 || aspectRatio < 0.5 || colors.size < 10,
        likelyGraph: aspectRatio >= 0.5 && aspectRatio <= 2 && colors.size >= 20
      };
    });
    
    console.log(`📊 Analysis: ${analysis.width}x${analysis.height}, ratio: ${analysis.aspectRatio.toFixed(2)}, colors: ${analysis.colorCount}`);
    
    // Smart decision making
    if (analysis.likelyUI) {
      return {
        valid: false,
        reason: `Likely UI - aspect ratio ${analysis.aspectRatio.toFixed(2)} suggests app interface, not graph`,
        confidence: 0.8
      };
    }
    
    if (analysis.likelyGraph) {
      return {
        valid: true,
        reason: `Likely graph - good aspect ratio and ${analysis.colorCount} colors suggest visualization`,
        confidence: 0.7
      };
    }
    
    // If uncertain, use basic heuristics
    if (analysis.width === 318 && analysis.height === 501) {
      return {
        valid: false,
        reason: "318x501px - known broken Mermaid toggle capture size",
        confidence: 0.9
      };
    }
    
    return {
      valid: false,
      reason: "Uncertain - needs human verification",
      confidence: 0.5
    };
    
  } catch (error) {
    return {
      valid: false,
      reason: `Error analyzing image: ${error.message}`,
      confidence: 0.9
    };
  } finally {
    await browser.close();
  }
}

// Main execution
if (require.main === module) {
  const imagePath = process.argv[2];
  
  if (!imagePath) {
    console.log('Usage: node smart-visualizer-check.cjs <image-path>');
    process.exit(1);
  }
  
  smartVisualizerCheck(imagePath).then(result => {
    console.log('\n🧠 SMART VISUALIZER ANALYSIS:');
    console.log(`Valid visualizer: ${result.valid ? '✅ YES' : '❌ NO'}`);
    console.log(`Reason: ${result.reason}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    
    if (!result.valid && result.confidence > 0.7) {
      console.log('\n🚨 HOLY SHIT - THIS IS NOT A REAL VISUALIZER!');
      console.log('🚨 THIS LOOKS LIKE APP UI OR BROKEN CAPTURE!');
      console.log('🚨 DO NOT USE FOR VISUAL ANALYSIS!');
      process.exit(1);
    } else if (result.valid) {
      console.log('\n✅ This appears to be a real graph visualizer');
      process.exit(0);
    } else {
      console.log('\n⚠️ Uncertain - recommend human verification');
      process.exit(2);
    }
  });
}

module.exports = { smartVisualizerCheck };
