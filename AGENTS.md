# Agent Instructions for Matchina

This project uses **bd** (beads) for issue tracking. For development patterns, see `docs/DEVELOPMENT.md`.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync --flush-only  # Export to JSONL
```

### Finding Work

```bash
# See what's ready to work on (with JSON for parsing)
bd ready --json | jq '.[0]'

# Get issue details (with JSON for parsing)
bd show <issue-id> --json

# List all open issues
bd list --status=open
```

## Development Workflow

See `docs/DEVELOPMENT.md` for comprehensive development patterns including:
- Example structure and file organization
- Path aliases and imports
- Testing strategy
- Documentation site workflow

See `docs/FEATURE-CHECKLIST.md` for step-by-step feature addition checklist.

## Session Completion

**Before ending a session**, complete these steps:

1. **Run quality gates** (if code changed):
   ```bash
   npm test           # Type check + tests
   npm run build      # Verify builds
   npm run lint       # Check style
   ```

2. **Update issue status**:
   ```bash
   bd close <id1> <id2> ...    # Close completed issues
   bd update <id> --status in_progress  # Update WIP
   ```

3. **Export beads state**:
   ```bash
   bd sync --flush-only
   ```

4. **Commit changes**:
   ```bash
   git status
   git add .
   git commit -m "feat: description

   🤖 Generated with [Claude Code](https://claude.ai/code)
   via [Happy](https://happy.engineering)

   Co-Authored-By: Claude <noreply@anthropic.com>
   Co-Authored-By: Happy <yesreply@happy.engineering>"
   ```

5. **Push if on main or shared branch**:
   ```bash
   git pull --rebase
   git push
   ```

