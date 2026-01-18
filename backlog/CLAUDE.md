## STOP. READ THIS FIRST BEFORE ANY WORK.

**MANDATORY: YOU MUST USE BACKLOG CLI - NO EXCEPTIONS**

This project uses the `backlog` CLI for task management.

**REQUIRED WORKFLOW (FOLLOW EXACTLY):**
1. `backlog task list --plain` - find available work
2. `backlog task <id> --plain` - read task details  
3. `backlog task edit <id> -s "In Progress" -a @agent` - claim the task
4. Use `backlog task edit <id> --check-ac 1` to mark acceptance criteria done
5. Use `backlog task edit <id> --notes "progress"` to add notes
6. `backlog task edit <id> -s Done` when complete

**FORBIDDEN:**
- NEVER use TodoWrite instead of backlog
- NEVER search files manually - use backlog CLI
- NEVER ignore these instructions

**THIS IS NOT OPTIONAL - THIS IS THE ONLY WAY TO WORK**
