# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Quick Navigation

- **`AGENTS.md`** - Universal standard for all AI agents
- **`for-agents/`** - Agent-specific rules and commands
- **`for-agents/commands.md`** - Command reference
- **`for-devs/README.md`** - Project overview and navigation
- **`for-devs/project-overview.md`** - Detailed project information
- **`for-devs/feature-checklist.md`** - Feature development workflow
- **`README.md`** - E2E testing guide, strategies, Playwright usage

## Agent Documentation
For complete agent guidance, see **[AGENTS.md](./AGENTS.md)** - the universal standard for all AI agents.

## Development Documentation
For project overview, architecture, and development patterns, see **[for-devs/README.md](./for-devs/README.md)**.

## Claude-Specific Guidance

### Working with Claude Code
- **Focus on making things work** - User manages git/commits
- **Type safety first** - Never use `as any` or `@ts-ignore`
- **Test before finishing** - `npm test` must pass
- **Check `local/` for context** - Active task documents

### Commands for Claude
- **Development**: `npm run dev:docs` (docs server already running on 4321)
- **Testing**: `npm test` (when verifying changes)
- **Type checking**: `npm run test:types` (quick validation)
- **Build**: `npm run build:lib` (rarely needed)

### What NOT to Run
- **NEVER run `npm run dev*`** - Dev server already running
- **NEVER run full test suites** - User handles pre-push
- **NEVER manage git/commits** - User handles this

## Foundation First
1. **Start with `for-devs/README.md`** - Project context
2. **Check `for-devs/project-overview.md`** - What is Matchina
3. **Use `for-agents/`** - Agent-specific rules
4. **Check `local/`** - Task-specific context

