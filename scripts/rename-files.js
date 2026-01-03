#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

/**
 * Smart file renaming script
 * Usage: node rename-files.js [--dry-run] [directory]
 * 
 * --dry-run: Show what would be renamed without doing it
 * directory: Directory to scan (default: review)
 */

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const targetDir = args.find(arg => !arg.startsWith('--')) || 'review'

// File renaming mapping
const renameMap = {
  // ALL_CAPS to Title Case or snake_case
  'TESTING_ANALYSIS_REPORT.md': 'Testing Analysis Report.md',
  'AUTH_FLOW_REDESIGN.md': 'Auth Flow Redesign.md',
  'COMMIT_ANALYSIS_REPORT.md': 'Commit Analysis Report.md',
  'DOCS_BUILD_FIXES_REVIEW.md': 'Docs Build Fixes Review.md',
  'EDGE_CASE_ANALYSIS.md': 'Edge Case Analysis.md',
  'EXAMPLE_ELEGANCE_AUDIT.md': 'Example Elegance Audit.md',
  'FORCEGRAPH_TECH_DESIGN.md': 'ForceGraph Tech Design.md',
  'FORCE_GRAPH_COMPARISON.md': 'Force Graph Comparison.md',
  'HIERARCHICAL_FORCE_GRAPH_IMPLEMENTATION.md': 'Hierarchical ForceGraph Implementation.md',
  'HIERARCHICAL_FORCE_GRAPH_OPTIONS.md': 'Hierarchical ForceGraph Options.md',
  'HIERARCHICAL_FORCE_GRAPH_RESEARCH.md': 'Hierarchical ForceGraph Research.md',
  'HSM_BRANCH_PRE_FINAL_REVIEW.md': 'HSM Branch Pre Final Review.md',
  'HSM_RECURSION_ANALYSIS.md': 'HSM Recursion Analysis.md',
  'HSM_RECURSION_ISSUE.md': 'HSM Recursion Issue.md',
  'LAYOUT_PANEL_TESTING.md': 'Layout Panel Testing.md',
  'LAYOUT_QUALITY_ASSESSMENT.md': 'Layout Quality Assessment.md',
  'MERMAID_CSS_ARCHITECTURE_ANALYSIS.md': 'Mermaid CSS Architecture Analysis.md',
  'MERMAID_DESIGN_SPEC.md': 'Mermaid Design Spec.md',
  'MERMAID_FLOWCHART_FIX.md': 'Mermaid Flowchart Fix.md',
  'MERMAID_INSPECTOR_800_LINE_ANALYSIS.md': 'Mermaid Inspector 800 Line Analysis.md',
  'MERMAID_STYLING_ENHANCEMENTS_SPEC.md': 'Mermaid Styling Enhancements Spec.md',
  'NESTED_TRANSITION_NORMALIZATION.md': 'Nested Transition Normalization.md',
  'PER_EXAMPLE_OPTIMIZATION.md': 'Per Example Optimization.md',
  'PHASE1_3_READY_FOR_TESTING.md': 'Phase 1-3 Ready for Testing.md',
  'PULL_REQUEST_REVIEW.md': 'Pull Request Review.md',
  'REACTFLOW_LAYOUT_RESEARCH.md': 'ReactFlow Layout Research.md',
  'SHAPE_SYSTEM_ANALYSIS.md': 'Shape System Analysis.md',
  'STATE_IDENTIFIER_ANALYSIS.md': 'State Identifier Analysis.md',
  'TESTING_COMMANDS.md': 'Testing Commands.md',
  'THEME_IMPLEMENTATION_GUIDE.md': 'Theme Implementation Guide.md',
  'TYPE_INFERENCE_DEVELOPMENT_GUIDE.md': 'Type Inference Development Guide.md',
  'TYPE_INFERENCE_ISSUES.md': 'Type Inference Issues.md',
  'UNIFIED_VISUALIZER_IMPLEMENTATION.md': 'Unified Visualizer Implementation.md',
  'VISUALIZER_ARCHITECTURE_EVOLUTION.md': 'Visualizer Architecture Evolution.md',
  'VISUALIZER_ROOT_CAUSE_FIX.md': 'Visualizer Root Cause Fix.md',
  'VISUALIZER_STATUS_SNAPSHOT.md': 'Visualizer Status Snapshot.md',
  'VISUALIZER_STRATEGY_SUMMARY.md': 'Visualizer Strategy Summary.md',
  'VIZ_COLOR_SCHEME_RESEARCH.md': 'Viz Color Scheme Research.md',
  'DEVELOPMENT_WORKSPACE_ORGANIZATION.md': 'Development Workspace Organization.md',
  
  // Archive files - keep date prefix but clean up the rest
  '20251230-DESIGN_REVIEW_AND_SANITY_CHECK.md': '20251230-Design Review and Sanity Check.md',
  '20251230-ENTRY_POINT_NEXT_SESSION.md': '20251230-Entry Point Next Session.md',
  '20251230-FINAL_ALL_VISUALIZERS_STATUS.md': '20251230-Final All Visualizers Status.md',
  '20251230-HANDOFF_TO_PARALLEL_AGENT.md': '20251230-Handoff to Parallel Agent.md',
  '20251230-PHASE1_2_3_COMPLETE.md': '20251230-Phase 1-2-3 Complete.md',
  '20251230-PHASE1_ELK_DEBUG_TRACE.md': '20251230-Phase 1 ELK Debug Trace.md',
  '20251230-PHASE1_IMPLEMENTATION_SUMMARY.md': '20251230-Phase 1 Implementation Summary.md',
  '20251230-PHASE2_PORTAL_DEBUG_TRACE.md': '20251230-Phase 2 Portal Debug Trace.md',
  '20251230-PHASE3_HSM_HIGHLIGHT_DEBUG_TRACE.md': '20251230-Phase 3 HSM Highlight Debug Trace.md',
  '20251230-REACTFLOW_ADAPTATION_PLAN.md': '20251230-ReactFlow Adaptation Plan.md',
  '20251230-REACTFLOW_FIXES.md': '20251230-ReactFlow Fixes.md',
  '20251230-REACTFLOW_NEXT_STEPS.md': '20251230-ReactFlow Next Steps.md',
  '20251230-REACTFLOW_PHASE_ABC_COMPLETE.md': '20251230-ReactFlow Phase ABC Complete.md',
  '20251230-REACTFLOW_TECH_DESIGN.md': '20251230-ReactFlow Tech Design.md',
  '20251230-SCREENSHOT_VIEWER_README.md': '20251230-Screenshot Viewer README.md',
  '20251230-STACKING.md': '20251230-Stacking.md',
  '20251230-YOUR_NEXT_STEPS.md': '20251230-Your Next Steps.md'
}

function updateFileLinks(filePath, oldName, newName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Update markdown links: [text](old-name.md) -> [text](new-name.md)
    const linkRegex = new RegExp(`\\[([^\\]]+)\\]\\(${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g')
    let updatedContent = content.replace(linkRegex, `[$1](${newName})`)
    
    // Update markdown links: [text](./old-name.md) -> [text](./new-name.md)
    const linkRegexWithPath = new RegExp(`\\[([^\\]]+)\\]\\(\\.${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g')
    updatedContent = updatedContent.replace(linkRegexWithPath, `[$1](./${newName})`)
    
    // Update markdown links: [text](../old-name.md) -> [text](../new-name.md)
    const linkRegexWithParentPath = new RegExp(`\\[([^\\]]+)\\]\\(\\.\\.${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g')
    updatedContent = updatedContent.replace(linkRegexWithParentPath, `[$1](../${newName})`)
    
    // Update plain text references
    const textRegex = new RegExp(oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    updatedContent = updatedContent.replace(textRegex, newName)
    
    if (updatedContent !== content) {
      if (!dryRun) {
        fs.writeFileSync(filePath, updatedContent)
      }
      return true
    }
    return false
  } catch (error) {
    console.error(`Error updating links in ${filePath}:`, error.message)
    return false
  }
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`)
    return
  }
  
  console.log(`🔍 Scanning ${dir} for files to rename...`)
  if (dryRun) console.log(`🔍 DRY RUN MODE - No files will be renamed`)
  
  const renameOperations = []
  const linkUpdates = []
  
  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      
      if (entry.isDirectory() && !entry.name.startsWith('.' && entry.name !== 'screenshots')) {
        scan(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const oldName = entry.name
        if (renameMap[oldName]) {
          const newName = renameMap[oldName]
          const oldPath = fullPath
          const newPath = path.join(path.dirname(oldPath), newName)
          
          renameOperations.push({ oldPath, newPath, oldName, newName })
        }
      }
    }
  }
  
  scan(dir)
  
  if (renameOperations.length === 0) {
    console.log('No files to rename.')
    return
  }
  
  console.log(`\n📝 Found ${renameOperations.length} files to rename:`)
  renameOperations.forEach(({ oldName, newName }) => {
    console.log(`   ${oldName} → ${newName}`)
  })
  
  // Find all markdown files to update links
  const allMarkdownFiles = []
  function collectMarkdownFiles(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        collectMarkdownFiles(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        allMarkdownFiles.push(fullPath)
      }
    }
  }
  collectMarkdownFiles(dir)
  
  if (!dryRun) {
    console.log(`\n🔄 Updating links in ${allMarkdownFiles.length} markdown files...`)
    
    // Update all links before renaming files
    renameOperations.forEach(({ oldName, newName }) => {
      allMarkdownFiles.forEach(filePath => {
        if (updateFileLinks(filePath, oldName, newName)) {
          linkUpdates.push({ filePath, oldName, newName })
        }
      })
    })
    
    console.log(`✅ Updated links in ${linkUpdates.length} files`)
    
    // Now rename the files
    console.log(`\n📁 Renaming files...`)
    renameOperations.forEach(({ oldPath, newPath, oldName, newName }) => {
      try {
        fs.renameSync(oldPath, newPath)
        console.log(`   ✅ Renamed: ${oldName} → ${newName}`)
      } catch (error) {
        console.error(`   ❌ Failed to rename ${oldName}:`, error.message)
      }
    })
  } else {
    console.log(`\n🔍 DRY RUN: Would update links in ${allMarkdownFiles.length} files`)
    console.log(`🔍 DRY RUN: Would rename ${renameOperations.length} files`)
  }
  
  console.log(`\n📈 Summary: ${renameOperations.length} files renamed, ${linkUpdates.length} link updates`)
}

// Run the script
scanDirectory(targetDir)
