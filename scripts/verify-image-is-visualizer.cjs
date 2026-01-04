const fs = require('fs');
const { exec } = require('child_process');

/**
 * Basic intelligence check: Is this actually a graph visualization or just app UI?
 */

function checkImageBasicIntelligence(filepath) {
  try {
    // Get file info
    const stats = fs.statSync(filepath);
    const fileSizeKB = stats.size / 1024;
    
    console.log(`🔍 Checking: ${filepath}`);
    console.log(`📊 File size: ${fileSizeKB.toFixed(1)}KB`);
    
    // Basic red flags
    if (fileSizeKB < 1) {
      return {
        valid: false,
        reason: "File too small - probably broken icon or magnifying glass",
        confidence: 0.9
      };
    }
    
    if (fileSizeKB < 5) {
      return {
        valid: false, 
        reason: "Very small file - likely app UI instead of visualizer",
        confidence: 0.7
      };
    }
    
    // Get dimensions using file command
    return new Promise((resolve) => {
      exec(`file "${filepath}"`, (error, stdout, stderr) => {
        if (error) {
          resolve({
            valid: false,
            reason: "Cannot read image dimensions",
            confidence: 0.8
          });
          return;
        }
        
        const match = stdout.match(/(\d+)\s*x\s*(\d+)/);
        if (!match) {
          resolve({
            valid: false,
            reason: "Cannot parse image dimensions",
            confidence: 0.8
          });
          return;
        }
        
        const width = parseInt(match[1]);
        const height = parseInt(match[2]);
        
        console.log(`📏 Dimensions: ${width}x${height}`);
        
        // Dimension-based intelligence
        if (width < 100 || height < 100) {
          resolve({
            valid: false,
            reason: `Dimensions too small (${width}x${height}) - probably icon or magnifying glass`,
            confidence: 0.9
          });
          return;
        }
        
        if (width === 14 && height === 15) {
          resolve({
            valid: false,
            reason: "Exactly 14x15px - classic broken Mermaid magnifying glass",
            confidence: 0.95
          });
          return;
        }
        
        // Check for app UI dimensions
        if ((width === 1280 && height === 720) || (width === 652 && height === 401)) {
          resolve({
            valid: false,
            reason: `Typical app UI dimensions (${width}x${height}) - probably full page instead of visualizer`,
            confidence: 0.6
          });
          return;
        }
        
        // Good visualizer dimensions
        if ((width >= 300 && width <= 400) && (height >= 400 && height <= 600)) {
          resolve({
            valid: true,
            reason: `Good focused visualizer dimensions (${width}x${height})`,
            confidence: 0.8
          });
          return;
        }
        
        if (width >= 1000 && height >= 2000) {
          resolve({
            valid: true,
            reason: `Large dimensions (${width}x${height}) - likely full page with content`,
            confidence: 0.7
          });
          return;
        }
        
        // Unknown dimensions - needs human check
        resolve({
          valid: false,
          reason: `Unusual dimensions (${width}x${height}) - needs human verification`,
          confidence: 0.5
        });
      });
    });
    
  } catch (error) {
    return {
      valid: false,
      reason: "Cannot read file - probably broken",
      confidence: 0.9
    };
  }
}

// Main execution
if (require.main === module) {
  const filepath = process.argv[2];
  
  if (!filepath) {
    console.log('Usage: node verify-image-is-visualizer.cjs <image-path>');
    process.exit(1);
  }
  
  checkImageBasicIntelligence(filepath).then(result => {
    console.log('\n🤖 BASIC INTELLIGENCE ANALYSIS:');
    console.log(`Valid visualizer: ${result.valid ? '✅ YES' : '❌ NO'}`);
    console.log(`Reason: ${result.reason}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    
    if (!result.valid) {
      console.log('\n🚨 HOLY SHIT - THIS IS NOT A VISUALIZER!');
      console.log('🚨 DO NOT USE THIS IMAGE FOR VISUAL ANALYSIS!');
      process.exit(1);
    } else {
      console.log('\n✅ This looks like a real visualizer - proceed with analysis');
      process.exit(0);
    }
  });
}

module.exports = { checkImageBasicIntelligence };
