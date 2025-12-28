# Agent Instructions for Matchina

This project uses **bd** (beads) for issue tracking. For development patterns, see `docs/DEVELOPMENT.md`.

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

## Development Resources

- `docs/DEVELOPMENT.md` - Example patterns, path aliases, testing
- `docs/FEATURE-CHECKLIST.md` - Feature addition reference
- `docs/AGENTS.md` - Docs-specific patterns (Astro, MDX)
- `review/` - Living review and planning workspace

**Focus:** Make things work. Tests and UI matter more than builds or typechecking unless explicitly asked.


## Commands (User Usually Runs)

```bash
npm run build:lib           # Build core root library without docs
npm run test                # Run tests in root library
npm run dev:docs            # Run docs dev server. USER DOES THIS NOT AGENT
npm run build:docs          # Build docs -- SLOW AND VERBOSE
npm run dev                 # n/a here. do not try
```

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

Do prefer to run tests when working in the core
Rely on developer (preferred) or browser integration (when running unattended) for manually testing examples in the docs
Beware verbose quality gates. Do not naively pipe all output to yourself. 
Docs are notoriously verbose to run dev, build and check. 
Best to pipe such things into files/buffers and then once done, read them in reverse, ie last 10-20 lines to start
Developer usually does not want you to run quality gates EXCEPT right before shipping. Even committing skip linting.
Never destroy work. We have git. But do NOT do hard resets. 


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
