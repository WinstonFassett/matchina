#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Update markdown files with modification date frontmatter
 * Usage: node update-frontmatter-dates.js [--dry-run] [directory]
 * 
 * --dry-run: Show what would be changed without modifying files
 * directory: Directory to scan (default: review)
 */

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const targetDir = args.find(arg => !arg.startsWith('--')) || 'review';

function getFileModTime(filePath) {
  // Git dates when available, filesystem dates when not in git
  try {
    // Check if file is tracked in git
    execSync(`git ls-files "${filePath}"`, { encoding: 'utf8', stdio: 'pipe' });
    // If we get here, file is tracked in git
    try {
      const gitDate = execSync(`git log -1 --format="%ci" "${filePath}"`, { encoding: 'utf8' }).trim();
      return gitDate ? new Date(gitDate).toISOString().split('T')[0] : null;
    } catch (gitError) {
      // Git tracked but no commit history
      const stats = fs.statSync(filePath);
      return stats.mtime.toISOString().split('T')[0];
    }
  } catch (notTrackedError) {
    // File not in git, use filesystem date
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString().split('T')[0];
  }
}

function getFileCreateTime(filePath) {
  // Git creation date when available, filesystem dates when not in git
  try {
    // Check if file is tracked in git
    execSync(`git ls-files "${filePath}"`, { encoding: 'utf8', stdio: 'pipe' });
    // If we get here, file is tracked in git
    try {
      const gitDate = execSync(`git log --follow --format="%ci" "${filePath}" | tail -1`, { encoding: 'utf8' }).trim();
      return gitDate ? new Date(gitDate).toISOString().split('T')[0] : null;
    } catch (gitError) {
      // Git tracked but no commit history
      const stats = fs.statSync(filePath);
      return stats.birthtime.toISOString().split('T')[0];
    }
  } catch (notTrackedError) {
    // File not in git, use filesystem date
    const stats = fs.statSync(filePath);
    return stats.birthtime.toISOString().split('T')[0];
  }
}

function updateFileFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const modDate = getFileModTime(filePath);
    const createDate = getFileCreateTime(filePath);
    
    if (!modDate) return { updated: false, reason: 'No modification date available' };
    
    let newContent = content;
    const hasFrontmatter = content.startsWith('---');
    
    // Extract H1 title for consistency
    const h1Match = content.match(/^#\s+(.+)$/m);
    const h1Title = h1Match ? h1Match[1].trim() : null;
    
    if (hasFrontmatter) {
      // File already has frontmatter
      const frontmatterEnd = content.indexOf('---', 3);
      if (frontmatterEnd === -1) return { updated: false, reason: 'Invalid frontmatter' };
      
      const frontmatter = content.slice(3, frontmatterEnd);
      const body = content.slice(frontmatterEnd + 3);
      
      // Check if dates already exist and are current
      const existingDate = frontmatter.match(/date:\s*(.+)/)?.[1]?.trim();
      const existingCreated = frontmatter.match(/created:\s*(.+)/)?.[1]?.trim();
      const existingTitle = frontmatter.match(/title:\s*(.+)/)?.[1]?.trim();
      
      const needsDateUpdate = existingDate !== modDate;
      const needsCreatedUpdate = !existingCreated || existingCreated !== createDate;
      const needsTitleUpdate = h1Title && existingTitle !== h1Title;
      
      if (!needsDateUpdate && !needsCreatedUpdate && !needsTitleUpdate) {
        return { updated: false, reason: 'Dates and title already current' };
      }
      
      // Update frontmatter
      let updatedFrontmatter = frontmatter;
      
      if (needsDateUpdate) {
        if (frontmatter.includes('date:')) {
          updatedFrontmatter = updatedFrontmatter.replace(/date:\s*.*/m, `date: ${modDate}`);
        } else {
          updatedFrontmatter = updatedFrontmatter.trim() + `\ndate: ${modDate}`;
        }
      }
      
      if (needsCreatedUpdate) {
        if (frontmatter.includes('created:')) {
          updatedFrontmatter = updatedFrontmatter.replace(/created:\s*.*/m, `created: ${createDate}`);
        } else {
          updatedFrontmatter = updatedFrontmatter.trim() + `\ncreated: ${createDate}`;
        }
      }
      
      if (needsTitleUpdate && h1Title) {
        if (frontmatter.includes('title:')) {
          updatedFrontmatter = updatedFrontmatter.replace(/title:\s*.*/m, `title: "${h1Title}"`);
        } else {
          updatedFrontmatter = updatedFrontmatter.trim() + `\ntitle: "${h1Title}"`;
        }
      }
      
      newContent = `---${updatedFrontmatter}---${body}`;
    } else {
      // No frontmatter, add it
      const title = h1Title || path.basename(filePath, '.md')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      newContent = `---
title: "${title}"
date: ${modDate}
created: ${createDate}
---

${content}`;
    }
    
    return { updated: newContent !== content, newContent, oldContent: content, modDate, createDate };
  } catch (error) {
    return { updated: false, reason: error.message };
  }
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    return;
  }
  
  console.log(`🔍 Scanning ${dir} for markdown files...`);
  console.log(`📅 Using git dates when tracked, filesystem dates when not in git`);
  if (dryRun) console.log(`🔍 DRY RUN MODE - No files will be modified`);
  
  const results = [];
  let total = 0;
  
  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        total++;
        const result = updateFileFrontmatter(fullPath);
        result.filePath = fullPath;
        results.push(result);
      }
    }
  }
  
  scan(dir);
  
  console.log(`\n📊 Results for ${total} files:`);
  
  const updated = results.filter(r => r.updated);
  const skipped = results.filter(r => !r.updated);
  
  if (updated.length > 0) {
    console.log(`\n✅ Would update ${updated.length} files:`);
    updated.forEach(result => {
      const relativePath = path.relative(process.cwd(), result.filePath);
      console.log(`   ${relativePath} -> ${result.modDate} (created: ${result.createDate})`);
    });
  }
  
  if (skipped.length > 0) {
    console.log(`\n⏭️  Skipping ${skipped.length} files:`);
    skipped.forEach(result => {
      const relativePath = path.relative(process.cwd(), result.filePath);
      console.log(`   ${relativePath} (${result.reason})`);
    });
  }
  
  if (!dryRun && updated.length > 0) {
    console.log(`\n� Writing ${updated.length} files...`);
    updated.forEach(result => {
      fs.writeFileSync(result.filePath, result.newContent);
      const relativePath = path.relative(process.cwd(), result.filePath);
      console.log(`   ✅ Updated: ${relativePath}`);
    });
  }
  
  console.log(`\n📈 Summary: ${updated.length}/${total} files would be updated`);
  
  if (updated.length > 0 && !dryRun) {
    console.log('💡 Tip: VitePress sidebar will now sort by date (newest first)');
  }
}

// Run the script
scanDirectory(targetDir);
