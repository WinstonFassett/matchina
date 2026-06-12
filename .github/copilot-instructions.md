# GitHub Copilot Instructions

## Quick Start
For complete agent documentation, see **[AGENTS.md](../AGENTS.md)** - the universal standard for all AI agents.

## Agent-Specific Files
- **`CLAUDE.md`** - Claude Code specific guidance

## Shared Documentation
- **`for-devs/README.md`** - Project overview, architecture, development patterns
- **`for-devs/feature-checklist.md`** - Feature development workflow
- **`README.md`** - E2E testing guide

## Foundation First
All agents should start with **`for-devs/README.md`** to understand the project context, then use **`for-agents/`** for agent-specific rules.

## Copilot-Specific Guidance

### Working with GitHub Copilot
- **Focus on making things work** - User manages git/commits
- **Type safety first** - Never use `as any` or `@ts-ignore`
- **Test before finishing** - `npm test` must pass
- **Check `local/` for context** - Active task documents

### Commands for Copilot
- **Development**: `npm run dev:docs` (docs server already running on 4321)
- **Testing**: `npm test` (when verifying changes)
- **Type checking**: `npm run test:types` (quick validation)
- **Build**: `npm run build:lib` (rarely needed)

### What NOT to Run
- **NEVER run `npm run dev*`** - Dev server already running
- **NEVER run full test suites** - User handles pre-push
- **NEVER manage git/commits** - User handles this

## File Patterns
- **Apply to**: `*.ts`, `*.tsx`, `*.js`, `*.jsx`
- **Focus on**: Type safety, no global instances, factory functions
- **Avoid**: `as any`, `@ts-ignore`, global state

## Foundation First
1. **Start with `for-devs/README.md`** - Project context
2. **Check `for-devs/project-overview.md`** - What is Matchina
3. **Use `for-agents/`** - Agent-specific rules
4. **Check `local/`** - Task-specific context
