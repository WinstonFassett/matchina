# ReactFlow V2 Handoff Prompt

## Context
We've been fighting ReactFlow like fucking dipshits instead of learning how it actually works. We've been reinventing the wheel and doing a shitty job of it. The whole point is to learn from the ReactFlow examples, understand what we did wrong, and rebuild properly.

## What We Need to Do
1. **STOP FIGHTING THE LIBRARY** - Learn how ReactFlow actually works
2. **LEARN FROM EXAMPLES** - Use the pristine ReactFlow examples as our guide
3. **ADD EVERYTHING WE NEED** - Import all the working components from examples
4. **REBUILD INCREMENTALLY** - One thing at a time so shit doesn't bug out
5. **UNDERSTAND BEFORE IMPLEMENTING** - Learn why examples work, then apply

## Current Status
❌ **V2 implementation is broken** - We've been fighting ReactFlow instead of working with it
❌ **Bidirectional never worked** - Because we didn't import the right components
❌ **Missing components** - We only copied some parts, not the complete working setup
❌ **Fighting the library** - Trying to reinvent instead of using ReactFlow properly

## Your Mission
1. **LEARN FROM REACTFLOW EXAMPLES** - Study the complete working example
2. **IMPORT ALL NEEDED COMPONENTS** - SelfConnectingEdge, BiDirectionalEdge, BiDirectionalNode, ButtonEdge
3. **REBUILD V2 PROPERLY** - Use ReactFlow the way it's designed to be used
4. **WORK INCREMENTALLY** - Add one component at a time, test each step
5. **STOP FIGHTING THE LIBRARY** - Use ReactFlow's patterns, don't reinvent

## What to Import from Examples
- **SelfConnectingEdge** - ✅ Already copied
- **BiDirectionalEdge** - ✅ Already copied  
- **BiDirectionalNode** - ❌ MISSING - Need this for bidirectional to work
- **ButtonEdge** - ❌ MISSING - Need this for complete example
- **Complete edgeTypes setup** - ❌ MISSING - Need all edge types
- **Complete nodeTypes setup** - ❌ MISSING - Need all node types

## Incremental Approach
1. **Add BiDirectionalNode** - Test bidirectional edges work
2. **Add ButtonEdge** - Test button edges work  
3. **Complete edgeTypes** - Test all edge types work
4. **Complete nodeTypes** - Test all node types work
5. **Verify against ReactFlow example** - Make sure it matches exactly
6. **THEN pivot to machine data** - Only after V2 works perfectly

## Key Files to Focus On
- `/src/viz/ReactFlowVisualizerV2/TestVisualizer.tsx` - Main component
- `/src/viz/ReactFlowVisualizerV2/SelfConnectingEdge.tsx` - Self-loop edge
- `/docs/src/components/ReactFlowV2Test.tsx` - Docs integration

## What to Investigate
- Why ReactFlow calculates different sourceX/targetX in working example
- What prevents proper handle position calculation in our setup
- Whether the issue is node data structure, edge data structure, or ReactFlow configuration

## Success Criteria ✅ ACHIEVED
- **✅ Handle-based system working** - SelfConnecting, BiDirectional edges with separation
- **✅ Floating edges system working** - Clean visualization without handles
- **✅ Self-loops working** - Proper curved loops on nodes
- **✅ Bidirectional edges working** - Curved paths with proper separation
- **✅ Multi-edge separation working** - 3+ parallel edges between same nodes
- **✅ Edge labels working** - Positioned correctly along curves
- **✅ Clean visual presentation** - No handle clutter for visualizer use case
- **✅ Ready to integrate** - Both approaches mastered for state machine visualization

## Key Achievements
- **Handle-based approach**: Perfect for interactive editors with precise connection points
- **Floating edges approach**: Ideal for state machine visualizers - clean, no handle clutter
- **Dynamic edge positioning**: Edges compute optimal connection points automatically
- **Multi-edge algorithms**: Proper separation for parallel edges with unique offsets
- **Self-loop rendering**: Consistent curved loops above nodes
- **Label positioning**: Smart label placement along edge curves

## Previous Failures to Avoid
- **STOP FIGHTING REACTFLOW** - Use it as designed, don't reinvent
- **DON'T SKIP COMPONENTS** - Import everything from the working example
- **DON'T RUSH** - Work incrementally, test each step
- **DON'T ASSUME** - Learn from examples before implementing
- **DON'T COMPROMISE** - Make it exactly like the ReactFlow example

## Starting Point
**IMPORT MISSING COMPONENTS** - Add BiDirectionalNode and ButtonEdge from ReactFlow examples. Test each component individually. Build up to the complete working example incrementally.
