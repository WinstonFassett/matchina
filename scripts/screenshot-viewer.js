#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Screenshot viewing and comparison tool
 */

const SCREENSHOT_DIRS = [
  'test-results',
  'test/e2e/visual/*.spec.ts-snapshots',
  'test/e2e/functional/*.spec.ts-snapshots',
  'review/screenshots',
  '.playwright-mcp'
];

function findScreenshots() {
  const screenshots = [];
  
  SCREENSHOT_DIRS.forEach(dir => {
    if (dir.includes('*.spec.ts-snapshots')) {
      const specFiles = fs.readdirSync('test/e2e/visual').filter(f => f.endsWith('.spec.ts'));
      specFiles.forEach(specFile => {
        const snapshotDir = `test/e2e/visual/${specFile}-snapshots`;
        if (fs.existsSync(snapshotDir)) {
          const files = fs.readdirSync(snapshotDir).filter(f => f.endsWith('.png'));
          files.forEach(file => {
            screenshots.push({
              path: path.join(snapshotDir, file),
              type: 'snapshot',
              test: specFile,
              size: fs.statSync(path.join(snapshotDir, file)).size
            });
          });
        }
      });
    } else if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
      files.forEach(file => {
        screenshots.push({
          path: path.join(dir, file),
          type: dir.includes('test-results') ? 'test-result' : dir.includes('review') ? 'review' : 'mcp',
          size: fs.statSync(path.join(dir, file)).size
        });
      });
    }
  });
  
  return screenshots.sort((a, b) => b.size - a.size);
}

function generateScreenshotReport() {
  const screenshots = findScreenshots();
  
  console.log('📸 Screenshot Report');
  console.log('==================');
  console.log(`Total screenshots: ${screenshots.length}`);
  console.log('');
  
  // Group by type
  const byType = screenshots.reduce((acc, shot) => {
    acc[shot.type] = (acc[shot.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('By Type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log('');
  
  // Show recent screenshots by type
  console.log('Recent Screenshots by Type:');
  console.log('');
  
  ['snapshot', 'review', 'mcp', 'test-result'].forEach(type => {
    const typeShots = screenshots.filter(s => s.type === type);
    if (typeShots.length > 0) {
      console.log(`${type.toUpperCase()} (${typeShots.length}):`);
      typeShots.slice(0, 5).forEach((shot, i) => {
        const sizeKB = (shot.size / 1024).toFixed(1);
        const filename = path.basename(shot.path);
        console.log(`  ${i + 1}. ${filename} (${sizeKB}KB)`);
      });
      console.log('');
    }
  });
  
  return screenshots;
}

function openScreenshot(screenshotPath) {
  import('child_process').then(({ exec }) => {
    const platform = process.platform;
    
    let command;
    if (platform === 'darwin') {
      command = `open "${screenshotPath}"`;
    } else if (platform === 'win32') {
      command = `start "${screenshotPath}"`;
    } else {
      command = `xdg-open "${screenshotPath}"`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to open screenshot: ${error.message}`);
      } else {
        console.log(`✅ Opened: ${path.basename(screenshotPath)}`);
      }
    });
  }).catch(err => {
    console.error(`Failed to import child_process: ${err.message}`);
  });
}

// CLI interface
const args = process.argv.slice(2);

if (args.length === 0) {
  const screenshots = generateScreenshotReport();
  
  console.log('🎯 What to do with these screenshots:');
  console.log('');
  console.log('Open specific screenshot:');
  console.log('  npm run screenshots open <name>');
  console.log('');
  console.log('Browse directories:');
  console.log('  open test/e2e/visual/all-visualizers-complete.spec.ts-snapshots/');
  console.log('  open review/screenshots/');
  console.log('  open .playwright-mcp/');
  console.log('');
  console.log('HTML report (test context):');
  console.log('  npm run screenshots:html');
  
} else if (args[0] === 'open' && args[1]) {
  const screenshots = findScreenshots();
  const target = screenshots.find(s => s.path.includes(args[1]));
  
  if (target) {
    openScreenshot(target.path);
  } else {
    console.log(`Screenshot not found containing: ${args[1]}`);
    console.log('Available screenshots:');
    screenshots.slice(0, 10).forEach(s => console.log(`  ${path.basename(s.path)}`));
  }
} else {
  console.log('Usage:');
  console.log('  npm run screenshots              # Show this report');
  console.log('  npm run screenshots open <name>  # Open specific screenshot');
}