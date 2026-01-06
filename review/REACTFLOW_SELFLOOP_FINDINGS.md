# ReactFlow Self-Loop Investigation Findings

## Current Status: EPIC FAILURE

### What We Discovered
1. **Original ReactFlow Example Works Perfectly**
   - Self-loop arc: `M 160 47 A 60 50 0 1 0 167 47`
   - Different sourceX/targetX coordinates (160 vs 167)
   - Uses right/left positioning: `sourcePosition: Position.Right, targetPosition: Position.Left`

2. **Our Implementation is Fundamentally Broken**
   - Self-loop gets same coordinates: `sourceX: 165, targetX: 165`
   - ReactFlow not calculating handle positions correctly
   - ELK layout sets bottom/top positioning, but edges expect right/left

3. **Root Cause Identified**
   - **Control points not working**: ReactFlow gives same coordinates for source/target
   - **Positioning mismatch**: Nodes expect bottom/top, edges use right/left
   - **Handle calculation broken**: ReactFlow can't calculate proper handle positions

### What We Tried
1. ✅ Copied exact SelfConnectingEdge from ReactFlow example
2. ✅ Fixed edge positioning to use right/left
3. ✅ Added BiDirectionalEdge for bidirectional transitions
4. ❌ **STILL BROKEN** - coordinates remain the same

### Core Problem
ReactFlow is not calculating handle positions properly in our setup. The nodes and edges have conflicting positioning information that prevents proper control point calculation.

### V2 Status
- ✅ Created ReactFlowVisualizerV2 with clean implementation
- ✅ Added to docs sidebar for testing
- ❌ **NOT TESTED YET** - got distracted with counter example

## Next Steps for Clean Session
1. **Test the V2 implementation** at `http://localhost:4321/matchina/test-reactflow-v2`
2. **Start from working example** and adapt it step by step
3. **Focus on control points** - ensure ReactFlow calculates different sourceX/targetX
4. **Debug why handle positioning fails** in our stack

## Critical Files
- `/src/viz/ReactFlowVisualizerV2/` - Clean implementation
- `/src/viz/ReactFlowInspector/SelfConnectingEdge.tsx` - Current broken version
- Edge creation logic in `useStateMachineEdges.ts`

## Key Insight
The problem is NOT the SelfConnectingEdge component - it's the ReactFlow setup/data pipeline that prevents proper handle coordinate calculation.
