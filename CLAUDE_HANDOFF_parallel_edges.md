# Claude Code Handoff: ReactFlow Parallel Edges Fix

## Status: SIGNIFICANT PROGRESS - Onion Layering Working

## What Was Accomplished

### Core Solution Implemented
A **two-part strategy** for parallel edge separation:

1. **Handle-based direction separation**:
   - Off→On edges → LEFT handles
   - On→Off edges → RIGHT handles
   - Logic: `side = isForwardDirection ? 'left' : 'right'` where forward = alphabetically first node

2. **Curvature-based onion layering**:
   - Multiple edges in same direction bend **outward from each other**
   - Uses `getSpecialPath()` with Quadratic Bezier + perpendicular offset
   - Alternates bend direction: `index % 2 === 0 ? 1 : -1`

### Files Modified
- `src/viz/ReactFlowInspector/hooks/useStateMachineEdges.ts` - Main edge logic (~lines 118-145)
- `src/viz/ReactFlowInspector/CustomEdge.tsx` - Edge rendering with `getSpecialPath()` (~lines 19-46)

### Visual Result
Screenshot `toggle-bidi-fix.png` shows:
- Off node at top, On node at bottom
- **Left side**: Blue edges "turnOn" and "toggle" bending outward from each other
- **Right side**: Gray edges "turnOff" and "toggle" bending outward from each other
- 4 separate edge paths visible

## Remaining Tasks

### 1. Test with Horizontal Sugiyama Layout
User wants to see onion effect with horizontal layout. Modify toggle preset in `presets.ts`:
```typescript
'toggle': {
  layoutOptions: {
    direction: 'RIGHT',    // Horizontal
    algorithm: 'layered',  // Sugiyama
    layerSpacing: 150,     // More space for edge labels
  }
}
```

### 2. Compare with ForceGraph
ForceGraph has nicer onion layering - see `src/viz/ForceGraphInspector.tsx` lines 552-589.
Key insight: flips curvature sign when source differs (opposite direction).

### 3. Edge Selection Bug
User reported when state is "On", both edges show as active. Logic at line 107 looks correct:
`isPossibleExit = transition.from === currentState`
May need visual verification.

### 4. Spacing Tuning
Current `baseSpacing = 40`. May need adjustment for label separation.

## Key Code Snippets

### useStateMachineEdges.ts - Onion layering logic:
```typescript
if (isBidirectional) {
  const [sortedFirst] = pairKey.split("-");
  const isForwardDirection = from === sortedFirst;
  side = isForwardDirection ? 'left' : 'right';

  if (groupTransitions.length > 1) {
    const baseSpacing = 40;
    const bendDirection = index % 2 === 0 ? 1 : -1;  // Onion: alternate outward
    const layer = Math.floor(index / 2) + 1;
    edgeOffset = layer * baseSpacing * bendDirection;
  } else {
    edgeOffset = 20 * (isForwardDirection ? 1 : -1);
  }
}
```

### CustomEdge.tsx - Quadratic bezier with perpendicular offset:
```typescript
function getSpecialPath(sourceX, sourceY, targetX, targetY, offset) {
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const perpX = (-dy / length) * offset;
  const perpY = (dx / length) * offset;
  return `M ${sourceX} ${sourceY} Q ${centerX + perpX} ${centerY + perpY} ${targetX} ${targetY}`;
}
```

## Test Command
```bash
npx playwright test --config=playwright-debug.config.ts test/e2e/debug/toggle-bidi-test.spec.ts
```

## References
- ReactFlow BiDirectional example: https://reactflow.dev/examples/edges/custom-edges
- ForceGraph parallel edge handling: `src/viz/ForceGraphInspector.tsx:552-589`

## User Feedback
- "endpoint mirroring is nice at least for this example" ✓
- "not yet seeing nice separation between edges" - needs more spacing
- "consider how wide labels are" - baseSpacing needs tuning
- "look at ForceGraph version for nicer onion layering"
