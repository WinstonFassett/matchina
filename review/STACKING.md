# Stacking Strategy for Matchina

## Problem Statement

This repo has a long-running feature branch (`feat/hsm-dual-mode-with-viz-and-examples`) with a downstream dependent (`feat/externalize-inspect-viz`). Both need to stay synchronized with `main` as new PRs land. Git-town's ancestor-tracking alone doesn't handle this scenario well—the branches are too diverged and weren't set up with parent relationships.

## Why Traditional Rebasing Fails Here

1. **Branch age** - Both branches are several commits behind main
2. **Parallel development** - Changes landed in `main` (agent guidance PR) that both branches need
3. **Large changeset** - These branches have substantial divergence, making rebase conflicts difficult to resolve automatically
4. **Non-linear relationships** - These aren't clean feature branches; they're long-running development streams

## Solution: Merge-based Stacking

For this repo's workflow, **merge-based propagation** (not rebase) is better because:

1. **Preserves branch identity** - Each branch maintains its own commit history
2. **Cleaner conflict resolution** - Merge conflicts are isolated to one operation
3. **Easier recovery** - If a merge fails, you can abort and try again without rewriting history
4. **Better for long-running branches** - No multi-commit rebases that can cascade failures

## Execution Plan

### Current State
```
main (2402aa39)
├── feat/hsm-dual-mode-with-viz-and-examples (18bfa902)
│   └── feat/externalize-inspect-viz (c6157ff7)
```

All branches forked from `782701b7`. Main has 2 new commits.

### Propagation Strategy

**Step 1: Update feat/hsm-dual-mode-with-viz-and-examples**
```bash
git checkout feat/hsm-dual-mode-with-viz-and-examples
git merge main
# Resolve any conflicts (likely in AGENTS.md due to agent guidance updates)
```

**Step 2: Update feat/externalize-inspect-viz**
```bash
git checkout feat/externalize-inspect-viz
git merge feat/hsm-dual-mode-with-viz-and-examples
# Should have minimal conflicts since it already has that branch's changes
```

**Step 3: Force-push to maintain remote tracking**
```bash
git push -f origin feat/hsm-dual-mode-with-viz-and-examples
git push -f origin feat/externalize-inspect-viz
```

### Why This Works

1. **Unidirectional flow** - main → dual-mode → externalize
2. **Conflict isolation** - Each merge is a single operation, not cascading
3. **Recovery friendly** - Can reset and retry individual merges
4. **Time efficient** - No complex rebasing logic

### Alternative: Git-Town for Future Branches

If setting up new stacked branches, use git-town's parent tracking:
```bash
git-town new-branch <branch> --parent main
git-town new-branch <downstream> --parent <branch>
git-town sync  # Keeps all branches updated with ancestors
```

However, retrofitting this to existing long-running branches is risky. Better to use merge-based approach for now.

## Risk Mitigation

- **Backup before merging**: Current branches are on remote
- **Merge to a test branch first** if concerned about conflicts
- **Review merge commits** to ensure no unintended changes
- **Test after merge** before pushing (unit tests should still pass)

## Lessons for Future Work

1. **Set up stacking from the start** - When creating long-running branches, define parent relationships immediately with git-town
2. **Regular sync cycles** - Don't let branches drift >5-10 commits from main
3. **Merge PRs frequently** - Keep main moving and synchronize downstream branches weekly
4. **Document branch purpose** - Makes it clear which branches depend on which
