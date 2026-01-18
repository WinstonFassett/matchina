# Agent Command Guidelines

## 🚨 CRITICAL: AGENTS NEVER RUN DEV SCRIPTS - EVER

**DEVELOPMENT SERVERS RUN FOREVER AND BLOCK AGENTS**

## ✅ AGENT-SAFE COMMANDS

### Primary Verification
- `npm test` - Run all tests with coverage
- `npm run test:types` - Fast type checking only  
- `npm run test-build` - Comprehensive validation (types + docs checks)

### Build Scripts (Use Sparingly)
- `npm run build` = `npm run build:lib` - Builds core library only
- `npm run build:all` - Builds library + docs (SLOW, avoid unless explicitly needed)
- `npm run build:lib` - Build core library only (explicit version)

## 🚫 FORBIDDEN COMMANDS (NEVER RUN)

### Development Servers (BLOCK AGENTS)
- `npm run dev` - Runs forever, blocks agent progress
- `npm run dev:docs` - Runs forever, blocks agent progress  
- `npm run dev:all` - Runs forever, blocks agent progress

### User-Only Commands
- `npm run release` - Release process (user only)
- `npm run publish` - Publish to npm (user only)
- `npm run dry-run` - Dry run release (user only)

## Key Points
- **User manages dev servers** - agents assume they're already running
- **Tests over builds** - prefer `npm test` for verification
- **Never run dev commands** - they will hang and require user intervention
- **Use `npm run test-build`** for comprehensive validation when needed
- **Use `npm run test:types`** for fast type verification

## Playwright Testing (When Needed)
```bash
npx playwright test --headed --timeout=5000    # Debug with console logs
npx playwright test --reporter=line             # Clean CI output
```

## Dev Server Hot Reloading
The Astro dev server automatically picks up upstream library rebuilds. Restarting is usually NOT necessary for changes to the matchina library - only for changes to the docs configuration or major dependency changes.

If playwright/browser tests fail because server isn't running, inform user - don't try to start it.

## AGENT BEHAVIORAL RULES

### Task Management
- **ALWAYS check backlog first** - `backlog task list --plain`
- **NEVER close tasks without completing ALL acceptance criteria**
- **CLAIM tasks properly** - `backlog task edit <id> -s "In Progress" -a @agent`
- **Complete ALL ACs before marking Done** - don't rush completion

### Communication
- **NEVER run dev commands** - this is non-negotiable
- **ALWAYS verify work with tests** - `npm test` before finishing
- **DON'T assume user context** - check what's actually needed
- **FOCUS on one task at a time** - don't close unrelated tasks

### Critical Mistakes to Avoid
- Running `npm run dev` (blocks everything)
- Closing tasks without completing all ACs
- Working on wrong task or assuming priorities
- Making up task IDs without checking backlog
