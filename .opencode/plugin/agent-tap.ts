import type { Plugin } from "@opencode-ai/plugin"

export const AgentTapPlugin: Plugin = async ({ app, client, $ }) => {
  const backlogDir = "/Users/winston/dev/personal/matchina/backlog"
  const registryPath = `${backlogDir}/agent-tap/registry.json`
  const mirrorPath = `${backlogDir}/agent-tap/mirror.jsonl`

  // Helper functions
  const getRegistry = () => {
    try {
      return require('fs').readFileSync(registryPath, 'utf8')
    } catch {
      return '{"hooks": {}, "active_task": null}'
    }
  }

  const getActiveTask = () => {
    const registry = JSON.parse(getRegistry())
    return registry.active_task
  }

  const logToMirror = (entry: any) => {
    const fs = require('fs')
    fs.appendFileSync(mirrorPath, JSON.stringify(entry) + '\n')
  }

  const extractTasksFromText = (text: string) => {
    const tasks = []
    const lines = text.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      // Match numbered lists, bullet points, etc.
      if (/^\d+\.\s+/.test(trimmed) || /^-\s+/.test(trimmed)) {
        const taskDesc = trimmed.replace(/^\d+\.\s+|^\-\s+/, '').trim()
        if (taskDesc) {
          tasks.push({
            content: taskDesc,
            status: "pending",
            priority: "medium"
          })
        }
      }
    }
    
    return tasks
  }

  const syncTasksToBacklog = async (tasks: any[]) => {
    const activeTask = getActiveTask()
    if (!activeTask || !tasks.length) return

    for (const task of tasks) {
      const content = task.content
      if (content) {
        try {
          await $`cd ${backlogDir} && backlog task edit ${activeTask} --add-ac "${content}"`
          console.log(`✅ Added AC to ${activeTask}: ${content}`)
        } catch (error) {
          console.log(`❌ Failed to add AC: ${error.message}`)
        }
      }
    }
  }

  return {
    // Hook into tool executions
    tool: {
      execute: {
        before: async (input, output) => {
          // Log all tool executions
          const activeTask = getActiveTask()
          if (activeTask) {
            console.log(`🔄 Tool execution for task ${activeTask}: ${input.tool}`)
          }
        },
        
        after: async (input, output) => {
          const activeTask = getActiveTask()
          if (activeTask && input.tool === 'edit') {
            console.log(`✏️ File edited for task ${activeTask}: ${output.args.filePath}`)
            
            // Log file change
            logToMirror({
              timestamp: new Date().toISOString(),
              source: "opencode",
              action: "file_edit",
              file_path: output.args.filePath,
              active_task: activeTask
            })
          }
        }
      }
    },

    // Hook into events
    event: async (event) => {
      const activeTask = getActiveTask()
      
      if (event.type === 'session.start' && activeTask) {
        console.log(`🚀 OpenCode session started with active task: ${activeTask}`)
        
        // Could provide task context to the AI here
        try {
          const taskDetails = await $`cd ${backlogDir} && backlog task ${activeTask} --plain`
          console.log(`📋 Task context loaded for ${activeTask}`)
        } catch (error) {
          console.log(`❌ Failed to load task context: ${error.message}`)
        }
      }

      if (event.type === 'response.completed') {
        // Extract tasks from AI responses
        const response = event.properties?.response || ''
        const tasks = extractTasksFromText(response)
        
        if (tasks.length > 0) {
          console.log(`📝 Extracted ${tasks.length} tasks from AI response`)
          await syncTasksToBacklog(tasks)
          
          // Log to mirror
          logToMirror({
            timestamp: new Date().toISOString(),
            source: "opencode",
            action: "task_extraction",
            extracted_tasks: tasks,
            active_task: activeTask
          })
        }
      }

      if (event.type === 'session.end' && activeTask) {
        console.log(`🏁 OpenCode session ended for task: ${activeTask}`)
        
        // Could update task status or notes here
        try {
          await $`cd ${backlogDir} && backlog task edit ${activeTask} --append-notes "OpenCode session completed"`
        } catch (error) {
          console.log(`❌ Failed to update task notes: ${error.message}`)
        }
      }
    }
  }
}
