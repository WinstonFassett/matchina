#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Archive script - moves files to review/.archive with date prefix and removes from git
 * Usage: node archive-from-git.js file1.md file2.md ...
 */

const today = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
const archiveDir = 'review/.archive';

function archiveFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return false;
  }

  // Ensure archive directory exists
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  const fileName = path.basename(filePath);
  const archivedPath = path.join(archiveDir, `${today}-${fileName}`);
  
  try {
    // Move file to archive
    fs.renameSync(filePath, archivedPath);
    console.log(`Archived: ${filePath} -> ${archivedPath}`);
    
    // Remove from git
    try {
      execSync(`git rm ${filePath}`, { stdio: 'inherit' });
      console.log(`Removed from git: ${filePath}`);
    } catch (error) {
      console.log(`Note: ${filePath} was not tracked by git`);
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to archive ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
const files = process.argv.slice(2);
if (files.length === 0) {
  console.log('Usage: node archive-from-git.js file1.md file2.md ...');
  process.exit(1);
}

console.log(`Archiving ${files.length} file(s) with date ${today}...`);

let successCount = 0;
files.forEach(file => {
  if (archiveFile(file)) {
    successCount++;
  }
});

console.log(`\nArchive complete: ${successCount}/${files.length} files archived`);

if (successCount > 0) {
  console.log('\nNext steps:');
  console.log('1. Review the changes: git status');
  console.log('2. Commit when ready: git commit -m "Archive docs..."');
}
