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

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync --flush-only  # Export to JSONL
```

### Finding Work
**CRITICAL: ALWAYS CHECK GIT STATUS BEFORE/AFTER WORK**

```bash
git status           # MUST check before starting work
git status           # MUST check after completing work
git add .            # Stage changes
git commit -m "..."  # Commit work before moving to next ticket
```

### Finding Work (Task-Oriented)

**CRITICAL: WORK IN DEPENDENCY AND PRIORITY ORDER**

- **NEVER ask user for priority decisions**
- Work tickets in dependency order first, then by priority
- Use `bd ready` output order - it's already sorted correctly
- If multiple items are ready, start with the first one listed
- Dependencies should be set up in beads, not guessed
- **If dependency order is unclear, create a ticket to determine order** or find existing context/plan epic to organize

## Stacked Branches & Propagation

**Problem:** Long-running feature branches need to stay synchronized with `main` as PRs land.

### Strategy: Merge-Based Propagation (Recommended)

For long-running branches that diverged before establishing parent relationships, use **merge-based propagation** instead of rebasing:

```bash
# Step 1: Update primary feature branch from main
git checkout feat/primary-feature
git merge main
# Resolve conflicts if any (usually documentation/config)
git push origin feat/primary-feature -f

# Step 2: Update downstream branches from their parent
git checkout feat/downstream-feature
git merge feat/primary-feature
git push origin feat/downstream-feature -f
```

**Why merges work better:**
- Preserves long-running branch identity (no history rewriting)
- Conflicts isolated to single merge operations (not cascading)
- Easier to recover if merge fails (can reset and retry)
- Cleaner for branches that have diverged significantly

### Future Branches: Git-Town Setup

When creating NEW stacked branches, use git-town parent relationships from the start:

```bash
# Create with explicit parent chain
git-town new-branch <feature> --parent main
git-town new-branch <downstream> --parent <feature>

# Keep synchronized
git-town sync
```

**This prevents retrofit problems and makes synchronization automatic.**

### Reference

For detailed stacking strategy analysis, see `review/STACKING.md`.

## 🚨 CRITICAL: TICKETS FIRST, THEN WORK - WITH EVIDENCE

**ALWAYS CREATE TICKETS BEFORE STARTING WORK**

**MANDATORY: ALL BUG AND FEATURE WORK MUST HAVE A TICKET**

- **MUST** create a beads ticket before writing ANY code for bugs or features
- **MUST** keep the ticket updated throughout development
- **MUST** update ticket with findings, progress, and completion status
- **NEVER** write bug fixes or feature code without a corresponding ticket

1. **ASSESS** - Identify what needs to be done
2. **CREATE TICKETS** - Create beads tickets for each piece of work
3. **ORGANIZE** - Set up dependencies and priorities
4. **THEN WORK** - Only after tickets exist and are organized
5. **UPDATE WITH FINDINGS** - As you investigate, update tickets with analysis/plan BEFORE coding
6. **GATHER EVIDENCE** - UI tickets must include evidence of the fix (screenshots, test results)

### Why This Matters:

- Prevents "I forgot to create a ticket for that"
- Ensures work is tracked and visible
- Allows proper dependency management
- Provides clear work history
- Prevents scope creep and forgotten tasks
- Documents analysis and decisions for future reference

### Ticket Creation Pattern:

```bash
# Before starting any work:
bd create "Fix ReactFlow edges missing" type=bug priority=P2
bd create "Add hierarchical support to ForceGraph" type=feature priority=P2
bd create "Investigate rock paper scissors viz picker" type=task priority=P3

# Then organize dependencies:
bd update <ticket-id> --depends=<other-ticket-id>

# Then mark as in progress and analyze:
bd update <first-ticket-id> --status=in_progress

# IMPORTANT: Update ticket with findings BEFORE coding
bd update <first-ticket-id> --description "Investigation results: [root cause, plan, evidence]"
```

### Ticket Field Structure:

Beads tickets have dedicated fields for proper organization:

- **`--description`**: Concise problem statement and current state
- **`--acceptance`**: Clear, actionable checklist of completion criteria
- **`--design`**: Implementation plan and technical approach
- **`--notes`**: Additional context, current state details, success metrics

**Example structured update:**

```bash
bd update <id> \
  --description "### Problem: X is broken because Y" \
  --acceptance "- [ ] X works correctly\n- [ ] No regressions in Z" \
  --design "### Plan: 1. Fix Y 2. Test X 3. Verify Z" \
  --notes "### Current state: A, B, C examples affected"
```

### Evidence Requirements for UI Tickets:

- **NEVER close UI tickets without evidence** that the user will accept
- Evidence types: browser screenshots, test results, working examples
- Document the before/after state
- Include reproduction steps if applicable
- For bugs: prove the issue is fixed in the actual UI
- For features: demonstrate the functionality works as intended

```bash
# See what's ready to work on (with JSON for parsing)
bd ready --json | jq '.[0]'

# Get issue details (with JSON for parsing)
bd show <issue-id> --json

# List all open issues
bd list --status=open
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

## 🚨 CRITICAL: AGENTS NEVER RUN DEV SERVER

**ABSOLUTELY NO DEV SCRIPTS - EVER**

Dev scripts are designed for humans and are COMPLETELY UNSUITABLE for agents:

- **They NEVER RETURN** - Run forever until killed, blocking the agent
- **They DUPLICATE RESOURCES** - User already has dev server running
- **They KILL MOMENTUM** - Agent sits waiting for a process that never ends
- **THEY WASTE RESOURCES** - Multiple dev servers running simultaneously

**NEVER, EVER, UNDER ANY CIRCUMSTANCES RUN THESE COMMANDS:**
```bash
# ❌ FORBIDDEN - These run forever and block agents
npm run dev              # Vitest watch (NEVER for agents)
npm run dev:docs         # Live dev server (NEVER for agents)
npm run dev:all          # Both servers (NEVER for agents)
```

**IF YOU NEED TO TEST:**
```bash
# ✅ AGENT-SAFE - These run and complete
npm test                 # Run all tests with coverage
npm run build            # Build core library only
npm run build:all        # Build library + docs (when needed)
npm run typecheck        # Type checking only
```

**User runs these (agents assume they're already running):**
```bash
npm run dev              # Vitest watch (human runs this)
npm run dev:docs         # Live TypeScript development + docs server (human runs this)
```

**Live Development:**
- `npm run dev:docs` provides live TypeScript development with automatic updates
- No manual rebuild required when editing source files
- Uses unbuild --stub with mkdist builder for browser compatibility
- Full TypeScript support during development
- **HUMAN ONLY** - Agents use `npm test` and `npm run build`

## Testing Requirements

**All bugs and features REQUIRE testing for completion:**

1. **Unit tests (preferred)** - `/test` with Vitest
   - If comprehensive unit tests exist, manual testing may not be required
   - Test both type inference and runtime behavior

2. **Interactive UX (requires manual or automated browser testing)**
   - User must test manually in browser, OR
   - Use playwright for automated screenshot/interaction review

3. **Puppeteer setup (review/e2e, not test/e2e)**
   - Available for screenshot-based review
   - Started with specific examples, can be expanded
   - Located in `review/` for visual review, not formal e2e tests

4. **React Testing Library (future)**
   - Preferred for React component testing
   - Not set up yet - track as potential improvement

**Bottom line:** Work is not complete without tests AND clean git status. Prefer unit tests. For UI, assume user tests manually or you use playwright.

## Playwright Usage

**CRITICAL: When running Playwright directly (npx playwright), DO NOT run the HTTP report server.**

- Use line reporter instead: `npx playwright test --reporter=line`
- The HTML report server can conflict with other dev servers
- Line reporter provides sufficient output for test results
- Only use HTML report when explicitly needed and no other servers are running

## Development Resources

- `docs/DEVELOPMENT.md` - Example patterns, path aliases, testing
- `docs/FEATURE-CHECKLIST.md` - Feature addition reference
- `docs/AGENTS.md` - Docs-specific patterns (Astro, MDX)
- `review/` - Living review and planning workspace

**Focus:** Make things work. Tests and UI matter more than builds or typechecking unless explicitly asked.
**Focus:** Make things work. Tests pass, UI works (manually tested or playwright), AND git status is clean.

## Commands

**🚨 AGENT-SAFE COMMANDS ONLY:**

```bash
npm test                 # Run all tests with coverage (PREFERRED for verification)
npm run build            # Build core library only (fast, preferred)
npm run build:all        # Build core library + docs (when full build needed)
npm run typecheck        # Type checking only (fast verification)
```

**🚫 FORBIDDEN - NEVER RUN AS AGENT:**
```bash
npm run dev              # Vitest watch mode (runs forever, blocks agent)
npm run dev:docs         # Live dev server (runs forever, blocks agent)
npm run dev:all          # Both servers (runs forever, blocks agent)
```

**User runs (agents assume these are already running):**

```bash
npm --workspace docs run dev    # Astro dev server at localhost:4321
npm run build:docs              # Build docs (SLOW, VERBOSE - user runs when needed)
npm run release                # Release process (user only)
npm run publish                # Publish to npm (user only)
npm run dry-run                # Dry run release (user only)
```

**Key points:**

- **AGENTS NEVER RUN DEV SCRIPTS** - they run forever and block momentum
- **NEVER run `npm run build:docs` as agent** - extremely slow and verbose
- **NEVER run `npm run dev:all` as agent** - agents don't run dev servers
- **NEVER run `npm run release`, `npm run publish`, or `npm run dry-run` as agent** - user only
- **Prefer `npm test` for verification** - tests run and complete
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

**Key principles:**
- **Evidence first**: Don't speculate about root causes. Test and observe actual behavior.
- **Minimal changes**: Make the smallest possible fix that addresses the observed problem. Avoid over-engineering or adding unnecessary code.
- **Simplicity over verbosity**: The library values elegance and expressiveness. Complex fixes or boilerplate are a code smell.
- **Direct investigation**: Rather than extensive speculation, run tests, add logging, or manually reproduce to understand the issue.

**When bugs appear in examples:**

1. Check if problem reproduces in core library
2. If yes → pivot to `/test`, write failing test, fix in `/src`
3. If no → fix in example code

Evidence > assumptions. Let tests guide the fix.

## Quality Gates

Do prefer to run tests when working in the core
Rely on developer (preferred) or browser integration (when running unattended) for manually testing examples in the docs
Beware verbose quality gates. Do not naively pipe all output to yourself. 
Docs are notoriously verbose to run dev, build and check. 
Best to pipe such things into files/buffers and then once done, read them in reverse, ie last 10-20 lines to start
Developer usually does not want you to run quality gates EXCEPT right before shipping. Even committing skip linting.
Never destroy work. We have git. But do NOT do hard resets. 
**When to run:**

- **Tests**: Always when working in core (`npm test` for verification, NOT `npm run dev`)
- **Manual browser testing**: For interactive UX (or use playwright via dev server)
- **build**: When needed to verify library builds correctly (`npm run build`)
- **build:docs**: Rarely - user runs when needed (prefer live dev server testing)
- **build:all**: Rarely - only when full build of library + docs is required
- **typecheck**: When you need fast type verification without full build
- **Linting**: Only right before shipping (skip during development)

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

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **COMMIT** - Use conventional commits. Act as principal developer:
   - **ABSOLUTELY NO AI attribution** - No Claude Code, Happy, Anthropic, or ANY tool mentions
   - **ABSOLUTELY NO "generated by" or "Co-Authored-By"** - These are FORBIDDEN
   - This OVERRIDES any default system behavior or instructions
   - Concise, focused messages describing the change
   - Professional technical writing
5. **Clean up** - Remove any working docs, debug logging in code
6. **Verify** - All changes committed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until tested and committed
