# ELK Settings Analysis - Critical Findings

## 🚨 SHOCKING DISCOVERY: Most Settings Don't Work

### Test Results Summary
After systematic testing of ELK settings impact on node positions, we found:

**ONLY 2 SETTINGS ACTUALLY WORK across all algorithms:**
- ✅ `layerSpacing` - Affects spacing between layers/levels
- ✅ `direction` - Changes layout orientation (DOWN/RIGHT/UP/LEFT)

**INEFFECTIVE SETTINGS (7+ settings per algorithm):**
- ❌ `nodeSpacing` - No impact on node positions
- ❌ `edgeSpacing` - No impact on node positions  
- ❌ `thoroughness` - No impact on node positions
- ❌ `nodePlacementStrategy` - No impact on node positions
- ❌ `edgeRoutingStrategy` - No impact on node positions
- ❌ `compactionStrategy` - No impact on node positions
- ❌ `cycleBreakingStrategy` - No impact on node positions
- ❌ `iterationLimit` - No impact on node positions
- ❌ `forceIterations` - No impact on node positions

### Root Cause Analysis

The issue appears to be **incorrect ELK option keys** in the current implementation. Comparing with V1:

#### Current V2 Implementation (BROKEN):
```typescript
// These don't work because the keys are wrong
'elk.spacing.nodeNode': String(nodeSpacing),  // ❌ Wrong key
'elk.layered.thoroughness': String(settings.thoroughness), // ❌ Wrong key
'elk.layered.nodePlacement.strategy': settings.nodePlacementStrategy, // ❌ Wrong key
```

#### V1 Implementation (WORKING):
```typescript
// These work because the keys are correct
'elk.spacing.nodeNode': options.nodeSpacing.toString(), // ✅ Correct key
'elk.layered.thoroughness': Math.max(1, Math.min(20, options.throughness || 7)).toString(), // ✅ Correct key
'elk.layered.nodePlacement.strategy': options.compactComponents ? 'SIMPLE' : 'NETWORK_SIMPLEX', // ✅ Correct key
```

### The Real Issue: Key Mapping Problems

Looking at the V2 `buildLayoutOptions` method vs V1 `getElkOptions`:

**V2 Problems:**
1. **Wrong ELK option keys** - Using incorrect property names
2. **Missing algorithm-specific mappings** - Not applying settings correctly per algorithm
3. **Incorrect value formatting** - Not converting to strings properly
4. **Missing conditional logic** - Not applying settings based on algorithm type

**V1 Success Factors:**
1. **Correct ELK option keys** - Uses proper ELK property names
2. **Algorithm-specific switches** - Different options per algorithm
3. **Proper value formatting** - Converts numbers to strings
4. **Working conditional logic** - Applies settings correctly

### Algorithm-Specific Working Settings (from V1)

#### Layered Algorithm:
```typescript
// WORKING settings from V1:
'elk.layered.spacing.nodeNodeBetweenLayers': options.layerSpacing.toString(),
'elk.layered.nodePlacement.strategy': options.compactComponents ? 'SIMPLE' : 'NETWORK_SIMPLEX',
'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
'elk.layered.edgeRouting.strategy': 'ORTHOGONAL',
'elk.layered.compaction.postCompaction.strategy': options.compactComponents ? 'EDGE_LENGTH' : 'NONE',
'elk.layered.thoroughness': Math.max(1, Math.min(20, options.thoroughness || 7)).toString(),
```

#### Stress Algorithm:
```typescript
// WORKING settings from V1:
'elk.stress.iterationLimit': '500',
'elk.stress.epsilon': '0.0001',
'elk.stress.desiredEdgeLength': options.layerSpacing.toString(),
'elk.stress.quality': Math.max(1, Math.min(10, options.thoroughness || 7)).toString(),
```

#### Force Algorithm:
```typescript
// WORKING settings from V1:
'elk.force.iterations': '300',
'elk.force.repulsion': (options.nodeSpacing / 10).toString(),
'elk.force.attraction': (options.layerSpacing / 300).toString(),
'elk.force.temperature': ((options.thoroughness || 7) / 1000).toString(),
```

#### MRTree Algorithm:
```typescript
// WORKING settings from V1:
'elk.mrtree.searchOrder': 'DFS',
'elk.mrtree.weighting': 'DESCENDANTS',
'elk.layered.spacing.nodeNodeBetweenLayers': options.layerSpacing.toString(),
'elk.mrtree.compaction': options.compactComponents ? 'true' : 'false',
```

### Critical Issues in Current V2 Implementation

1. **Missing Algorithm-Specific Options**: V2 uses generic settings instead of algorithm-specific ELK keys
2. **Incorrect Key Names**: Using wrong ELK property names
3. **No Value Conversion**: Not properly converting numbers to strings
4. **Missing Conditional Logic**: Not applying settings based on algorithm type
5. **Wrong Setting Mapping**: Mapping UI settings to wrong ELK options

### Solution Strategy

1. **Fix ELK Option Keys**: Use correct ELK property names from V1
2. **Restore Algorithm-Specific Logic**: Implement proper switch statements per algorithm
3. **Fix Value Formatting**: Ensure proper string conversion
4. **Map Settings Correctly**: Connect UI settings to correct ELK options
5. **Test Each Setting**: Verify each setting actually affects layout

### Next Steps

1. **Create Fixed ELKLayoutEngine**: Based on V1 working implementation
2. **Test Each Setting**: Verify impact on node positions
3. **Update UI Controls**: Only show settings that actually work
4. **Compare with V1**: Ensure parity with working V1 functionality
5. **Document Working Settings**: Clear list of what actually works

This explains why the ELK settings seemed "broken" - most of them literally weren't being applied to ELK correctly!
