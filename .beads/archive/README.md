# Beads Archive

This directory contains archived completed issues from the beads issue tracking system.

## Files

- `hsm-dual-mode-with-viz-and-examples.jsonl` - Completed issues from the feat/hsm-dual-mode-with-viz-and-examples branch (67 issues archived)

## Archive Summary

**Total archived:** 67 issues  
**Date:** $(date)  
**Branch:** feat/hsm-dual-mode-with-viz-and-examples  

### Types of Issues Archived
- HSM (Hierarchical State Machines) implementation and fixes
- Visualization improvements (Mermaid, Sketch inspectors)
- Example implementations (combobox, checkout, traffic-light)
- Flattened vs nested machine work
- UI/UX improvements for examples and visualizers

## Remaining Issues

The main `.beads/issues.jsonl` now contains 50 remaining issues that were not related to this branch's work.

## Restoring Archived Issues

If needed to restore archived issues:
```bash
# Backup current issues
cp .beads/issues.jsonl .beads/issues_current.jsonl

# Restore archived issues (append to current)
cat .beads/archive/hsm-dual-mode-with-viz-and-examples.jsonl >> .beads/issues.jsonl
```
