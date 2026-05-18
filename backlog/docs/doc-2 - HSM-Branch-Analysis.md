---
id: doc-2
title: HSM Branch Analysis
type: analysis
created_date: '2026-01-17 19:13'
---

## Current State
- **Branch**: `feat/hsm-dual-mode-with-viz-and-examples`
- **Scale**: 25k additions, 12k deletions
- **Status**: Decently stable, exploratory in nature

## Core Components Delivered

### 1. Shapes Concept & HSM Core
- Hierarchical State Machine implementation
- Shape definitions accommodating hierarchy
- Core complexity managed well, shapes integration clean

### 2. Visualizers
- **ReactFlow V2**: Primary success story
- **Mermaid**: Functional but CSS specificity issues
- **ForceGraph Inspector**: Technical debt, candidate for retirement

### 3. Examples & Documentation
- Nested and flattened HSM examples
- Multiple visualizers integrated
- Live examples without StackBlitz embeds

## Strategic Decisions

### HSM Library Integration
Keep shapes in core, HSM as addon. Shapes accommodate hierarchy simply, HSM complexity isolated.

### Visualizer Strategy
- **ReactFlow**: Primary (best diagrams, good interactivity)
- **Mermaid**: Evaluate - styling pain points, weight impact
- **ForceGraph**: Retire (technical debt)

### Documentation
- Server-rendered islands needed (Astro)
- Example consolidation (reduce stopwatch sprawl)
- Better loading states

## Action Items
1. Consolidate examples - reduce sprawl
2. Complete viz package extraction
3. Retire ForceGraph Inspector
4. Evaluate/deprecate Mermaid
