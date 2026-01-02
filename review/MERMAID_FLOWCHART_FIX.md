# Mermaid Flowchart Fix - HSM Traffic Light Flattened

## Target Screen
**hsm-traffic-light Flattened Mermaid-Flowchart**

## Current Problems (from screenshot)
1. **Working group has WHITE background** - should be transparent with accent border
2. **Duplicate nodes** - Red, Green, Yellow appear BOTH inside Working AND outside
3. **Title area styling** - Working title should have accent background with bg text

## Design Requirements

### Working Group (Subgraph)
- **Background**: Transparent (not white)
- **Border**: `--sl-color-text-accent` 
- **Title area**: Solid `--sl-color-text-accent` background
- **Title text**: `--sl-color-bg` color for contrast

### Nodes
- **No duplicates** - each state should appear only once
- **Inside Working**: Red, Green, Yellow (only here, not outside)
- **Outside Working**: Broken, Maintenance

### CSS Specificity Issue
Mermaid has VERY strong default theme specificity. Must use `!important` and target exact selectors.

## Key Selectors for Flowchart
- `.cluster rect` - subgraph background
- `.cluster-label` - subgraph title
- `.node rect` - node backgrounds

## Progress Log
- [x] Identified root cause: Red/Green/Yellow created as empty subgraphs
- [x] Fixed flowchart generation to check actual children, not isCompound flag
- [x] Added debug logging to verify hierarchy structure
- [x] Fixed stateDiagram syntax - [*] must come AFTER header (splice instead of unshift)
- [x] Fixed stateDiagram syntax - removed invalid 'as' keyword
- [x] Added post-render CSS injection for cluster label styling
- [x] Verified nested statechart renders without errors
- [x] Verified flattened flowchart renders correctly

## Fixes Applied

### 1. Flowchart Structure (generateFlowchart)
- Changed from checking `stateNode.isCompound` to `statesWithChildren.has(stateKey)`
- Prevents empty subgraphs for states without actual children

### 2. StateDiagram Syntax (generateStateChart)
- Fixed initial state placement: `rows.splice(1, 0, ...)` instead of `rows.unshift(...)`
- Removed invalid `as` alias syntax: `state Working {` instead of `state Working as Working {`

### 3. Cluster Label Styling
- Added post-render CSS injection for foreignObject elements
- Sets background-color, padding, border-radius on div
- Sets text color on nodeLabel and p elements

## Verified Working
- Nested mode: stateDiagram-v2 with compound Working state
- Flattened mode: graph LR with Working subgraph
- Working group: transparent background, accent border
- Working title: accent background, bg text color
