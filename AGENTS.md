# Agent Instructions for Matchina

This project uses **bd** (beads) for issue tracking. For development patterns, see `docs/DEVELOPMENT.md`.

## Agent Documentation Map

**All agent guidance documents:**
- **`AGENTS.md`** (this file) - Session workflow, beads usage, testing, dev servers
- **`CLAUDE.md`** - Project overview, architecture, build system
- **`docs/DEVELOPMENT.md`** - Development patterns, example structure, path aliases
- **`docs/FEATURE-CHECKLIST.md`** - Feature development reference
- **`docs/AGENTS.md`** - Docs-specific patterns (Astro, MDX)

## ⚠️ CRITICAL: Type Inference Principles

**Matchina's entire purpose is type-safe state machines with full type inference. NEVER break this with casts or workarounds.**

### Cardinal Rules

1. **NEVER declare transitions as a variable** - Always pass transitions inline as a direct argument to `createMachine`/`createFlatMachine`
   ```typescript
   // ❌ WRONG - Breaks type inference
   const transitions = { ... };
   const machine = createMachine(states, transitions, "Initial");

   // ✅ CORRECT - Preserves type inference
   const machine = createMachine(states, {
     Initial: { event: "Next" },
     Next: { ...}
   }, "Initial");
   ```

2. **NEVER use `as any` or `@ts-ignore` in machine creation** - This destroys the type safety that is the library's core value

3. **NEVER work around type errors with casts** - Fix the root cause in the type signatures instead

4. **States should also be inline or const-declared** - For best type inference, pass states directly or declare with `const states = defineStates({...})`

If you encounter type errors, the solution is to fix the type definitions, NOT to cast them away.

## Quick Reference

**Focus: Get next SINGLE work item or list all open work.**

```bash
bd ready              # Show issues ready to work (no blockers)
bd list --status=open # List all open issues
bd show <id>          # View specific issue details
bd update <id> --status=in_progress  # Claim work
bd close <id>         # Complete work
bd sync --flush-only  # Export to JSONL
```

### Finding Work (Task-Oriented)

```bash
# Get next available work item
bd ready

# See everything open
bd list --status=open

# View specific issue with dependencies
bd show <issue-id>

# JSON output for parsing (if needed)
bd ready --json | jq '.[0]'
bd show <issue-id> --json
```

## Beads Ticket Organization

### Methodology

This project uses a **two-tier ticket structure** for managing complex, multi-branch work:

**Long-running ancestor tickets** - Persist across branches for continuity:
- **Context/Plan tickets** (label: `plan`, type: `epic`) - Branch organization, work stream mapping
- **Review tickets** (label: `review`, type: `task`) - Detailed findings, cross-cutting concerns
- **Documentation tickets** (label: `doc`) - Persistent reference material

**Shorter-lived work tickets** - Scoped to specific implementations:
- **Epics** (type: `epic`, optional label: `v2` for breaking changes) - Major feature areas
- **Features/Tasks/Bugs** (type: `feature|task|bug`) - Concrete work items

### Branch Planning Reference

**System of record**: [matchina-19: Branch Plan Epic](http://localhost:3000/#/board?issue=matchina-19)
- Catchall for branch organization context
- Contains work stream dependency graph
- Living document updated as branches are created/merged
- **Use `bd show matchina-19` for current branch planning context**

**Filesystem artifact**: `review/BRANCH_PLAN.md`
- Historical artifact, may not exist
- Used as draft area before syncing to bd
- Beads ticket is source of truth, not this file

### Labeling Strategy

- `v2` - Breaking release work (HSM is primary driver)
- `plan` - Branch/work stream planning
- `review` - Cross-cutting review findings
- `doc` - Reference documentation

### Dependency Pattern

**Work items usually link to organizing areas** (epics, plans) but this is NOT a blocker:
- Can create work tickets independently and groom dependencies iteratively
- Long-running tickets (plan/review) typically depend on work epics
- Work tickets depend on each other based on implementation order
- Don't block on perfect organization—refine as you go

## Development Servers

**CRITICAL: Do NOT run dev servers from agents.**

- **ASSUME dev server is already running** - Developer pilots both agent and dev server
- Don't check if running, don't try to start
- If puppeteer/browser tests fail due to server not running:
  - Inform user that dev server needs to be running
  - Do NOT attempt to start it yourself

**User runs:**
```bash
npm run dev              # Vitest watch (core library)
npm --workspace docs run dev  # Astro dev server (docs at localhost:4321)
```

## Testing Requirements

**All bugs and features REQUIRE testing for completion:**

1. **Unit tests (preferred)** - `/test` with Vitest
   - If comprehensive unit tests exist, manual testing may not be required
   - Test both type inference and runtime behavior

2. **Interactive UX (requires manual or automated browser testing)**
   - User must test manually in browser, OR
   - Use puppeteer for automated screenshot/interaction review

3. **Puppeteer setup (review/e2e, not test/e2e)**
   - Available for screenshot-based review
   - Started with specific examples, can be expanded
   - Located in `review/` for visual review, not formal e2e tests

4. **React Testing Library (future)**
   - Preferred for React component testing
   - Not set up yet - track as potential improvement

**Bottom line:** Work is not complete without tests. Prefer unit tests. For UI, assume user tests manually or you use puppeteer.

## Development Resources

- `docs/DEVELOPMENT.md` - Example patterns, path aliases, testing
- `docs/FEATURE-CHECKLIST.md` - Feature addition reference
- `docs/AGENTS.md` - Docs-specific patterns (Astro, MDX)
- `review/` - Living review and planning workspace

**Focus:** Make things work. Tests pass, UI works (manually tested or puppeteer).


## Commands

**Agents can run:**
```bash
npm run dev              # Vitest watch mode (for testing)
npm test                 # Run all tests
npm run build:lib        # Build core library (common, relatively fast)
```

**User runs (agents assume running):**
```bash
npm --workspace docs run dev    # Astro dev server at localhost:4321
npm run build:docs              # Build docs (SLOW, VERBOSE - user runs when needed)
```

**Key points:**
- Agents do NOT run dev servers - assume they're running
- Building docs is slow - prefer live testing in dev server
- build:lib is fine for agents to run when needed

## Session Completion

When finishing work on an issue:

```bash
# Update beads state
bd close <id1> <id2> ...    # Close completed issues
bd sync --flush-only         # Export to JSONL
```

**Note:** User manages git, staging, commits, and branches. Focus on making things work.

## Troubleshooting Philosophy

**When bugs appear in examples:**
1. Check if problem reproduces in core library
2. If yes → pivot to `/test`, write failing test, fix in `/src`
3. If no → fix in example code

Evidence > assumptions. Let tests guide the fix.

## Quality Gates

**When to run:**
- Tests: Always when working in core (`npm run dev` for watch mode)
- Manual browser testing: For interactive UX (or use puppeteer via dev server)
- build:lib: When needed to verify library builds correctly
- build:docs: Rarely - user runs when needed (prefer live dev server testing)
- Linting: Only right before shipping (skip during development)

**Verbose output handling:**
- Docs commands (dev, build, check) are notoriously verbose
- Pipe to files/buffers, read in reverse (last 10-20 lines first)
- Don't naively pipe all output to yourself

**Safety:**
- Never destroy work (we have git)
- Do NOT do hard resets 


## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until committed.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **COMMIT** - Use conventional commits and do NOT mention AI or tooling used
5. **Clean up** - Remove any working docs, debug logging in code
6. **Verify** - All changes committed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until tested and committed
