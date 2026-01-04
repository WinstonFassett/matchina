#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const BEADS_DB_PATH = path.join(process.cwd(), '.beads', 'issues.jsonl');
const OUTPUT_PATH = path.join(process.cwd(), 'review', 'beads-report.md');

// Color mapping for Mermaid with soft pastel colors and rounded corners
const STATUS_COLORS = {
  'open': '#FFE5CC',    // Soft peach
  'in_progress': '#E8F5E8',  // Light mint green
  'blocked': '#FFE5F1',   // Soft pink
  'closed': '#E5F3FF',   // Light sky blue
  'ready': '#FFF9E5'     // Soft lemon
};

const BORDER_COLORS = {
  'open': '#FFB366',    // Peach border
  'in_progress': '#90EE90',  // Mint border
  'blocked': '#FFB6C1',   // Pink border
  'closed': '#87CEEB',   // Sky blue border
  'ready': '#F0E68C'     // Lemon border
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
    task.status === 'blocked' ||
    task.status === 'ready'
  );
}

function getTaskShortTitle(title, maxLength = 30) {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
}

function getTaskIdShort(id) {
  const parts = id.split('-');
  return parts[parts.length - 1]; // Get the last part after hyphen
}

function buildDependencyGraph(tasks) {
  const taskMap = new Map();
  const tasksWithDeps = new Set();
  
  // Create map of all tasks
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [], dependencies: [] });
  });
  
  // Build dependency relationships
  tasks.forEach(task => {
    const taskWithDeps = taskMap.get(task.id);
    
    // Parse dependencies from JSON data
    if (task.dependencies && Array.isArray(task.dependencies)) {
      task.dependencies.forEach(dep => {
        if (dep.depends_on_id && taskMap.has(dep.depends_on_id)) {
          const depTask = taskMap.get(dep.depends_on_id);
          taskWithDeps.dependencies.push(depTask);
          tasksWithDeps.add(task.id);
          tasksWithDeps.add(dep.depends_on_id);
        }
      });
    }
    
    // Parse dependents from JSON data (reverse dependencies)
    if (task.dependents && Array.isArray(task.dependents)) {
      task.dependents.forEach(dep => {
        if (dep.id && taskMap.has(dep.id)) {
          const dependentTask = taskMap.get(dep.id);
          dependentTask.dependencies.push(taskWithDeps);
          tasksWithDeps.add(task.id);
          tasksWithDeps.add(dep.id);
        }
      });
    }
  });
  
  // Filter to only tasks with dependency relationships
  const filteredTasks = Array.from(taskMap.values()).filter(task => 
    tasksWithDeps.has(task.id)
  );
  
  return filteredTasks;
}

function generateMermaidDiagram(tasks) {
  const dependencyTasks = buildDependencyGraph(tasks);
  
  let mermaid = '```mermaid\ngraph TD\n';
  mermaid += '    %% Task Dependency Overview - Birds Eye View\n';
  mermaid += '    %% Soft pastel colors with rounded corners for readability\n';
  mermaid += '    %% Click nodes to jump to task details\n\n';
  
  if (dependencyTasks.length === 0) {
    mermaid += '    Open["📋 Open Tasks\\lNo dependencies found"]\n';
    mermaid += '    style Open fill:#FFF9E5,stroke:#F0E68C,stroke-width:2px,color:#495057,rx:10,ry:10\n';
    mermaid += '```\n\n';
    return mermaid;
  }
  
  // Group tasks by top-level dependencies
  const rootTasks = dependencyTasks.filter(task => 
    !dependencyTasks.some(other => 
      other.dependencies.some(dep => dep.id === task.id)
    )
  );
  
  function addTaskToDiagram(task, visited = new Set()) {
    if (visited.has(task.id)) return;
    visited.add(task.id);
    
    const taskId = getTaskIdShort(task.id);
    const shortTitle = getTaskShortTitle(task.title, 25); // Shorter titles
    const color = STATUS_COLORS[task.status] || STATUS_COLORS.open;
    const borderColor = BORDER_COLORS[task.status] || BORDER_COLORS.open;
    const statusEmoji = STATUS_EMOJIS[task.status] || '📋';
    
    // Clean title for mermaid (remove problematic chars)
    const cleanTitle = shortTitle.replace(/["'\[\]{}()]/g, '').replace(/\.\.\.$/, '');
    
    // Add node with rounded corners and pastel colors
    mermaid += `    ${taskId}["${statusEmoji} ${cleanTitle}\\l${taskId}"]\n`;
    mermaid += `    style ${taskId} fill:${color},stroke:${borderColor},stroke-width:2px,color:#495057,rx:8,ry:8\n`;
    mermaid += `    click ${taskId} "#task-${taskId}" "View ${taskId} details"\n\n`;
    
    // Add dependency edges
    task.dependencies.forEach(depTask => {
      const depId = getTaskIdShort(depTask.id);
      mermaid += `    ${depId} --> ${taskId}\n`;
      addTaskToDiagram(depTask, visited);
    });
  }
  
  // Add all root tasks (will cascade to dependencies)
  rootTasks.forEach(task => {
    addTaskToDiagram(task);
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
  const stats = {
    total: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
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
  summary += `| 🔄 In Progress | ${stats.in_progress} |\n`;
  summary += `| 🚫 Blocked | ${stats.blocked} |\n`;
  summary += `| **Total Active** | **${stats.total}** |\n\n`;
  
  // Priority table
  summary += '| Priority | Count |\n';
  summary += '|----------|-------|\n';
  summary += `| 🔴 P0 (Critical) | ${stats.byPriority.P0} |\n`;
  summary += `| 🟠 P1 (High) | ${stats.byPriority.P1} |\n`;
  summary += `| 🟡 P2 (Medium) | ${stats.byPriority.P2} |\n`;
  summary += `| 🟢 P3 (Low) | ${stats.byPriority.P3} |\n\n`;
  
  return summary;
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
  
  report += generateMermaidDiagram(openTasks);
  report += generateMarkdownTree(openTasks);
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
