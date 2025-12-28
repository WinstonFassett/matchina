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

## Backward Compatibility

**DO NOT worry about backward compatibility unless explicitly instructed.**

This is a major version development - no need to maintain legacy APIs or deprecated functions.

- Remove deprecated code instead of keeping it for compatibility
- Use new API names without aliasing old ones
- Do not add "legacy" or "deprecated" comments unless specifically required
- Focus on clean, current API design
## Quick Reference

**Focus: Get next SINGLE work item or list all open work.**

```bash
bd ready              # Show issues ready to work (includes in-progress)
bd list --status=open # List all open issues
bd show <id>          # View specific issue details
bd update <id> --status=in_progress  # Claim work
bd close <id>         # Complete work
bd sync --flush-only  # Export to JSONL
```

**CRITICAL: ALWAYS CHECK GIT STATUS BEFORE/AFTER WORK**
```bash
git status           # MUST check before starting work
git status           # MUST check after completing work
git add .            # Stage changes
git commit -m "..."  # Commit work before moving to next ticket
```

### Finding Work (Task-Oriented)

```bash
# Get next available work item (includes in-progress)
bd ready

# See everything open
bd list --status=open

# View specific issue with dependencies
bd show <issue-id>

# JSON output for parsing (if needed)
bd ready --json | jq '.[0]'
bd show <issue-id> --json
```

**CRITICAL: WORK IN DEPENDENCY AND PRIORITY ORDER**
- **NEVER ask user for priority decisions** 
- Work tickets in dependency order first, then by priority
- Use `bd ready` output order - it's already sorted correctly
- If multiple items are ready, start with the first one listed
- Dependencies should be set up in beads, not guessed

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

**Bottom line:** Work is not complete without tests AND clean git status. Prefer unit tests. For UI, assume user tests manually or you use puppeteer.

## Development Resources

- `docs/DEVELOPMENT.md` - Example patterns, path aliases, testing
- `docs/FEATURE-CHECKLIST.md` - Feature addition reference
- `docs/AGENTS.md` - Docs-specific patterns (Astro, MDX)
- `review/` - Living review and planning workspace

**Focus:** Make things work. Tests pass, UI works (manually tested or puppeteer), AND git status is clean.


## Commands

**Agents can run:**
```bash
npm run dev              # Vitest watch mode (for testing)
npm test                 # Run all tests with coverage (if everything passes)
npm run build            # Build core library only (fast, preferred)
```

**User runs (agents assume running):**
```bash
npm --workspace docs run dev    # Astro dev server at localhost:4321
npm run build:docs              # Build docs (SLOW, VERBOSE - user runs when needed)
npm run build:all              # Build core library + docs (when full build needed)
npm run dev:all                # Run both core dev server and docs dev server
npm run release                # Release process (user only)
npm run publish                # Publish to npm (user only)
npm run dry-run                # Dry run release (user only)
```

**Key points:**
- Agents do NOT run dev servers - assume they're running
- **NEVER run `npm run build:docs` as agent** - extremely slow and verbose
- **NEVER run `npm run dev:all` as agent** - agents don't run dev servers
- **NEVER run `npm run release`, `npm run publish`, or `npm run dry-run` as agent** - user only
- **Prefer `npm run build` (core only) over `npm run build:all`** - much faster
- **`npm run build` now only builds the core library** - docs build moved to `build:all`
- **Docs workspace has its own scripts** - use `npm --workspace docs run <script>` for docs-specific commands
- **When running builds**: Limit output ingestion (see Quality Gates section)

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
- build: When needed to verify library builds correctly
- build:docs: Rarely - user runs when needed (prefer live dev server testing)
- build:all: Rarely - only when full build of library + docs is required
- test-build: When type checking both core and docs (verbose, use sparingly)
- Linting: Only right before shipping (skip during development)

**Verbose output handling (CRITICAL):**

**DO NOT naively ingest full output from builds, dev servers, tests, or other verbose processes.**

**General rule: When output expected to be >2 pages, ALWAYS limit what you see.**

- **Tests**: Can be verbose with logging
  - Run specific tests when possible: `npx vitest run test/file.test.ts -t "pattern"`
  - For full test runs, consider piping and reading selectively
  - Watch mode usually manageable, but full runs with coverage can be verbose

- **Builds/dev servers/checks**: Notoriously verbose (often >2 pages)
  - Pipe to files/buffers first
  - Read in reverse: last 10-20 lines first
  - Only read more if needed for debugging

**Strategy: Pipe to file, read last 10-20 lines for success/failure, investigate more only if needed.**

**Examples:**
```bash
# ✅ Good - run specific test
npx vitest run test/matchbox.test.ts -t "should create"

# ✅ Good - limit output
npm run build:lib 2>&1 | tail -20
npm test 2>&1 | tail -30  # Tests may need more lines

# ✅ Good - file then selective read
npm run build:docs > /tmp/build.log 2>&1
npm test > /tmp/test.log 2>&1
# Then read last 20-30 lines of logs

# ❌ Bad - don't do this
npm run build:docs  # Floods context with verbose output
npm test            # Can flood context if tests have logging
```

**Safety:**
- Never destroy work (we have git)
- Do NOT do hard resets 


## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until committed.

**MANDATORY WORKFLOW:**

1. **CHECK GIT STATUS** - CRITICAL: Before completing any work, ALWAYS check `git status` to see what files are modified
2. **File issues for remaining work** - Create issues for anything that needs follow-up
3. **Run quality gates** (if code changed) - Tests, linters, builds
4. **Update issue status** - Close finished work, update in-progress items
5. **COMMIT** - Use conventional commits and do NOT mention AI or tooling used
6. **Clean up** - Remove any working docs, debug logging in code
7. **CHECK GIT STATUS AGAIN** - CRITICAL: Verify all changes are committed
8. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until tested and committed
- **ALWAYS check `git status` before closing tickets** - never complete work without knowing what will be committed
- **NEVER leave uncommitted changes when moving to next ticket**
- If you have uncommitted changes when closing a ticket, you MUST commit them first
