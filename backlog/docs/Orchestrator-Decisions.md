---
id: doc-4
title: Orchestrator Decisions
type: decisions
created_date: '2026-01-17'
---

## Go/No-Go Decisions

### GO - Visualizer Repackaging
- ReactFlow as primary: CONFIRMED
- Extract Mermaid to @matchina/viz-mermaid: GO
- Extract ForceGraph to @matchina/viz-forcegraph: GO
- Keep SketchInspector in core: GO

### DEFER - Stopwatch Consolidation
Needs user input on which examples to remove.

### GO - HSM in Core
Keep HSM exported from main matchina. Document ./hsm subpath as preferred for smaller bundles.

## Critical Examples Status
All verified working:
- hsm-combobox ✓
- hsm-traffic-light ✓
- toggle ✓
- hsm-checkout ✓
- rock-paper-scissors ✓
