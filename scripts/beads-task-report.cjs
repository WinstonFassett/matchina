#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const BEADS_DB_PATH = path.join(process.cwd(), '.beads', 'issues.jsonl');
const OUTPUT_PATH = path.join(process.cwd(), 'review', 'beads-report.md');

// Color mapping for Mermaid with intuitive, status-appropriate colors
const STATUS_COLORS = {
  'open': '#FFF3CD',      // Light yellow - needs work, ready to start
  'in_progress': '#CCE5FF', // Light blue - actively being worked on
  'blocked': '#F8D7DA',   // Light red - problem, needs attention
  'closed': '#E5F3FF',    // Light sky blue - completed (not shown in report)
  'ready': '#D4EDDA'      // Light green - ready for review, positive state
};

const BORDER_COLORS = {
  'open': '#FFC107',      // Yellow border - needs work
  'in_progress': '#007BFF', // Blue border - active work
  'blocked': '#DC3545',   // Red border - problem
  'closed': '#87CEEB',    // Sky blue border - completed (not shown in report)
  'ready': '#28A745'      // Green border - ready state
};

// Status emojis
const STATUS_EMOJIS = {
  'open': '📋',
  'in_progress': '🔄',
  'blocked': '🚫',
  'closed': '✅',
  'ready': '⏳'
};

function loadBeadsData() {
  try {
    const data = fs.readFileSync(BEADS_DB_PATH, 'utf8');
    const lines = data.trim().split('\n');
    return lines.map(line => JSON.parse(line));
  } catch (error) {
    console.error('Error loading beads data:', error.message);
    return [];
  }
}

function getOpenTasks() {
  const allTasks = loadBeadsData();
  return allTasks.filter(task => 
    task.status === 'open' || 
    task.status === 'in_progress' || 
    task.status === 'deferred'
  );
}

function getTaskShortTitle(title, maxLength = 40) {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
}

function getTaskIdShort(id) {
  const parts = id.split('-');
  const lastPart = parts[parts.length - 1];
  // Convert to simple alphanumeric to avoid parsing issues
  return 'node' + lastPart.replace(/[^a-zA-Z0-9]/g, '');
}

function validateMermaidSyntax(mermaid) {
  // Basic mermaid syntax validation - only catch actual syntax errors
  const lines = mermaid.split('\n');
  const errors = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('%%') || line === '```mermaid' || line === '```') {
      continue;
    }
    
    // Check for malformed node definitions - only check for quotes issues
    if (line.includes('[') && line.includes(']')) {
      const nodeMatch = line.match(/(\w+)\["([^"]*)"\]/);
      if (nodeMatch) {
        const nodeId = nodeMatch[1];
        const nodeText = nodeMatch[2];
        
        // Only check for problematic characters that break parsing
        if (nodeText.includes('"') || nodeText.includes("'") || nodeText.includes('[') || nodeText.includes(']')) {
          errors.push(`Line ${i + 1}: Node "${nodeId}" has parsing-breaking characters: "${nodeText}"`);
        }
      }
    }
    
    // Check for malformed subgraph definitions - only check for quotes issues
    if (line.startsWith('subgraph')) {
      const subgraphMatch = line.match(/subgraph\s+(\w+)\["([^"]*)"\]/);
      if (subgraphMatch) {
        const subgraphId = subgraphMatch[1];
        const subgraphText = subgraphMatch[2];
        
        // Only check for problematic characters that break parsing
        if (subgraphText.includes('"') || subgraphText.includes("'") || subgraphText.includes('[') || subgraphText.includes(']')) {
          errors.push(`Line ${i + 1}: Subgraph "${subgraphId}" has parsing-breaking characters: "${subgraphText}"`);
        }
      }
    }
    
    // Check for malformed links
    if (line.includes('-->')) {
      const linkMatch = line.match(/(\w+)\s*-->\s*(\w+)/);
      if (!linkMatch) {
        errors.push(`Line ${i + 1}: Malformed link: ${line}`);
      }
    }
  }
  
  return errors;
}

function cleanTitleForMermaid(title) {
  return title
    .replace(/["'\[\]{}()]/g, '') // Only remove problematic characters
    .replace(/\.\.\.$/, '')
    .trim();
}

function formatTitleForMermaid(title, maxLength = 15) {
  if (title.length <= maxLength) return title;
  
  // Split title into words and add line breaks
  const words = title.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    if ((currentLine + ' ' + word).length > maxLength) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is too long, break it
        lines.push(word.substring(0, maxLength));
        currentLine = word.substring(maxLength);
      }
    } else {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  // Join with line breaks
  return lines.join('<br/>');
}

function buildDependencyGraph(tasks) {
  // Only work with open tasks, not all tasks
  const openTasks = tasks; // tasks is already filtered by getOpenTasks()
  const taskMap = new Map();
  const tasksWithDeps = new Set();
  
  // Create map of only open tasks
  openTasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [], dependencies: [] });
  });
  
  // Build dependency relationships only between open tasks
  openTasks.forEach(task => {
    const taskWithDeps = taskMap.get(task.id);
    
    // Parse dependencies from JSON data (what this task depends on - points down)
    if (task.dependencies && Array.isArray(task.dependencies)) {
      task.dependencies.forEach(dep => {
        // Only include dependencies that are also open tasks
        if (dep.depends_on_id && taskMap.has(dep.depends_on_id)) {
          const depTask = taskMap.get(dep.depends_on_id);
          taskWithDeps.dependencies.push(depTask);
          tasksWithDeps.add(task.id);
          tasksWithDeps.add(dep.depends_on_id);
        }
      });
    }
    
    // Parse dependents from JSON data (what depends on this task - points up to this task)
    // We handle this separately, not as dependencies of this task
  });
  
  // Filter to only open tasks with dependency relationships
  const filteredTasks = Array.from(taskMap.values()).filter(task => 
    tasksWithDeps.has(task.id)
  );
  
  return filteredTasks;
}

function generateMermaidDiagram(tasks) {
  const dependencyTasks = buildDependencyGraph(tasks);
  
  let mermaid = '```mermaid\ngraph TD\n';
  mermaid += '    %% Task Dependency Overview - Birds Eye View\n';
  mermaid += '    %% Top-to-Down: Big things at top, arrows point down to dependents\n';
  mermaid += '    %% Soft pastel colors with rounded corners for readability\n\n';
  
  if (dependencyTasks.length === 0) {
    mermaid += '    Open["Open Tasks\\lNo dependencies found"]\n';
    mermaid += '    style Open fill:#FFF9E5,stroke:#F0E68C,stroke-width:2px,color:#495057,rx:10,ry:10\n';
    mermaid += '```\n\n';
    return mermaid;
  }
  
  // Simple approach: just add all tasks and their dependencies
  const visited = new Set();
  
  function addTaskToDiagram(task, level = 0) {
    if (visited.has(task.id)) return;
    visited.add(task.id);
    
    const taskId = getTaskIdShort(task.id);
    const shortTitle = getTaskShortTitle(task.title, 25);
    const cleanTitle = cleanTitleForMermaid(shortTitle);
    const color = STATUS_COLORS[task.status] || STATUS_COLORS.open;
    const borderColor = BORDER_COLORS[task.status] || BORDER_COLORS.open;
    
    // Add node
    mermaid += `    ${taskId}["${cleanTitle}"]\n`;
    mermaid += `    style ${taskId} fill:${color},stroke:${borderColor},stroke-width:2px,color:#495057,rx:8,ry:8\n\n`;
    
    // Add dependency edges (dependent --> dependency, pointing down in TD layout)
    task.dependencies.forEach(depTask => {
      const depId = getTaskIdShort(depTask.id);
      mermaid += `    ${taskId} --> ${depId}\n`;
      addTaskToDiagram(depTask);
    });
  }
  
  // Add all tasks
  dependencyTasks.forEach(task => {
    addTaskToDiagram(task);
  });
  
  mermaid += '```\n\n';
  return mermaid;
}

function generateSubgraphDiagram(dependencyTasks, visited) {
  let mermaid = '```mermaid\ngraph TD\n';
  mermaid += '    %% Task Dependency Overview - Birds Eye View\n';
  mermaid += '    %% Top-to-Bottom: Big things up top, arrows point down to dependencies\n';
  mermaid += '    %% Soft pastel colors with rounded corners for readability\n';
  mermaid += '    %% Parent-child relationships shown as nested subgraphs\n\n';
  
  // Group tasks by top-level dependencies
  const rootTasks = dependencyTasks.filter(task => 
    !dependencyTasks.some(other => 
      other.dependencies.some(dep => dep.id === task.id)
    )
  );
  
  // Track which tasks are children of parents
  const childTasks = new Set();
  const parentChildMap = new Map();
  const subgraphDefinitions = new Map();
  
  // Identify parent-child relationships - ONLY for actual epics
  dependencyTasks.forEach(task => {
    if (task.issue_type === 'epic') {
      // Find tasks that depend on this epic
      const children = dependencyTasks.filter(other => 
        other.dependencies.some(dep => dep.id === task.id) &&
        other.id !== task.id
      );
      if (children.length > 0) {
        parentChildMap.set(task.id, children);
        children.forEach(child => {
          childTasks.add(child.id);
        });
        
        // Store subgraph definition for later
        const taskId = getTaskIdShort(task.id);
        const shortTitle = getTaskShortTitle(task.title, 20);
        const cleanTitle = cleanTitleForMermaid(shortTitle);
        const color = STATUS_COLORS[task.status] || STATUS_COLORS.open;
        const borderColor = BORDER_COLORS[task.status] || BORDER_COLORS.open;
        
        let subgraphDef = `    subgraph ${taskId}["${cleanTitle}"]\n`;
        subgraphDef += `        ${taskId}_parent["${cleanTitle}"]\n`;
        subgraphDef += `        style ${taskId}_parent fill:${color},stroke:${borderColor},stroke-width:2px,color:#495057,rx:8,ry:8\n\n`;
        
        children.forEach(child => {
          const childId = getTaskIdShort(child.id);
          const childTitle = getTaskShortTitle(child.title, 12);
          const childCleanTitle = cleanTitleForMermaid(childTitle);
          const childColor = STATUS_COLORS[child.status] || STATUS_COLORS.open;
          const childBorderColor = BORDER_COLORS[child.status] || BORDER_COLORS.open;
          
          subgraphDef += `        ${childId}_child["${childCleanTitle}"]\n`;
          subgraphDef += `        style ${childId}_child fill:${childColor},stroke:${childBorderColor},stroke-width:2px,color:#495057,rx:8,ry:8\n\n`;
        });
        
        subgraphDef += `    end\n\n`;
        subgraphDefinitions.set(task.id, subgraphDef);
      }
    }
  });
  
  function addTaskToDiagram(task, visitedLocal, insideSubgraph = false, parentTitle = '') {
    if (visitedLocal.has(task.id)) return;
    visitedLocal.add(task.id);
    
    const taskId = getTaskIdShort(task.id);
    const shortTitle = getTaskShortTitle(task.title, 20); // Shorter titles
    const color = STATUS_COLORS[task.status] || STATUS_COLORS.open;
    const borderColor = BORDER_COLORS[task.status] || BORDER_COLORS.open;
    
    // Clean title for mermaid (remove problematic chars)
    const cleanTitle = cleanTitleForMermaid(shortTitle);
    
    // Check if this is a parent with children
    const children = parentChildMap.get(task.id);
    if (children && children.length > 0 && !insideSubgraph) {
      // Subgraph already defined above, just add dependencies
      task.dependencies.forEach(depTask => {
        if (!children.some(child => child.id === depTask.id)) {
          const depId = getTaskIdShort(depTask.id);
          const depNodeId = parentChildMap.has(depTask.id) ? `${depId}_parent` : depId;
          mermaid += `    ${taskId}_parent --> ${depNodeId}\n`;
          addTaskToDiagram(depTask, visitedLocal);
        }
      });
    } else {
      // Regular task (child or standalone)
      const nodeId = insideSubgraph ? `${taskId}_child` : taskId;
      // No parent prefix needed - subgraph already shows the relationship
      
      mermaid += `${insideSubgraph ? '        ' : '    '}${nodeId}["${cleanTitle}"]\n`;
      mermaid += `${insideSubgraph ? '        ' : '    '}style ${nodeId} fill:${color},stroke:${borderColor},stroke-width:2px,color:#495057,rx:8,ry:8\n\n`;
      
      // Add dependency edges (dependent --> dependency, pointing down to parent)
      task.dependencies.forEach(depTask => {
        const depId = getTaskIdShort(depTask.id);
        const depNodeId = parentChildMap.has(depTask.id) ? `${depId}_parent` : depId;
        mermaid += `${insideSubgraph ? '        ' : '    '}${nodeId} --> ${depNodeId}\n`;
        addTaskToDiagram(depTask, visitedLocal);
      });
    }
  }
  
  // First, add all subgraph definitions
  Array.from(subgraphDefinitions.values()).forEach(def => {
    mermaid += def;
  });
  
  // Then add all root tasks (will cascade to dependencies)
  rootTasks.forEach(task => {
    if (!childTasks.has(task.id)) { // Skip if it's already handled as a child
      addTaskToDiagram(task, visited);
    }
  });
  
  // Add any remaining dependencies that weren't handled in subgraphs
  dependencyTasks.forEach(task => {
    if (!visited.has(task.id)) {
      addTaskToDiagram(task, visited);
    }
  });
  
  mermaid += '```\n\n';
  return mermaid;
}

function generateSimpleDiagram(dependencyTasks, visited) {
  let mermaid = '```mermaid\ngraph TD\n';
  mermaid += '    %% Task Dependency Overview - Birds Eye View\n';
  mermaid += '    %% Top-to-Bottom: Big things up top, arrows point down to dependencies\n';
  mermaid += '    %% Soft pastel colors with rounded corners for readability\n\n';
  
  // Group tasks by top-level dependencies
  const rootTasks = dependencyTasks.filter(task => 
    !dependencyTasks.some(other => 
      other.dependencies.some(dep => dep.id === task.id)
    )
  );
  
  function addTaskToDiagram(task, visitedLocal) {
    if (visitedLocal.has(task.id)) return;
    visitedLocal.add(task.id);
    
    const taskId = getTaskIdShort(task.id);
    const shortTitle = getTaskShortTitle(task.title, 25);
    const cleanTitle = cleanTitleForMermaid(shortTitle);
    const color = STATUS_COLORS[task.status] || STATUS_COLORS.open;
    const borderColor = BORDER_COLORS[task.status] || BORDER_COLORS.open;
    
    // Add node
    mermaid += `    ${taskId}["${cleanTitle}"]\n`;
    mermaid += `    style ${taskId} fill:${color},stroke:${borderColor},stroke-width:2px,color:#495057,rx:8,ry:8\n\n`;
    
    // Add dependency edges
    task.dependencies.forEach(depTask => {
      const depId = getTaskIdShort(depTask.id);
      mermaid += `    ${taskId} --> ${depId}\n`;
      addTaskToDiagram(depTask, visitedLocal);
    });
  }
  
  // Add all root tasks (will cascade to dependencies)
  rootTasks.forEach(task => {
    addTaskToDiagram(task, visited);
  });
  
  mermaid += '```\n\n';
  return mermaid;
}

function generateMarkdownTree(tasks) {
  const dependencyTasks = buildDependencyGraph(tasks);
  
  let markdown = '## Task Overview\n\n';
  
  if (dependencyTasks.length === 0) {
    markdown += '*No tasks with dependency relationships found.*\n\n';
    return markdown;
  }
  
  function addTaskToTree(task, level = 0, visited = new Set()) {
    if (visited.has(task.id)) return;
    visited.add(task.id);
    
    const indent = '  '.repeat(level);
    const statusEmoji = STATUS_EMOJIS[task.status] || '📋';
    const taskId = getTaskIdShort(task.id);
    const beadsUrl = `http://localhost:3000/#/board?issue=matchina-${taskId}`;
    
    // Lead with title, not ID
    markdown += `${indent}- ${statusEmoji} [${task.title}](${beadsUrl}) \`${taskId}\`\n`;
    
    // Add dependent tasks (nested)
    task.dependencies.forEach(depTask => {
      addTaskToTree(depTask, level + 1, visited);
    });
  }
  
  // Find root tasks (those that aren't dependencies of others)
  const rootTasks = dependencyTasks.filter(task => 
    !dependencyTasks.some(other => 
      other.dependencies.some(dep => dep.id === task.id)
    )
  );
  
  rootTasks.forEach(task => {
    addTaskToTree(task);
  });
  
  return markdown;
}

function generateSummaryStats(tasks) {
  // Use the actual beads command logic
  const { execSync } = require('child_process');
  
  try {
    // Get ready tasks count (use --limit to get all)
    const readyOutput = execSync('bd ready --limit 50', { encoding: 'utf8', cwd: process.cwd() });
    const readyCount = readyOutput.includes('issues with no blockers') ? 
      parseInt(readyOutput.match(/(\d+)\s+issues with no blockers/)?.[1] || '0') : 0;
    
    // Get blocked tasks count (leave blocked alone since it doesn't support limit)
    const blockedOutput = execSync('bd blocked', { encoding: 'utf8', cwd: process.cwd() });
    const blockedCount = blockedOutput.includes('Blocked issues') ? 
      parseInt(blockedOutput.match(/Blocked issues\s*\((\d+)\)/)?.[1] || '0') : 0;
    
    // Extract unique task IDs from ready and blocked lists
    const readyTaskIds = [];
    const readyLines = readyOutput.split('\n').filter(line => line.includes('['));
    readyLines.forEach(line => {
      const match = line.match(/\[(.+?)\]/);
      if (match) readyTaskIds.push(match[1]);
    });
    
    const blockedTaskIds = [];
    const blockedLines = blockedOutput.split('\n').filter(line => line.includes('['));
    blockedLines.forEach(line => {
      const match = line.match(/\[(.+?)\]/);
      if (match) blockedTaskIds.push(match[1]);
    });
    
    // Calculate unique counts (no double counting)
    const openTasks = tasks.filter(t => t.status === 'open');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    
    // Ready tasks are subset of open tasks
    const openNotReady = openTasks.filter(t => !readyTaskIds.includes(t.id));
    
    // Blocked tasks can be from both open and in_progress
    const inProgressNotBlocked = inProgressTasks.filter(t => !blockedTaskIds.includes(t.id));
    
    const stats = {
      total: readyCount + inProgressNotBlocked.length + blockedCount,
      open: openNotReady.length,
      in_progress: inProgressNotBlocked.length,
      ready: readyCount,
      blocked: blockedCount,
      byPriority: {
        P0: tasks.filter(t => t.priority === 0).length,
        P1: tasks.filter(t => t.priority === 1).length,
        P2: tasks.filter(t => t.priority === 2).length,
        P3: tasks.filter(t => t.priority === 3).length,
      }
    };
    
    let summary = '## Summary Statistics\n\n';
    
    // Status table
    summary += '| Status | Count |\n';
    summary += '|--------|-------|\n';
    summary += `| 📋 Open | ${stats.open} |\n`;
    summary += `| 📋 Ready | ${stats.ready} |\n`;
    summary += `| 🔄 In Progress | ${stats.in_progress} |\n`;
    summary += `| 🚫 Blocked | ${stats.blocked} |\n`;
    summary += '| **Total Active** | **' + stats.total + '** |\n\n';
    
    // Priority table
    summary += '| Priority | Count |\n';
    summary += '|----------|-------|\n';
    summary += `| 🔴 P0 (Critical) | ${stats.byPriority.P0} |\n`;
    summary += `| 🟠 P1 (High) | ${stats.byPriority.P1} |\n`;
    summary += `| 🟡 P2 (Medium) | ${stats.byPriority.P2} |\n`;
    summary += `| 🟢 P3 (Low) | ${stats.byPriority.P3} |\n\n`;
    
    return summary;
  } catch (error) {
    console.error('Error getting beads stats:', error.message);
    // Fallback to simple counts
    const stats = {
      total: tasks.length,
      open: tasks.filter(t => t.status === 'open').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      ready: 0,
      blocked: 0,
      byPriority: {
        P0: tasks.filter(t => t.priority === 0).length,
        P1: tasks.filter(t => t.priority === 1).length,
        P2: tasks.filter(t => t.priority === 2).length,
        P3: tasks.filter(t => t.priority === 3).length,
      }
    };
    
    let summary = '## Summary Statistics\n\n';
    summary += '| Status | Count |\n';
    summary += '|--------|-------|\n';
    summary += `| 📋 Open | ${stats.open} |\n`;
    summary += `| 📋 Ready | ${stats.ready} |\n`;
    summary += `| 🔄 In Progress | ${stats.in_progress} |\n`;
    summary += `| 🚫 Blocked | ${stats.blocked} |\n`;
    summary += `| **Total Active** | **${stats.total}** |\n\n`;
    
    return summary;
  }
}

function generateReport() {
  console.log('🔍 Fetching open beads tasks...');
  const openTasks = getOpenTasks();
  
  if (openTasks.length === 0) {
    console.log('✨ No open tasks found!');
    return;
  }
  
  console.log(`📊 Found ${openTasks.length} open tasks`);
  
  // Generate report sections - DIAGRAM FIRST for birds eye view
  const timestamp = new Date().toISOString().split('T')[0];
  let report = `# Beads Task Report - ${timestamp}\n\n`;
  
  // Generate mermaid diagram
  const mermaidDiagram = generateMermaidDiagram(openTasks);
  
  // Validate mermaid syntax before adding to report
  const validationErrors = validateMermaidSyntax(mermaidDiagram);
  if (validationErrors.length > 0) {
    console.error('❌ Mermaid syntax validation failed:');
    validationErrors.forEach(error => {
      console.error(`   ${error}`);
    });
    
    // Fall back to simple diagram if validation fails
    report += `## Task Dependency Overview\n\n`;
    report += `⚠️ **Mermaid diagram generation failed due to syntax errors.**\n\n`;
    report += `**Validation Errors:**\n`;
    validationErrors.forEach(error => {
      report += `- ${error}\n`;
    });
    report += `\n## Task Overview\n\n`;
  } else {
    report += mermaidDiagram;
  }
  
  // Generate markdown tree
  report += generateMarkdownTree(openTasks);
  
  // Generate summary table
  report += generateSummaryStats(openTasks);
  
  // Write report
  const reportDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_PATH, report);
  console.log(`✅ Report generated: ${OUTPUT_PATH}`);
  console.log(`📈 ${openTasks.length} tasks processed`);
}

// Run the report generation
if (require.main === module) {
  generateReport();
}

module.exports = { generateReport, getOpenTasks };
