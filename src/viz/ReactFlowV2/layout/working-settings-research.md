# Layout Settings Research - What Actually Works

## Current State: Only Grid Layout Works

### ✅ Settings That Actually Work (Grid Layout)
Based on analysis of `GridLayoutEngine.ts`:

| Setting | Effect | Implementation |
|---------|--------|----------------|
| `nodeSpacing` | **HIGH** - Controls distance between grid cells | Directly multiplied by row/col position |
| `cols` | **HIGH** - Number of columns (undefined = auto-square) | Used in grid calculation |
| `direction` | **HIGH** - 'row' vs 'column' layout direction | Affects positioning logic |
| `alignment` | **MEDIUM** - 'start', 'center', 'end' alignment | Shifts entire grid |

### ❌ Settings That Have NO Effect (Grid Layout)
| Setting | Why It Doesn't Work |
|---------|-------------------|
| `edgeSpacing` | Grid layout doesn't position edges |
| `fitPadding` | Only affects bounds calculation, not visual layout |
| `animationDuration` | Not used anywhere in the engine |
| `compactness` | Poorly implemented - just reduces spacing by 50% |

### ❌ Presets Are Useless
- Grid layout is too simple for meaningful presets
- Only 4 settings actually matter
- Users can adjust directly without preset abstraction

## Comparison: Previous ELK Implementation

### ELK Settings That Worked (from ReactFlowInspector)
```typescript
// From elkLayout.ts - these actually had effects
"elk.direction": "DOWN" | "RIGHT" | "UP" | "LEFT"     // ✅ HIGH impact
"elk.spacing.nodeNode": "120"                          // ✅ HIGH impact  
"elk.layered.spacing.nodeNodeBetweenLayers": "180"     // ✅ HIGH impact
"elk.spacing.edgeNode": "20"                           // ✅ MEDIUM impact
"elk.edgeRouting": "ORTHOGONAL"                         // ✅ HIGH impact
"elk.layered.thoroughness": "7"                         // ✅ LOW impact
```

### ELK Settings That Were Questionable
```typescript
// These had minimal or no effect
"elk.aspectRatio": "1.6"        // ❌ Barely worked
"elk.debugMode": "false"         // ❌ Development only
"elk.layered.compaction": "..."  // ❌ Minimal visual difference
```

## Recommendations

### For Current Grid Layout
1. **Keep it simple** - Only show the 4 working settings
2. **Remove fake settings** - Don't show edgeSpacing, fitPadding, etc.
3. **No presets** - Too simple to warrant presets
4. **Honest UI** - Label clearly "Only grid layout available"

### For Future ELK Implementation
1. **Use the research** - Implement only settings that actually work
2. **Reference the JSON** - Use `elk-options-reference.json` for tooltips
3. **Test each setting** - Verify visual impact before exposing in UI
4. **Avoid cargo culting** - Don't copy settings from old implementation

## Key Insight

The original layout controls were showing settings that had no effect in the current implementation. This is confusing for users who expect changes to be visible.

**Rule:** Only expose settings that have a visible, meaningful effect in the current engine.

## Next Steps

1. ✅ Create honest grid layout controls (done)
2. 🔄 Implement ELK layout engine using working options only
3. 🔄 Add tooltips based on ELK research
4. ❌ Remove all fake/non-working settings
