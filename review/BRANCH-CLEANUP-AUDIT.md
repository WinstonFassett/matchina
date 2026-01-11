# Branch Cleanup Audit: feat/reactflow-v2-rewrite

**Date:** 2025-01-11
**Branch stats:** 635 files changed, 69,278 additions, 9,466 deletions
**Added files:** 512

---

## Executive Summary

This branch contains substantial legitimate work (visualizers, HSM examples, e2e tests) buried under a mountain of debugging artifacts. Roughly **60-70% of added files are junk** that should be removed before merge.

---

## 1. IMMEDIATE DELETE (Junk/Empty Files)

### Root-level empty test scripts (13 files, all 0 bytes)
```
test-async-calculator-states.cjs
test-flat-combobox.js
test-hierarchical-fix.cjs
test-mermaid-fix.cjs
test-mermaid-fix.js
test-popover-positioning.cjs
test-popover-simple.cjs
test-promise-states.cjs
test-reactflow-height.cjs
test-reactflow-layout.cjs
test-state-keys.js
test-store-fix.js
test-toggle-bidi-fix.tsx
```

### Root-level empty markdown files
```
Untitled.md (0 bytes)
SELF_LOOP_HANDOFF.md (0 bytes)
```

### Debug PNG files at root (can recreate if needed)
```
flat-debug-data.png
flat-no-suggestions.png
nested-no-suggestions.png
toggle-bidi-fix.png
```

### test-selfloop-working/ - Entire abandoned prototype
25 files including node_modules. This is a separate mini-project that was used for debugging. **Delete entire folder.**

### Empty files in various locations
Many files show `| 0` in diff stats, indicating 0 lines. These include:
- `.windsurf/workflows/src.md`
- `docs/src/components/HierarchicalWebCola.tsx`
- `docs/src/code/examples/hsm-checkout/AvailableActions.tsx`
- Various review/*.md files
- Several scripts/*.js files

---

## 2. E2E TEST CLEANUP

**136 e2e test files added**, broken down:
- `test/e2e/debug/` - 43 files (debugging cruft)
- `test/e2e/` root - ~80 one-off `check-*.spec.ts` files
- `test/e2e/functional/` - 8 files (KEEP)
- `test/e2e/visual/` - 4 files (KEEP)
- `test/e2e/utils/` - 3 files (KEEP)

### Recommendation
- **DELETE** `test/e2e/debug/` folder entirely
- **DELETE** all root-level `check-*.spec.ts` files (one-off debugging)
- **KEEP** `functional/`, `visual/`, `utils/` subfolders

---

## 3. SCRIPTS FOLDER (50+ scripts)

Most are one-off debugging/capture scripts created during development:
```
adversarial-visual-comparison.cjs
capture-all-visualizers.cjs
capture-mermaid-*.cjs
comprehensive-visual-audit.cjs
debug-*.cjs
...
```

### Recommendation
- **DELETE** most scripts (they're development artifacts)
- **KEEP** only genuinely useful ones (if any)
- Could stash them on a `dev-scripts` branch if paranoid

---

## 4. REVIEW FOLDER (118 files)

Was 1 file on main (`branch-plan.md`), now 118 files. Contains:
- .obsidian/ folder (Obsidian vault config)
- archive/ and archived/ subfolders
- Many working documents and analysis files

### Recommendation
**Option A (Preferred):** Rename to `local/` and add to `.gitignore`:
```bash
mv review local
echo "local/" >> .gitignore
```
This keeps notes locally but removes from git.

**Option B:** Keep review folder but prune to essentials only.

---

## 5. ROOT-LEVEL WORKING DOCS

Files that are development artifacts, not project documentation:
```
progress-log.md
todo-tree.md
test-mermaid.md
index.md (vitepress leftover?)
LAYOUT_ENGINE_ANALYSIS.md
REACTFLOW_V2_HANDOFF.md
REACTFLOW_V2_IMPLEMENTATION_PLAN.md
reactflow-v2-rewrite.md
```

### Recommendation
Move to `local/` (if keeping) or delete. These are session notes, not project docs.

---

## 6. DOCS/ WORKING MARKDOWN

New markdown files in docs/ folder:
```
docs/E2E.md (KEEP - useful)
docs/E2E-OUTPUT-TYPES.md
docs/EDGE-LABEL-SPACING-CALCULATION.md
docs/ELK-DIMENSIONS-CALCULATION.md
docs/ELK-LAYOUT-REFERENCE.md
docs/ELK-SETTINGS-ANALYSIS.md
docs/ELK-SETTINGS-AUDIT.md
docs/ELK-SETTINGS-FINAL-ANALYSIS.md
docs/ELK-SETTINGS-OUTCOME.md
docs/ELK-SETTINGS-PERFECTED.md
docs/SCREENSHOT-LOCATIONS.md
docs/SCREENSHOT-STRATEGY.md
docs/SELF_LOOP_OPTIMIZATION.md
```

### Recommendation
- **KEEP** `docs/E2E.md` (genuinely useful)
- **DELETE or MOVE** ELK-* files (6 files analyzing the same thing)
- **DELETE** SCREENSHOT-* files (development notes)

---

## 7. REACTFLOW V1 vs V2

Current state:
```
src/viz/ReactFlowInspector/      # V1 (used)
src/viz/ReactFlowV2/             # V2 main (used - HSMReactFlowInspectorV2)
src/viz/ReactFlowVisualizerV2/   # Prototype? (3 files)
```

MachineVisualizer.tsx uses BOTH V1 and V2:
- `<HSMReactFlowInspector ...>` (V1)
- `<HSMReactFlowInspectorV2 ...>` (V2)

### Recommendation
1. **Delete** `src/viz/ReactFlowVisualizerV2/` (seems like abandoned prototype)
2. **Rename** `src/viz/ReactFlowV2/` → `src/viz/ReactFlowInspector/` (replace V1)
3. Update all imports to use the new V2 as the only ReactFlow
4. This is a bigger task - may want separate PR

---

## 8. FORCEGRAPH STATUS

ForceGraph exists and is used in:
- VizPicker.tsx (as option)
- MachineVisualizer.tsx (rendering)
- 4 stopwatch examples

Location: `src/viz/ForceGraphInspector/`

**Status:** Working, keep as-is.

---

## 9. LEGITIMATE ADDITIONS (KEEP)

### Source code (78 files in src/)
- `src/viz/` - Visualizer implementations (KEEP)
- `src/hsm/` - HSM support (KEEP)
- New utilities (KEEP)

### Examples (in docs/src/code/examples/)
- hsm-checkout/
- hsm-combobox/
- hsm-traffic-light/
- rock-paper-scissors updates
- All legitimate, KEEP

### Test files (some)
- `test/e2e/functional/` - Real smoke tests
- `test/e2e/visual/` - Visual regression tests
- Core test files for new features

---

## Cleanup Action Plan

### Phase 1: Quick Wins (delete obvious junk)
1. Delete 13 empty root test-*.cjs/js/tsx files
2. Delete empty Untitled.md, SELF_LOOP_HANDOFF.md
3. Delete debug PNG files at root
4. Delete test-selfloop-working/ folder
5. Delete .windsurf/ folder

### Phase 2: E2E Test Cleanup
1. Delete test/e2e/debug/ folder
2. Delete test/e2e/check-*.spec.ts files (keep functional/, visual/, utils/)

### Phase 3: Scripts Cleanup
1. Delete or archive scripts/ folder contents

### Phase 4: Review Folder
1. Rename review/ to local/
2. Add local/ to .gitignore

### Phase 5: Doc Cleanup
1. Move root working MDs to local/
2. Consolidate or delete docs/ELK-* files

### Phase 6: ReactFlow Consolidation (optional, could be separate PR)
1. Delete ReactFlowVisualizerV2 prototype
2. Replace V1 with V2
3. Update all references

---

## File Counts Summary

| Category | Files | Action |
|----------|-------|--------|
| Empty root scripts | 13 | DELETE |
| Root debug PNGs | 4 | DELETE |
| test-selfloop-working/ | 25 | DELETE |
| test/e2e/debug/ | 43 | DELETE |
| test/e2e/check-*.spec.ts | ~80 | DELETE |
| scripts/ | 50+ | DELETE/ARCHIVE |
| review/ | 118 | GITIGNORE |
| Root working MDs | ~10 | MOVE/DELETE |
| docs/ELK-* | 6 | DELETE/CONSOLIDATE |
| **Estimated removable** | **~350** | |
| **Estimated keepable** | **~160** | |

---

## Notes

- Branch has real, substantial work - don't throw baby out with bathwater
- The visualizers, HSM support, and examples are legitimate additions
- The cruft is from iterative debugging over many sessions
- Consider doing cleanup in stages, verifying after each phase
