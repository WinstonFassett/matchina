# Smart Vision Prompts
**Built-in Intelligence for Visual Analysis**

---

## 🧠 **The "This Looks Wrong" Prompt Template**

### **For Graph Visualizer Analysis**:
```
I'm showing you a screenshot that should contain a graph visualization (ReactFlow, ForceGraph, or Mermaid) showing a toggle state machine with parallel edges.

WHAT I EXPECT TO SEE:
- Nodes (circles/rectangles) representing states like "toggle", "off", "on"
- Edges (lines/curves) connecting these nodes
- Labels on or near edges showing transitions
- Clean graph layout, not app interface

IF THIS LOOKS WRONG: Tell me "This looks wrong" (or "Wait a minute", "Hold on", "That's not right") and explain:
- What you actually see vs what I expected
- How it differs from a proper graph visualization
- What might have gone wrong with the capture

Examples of "wrong" responses:
- "This looks wrong - I see app interface elements instead of graph nodes"
- "Wait a minute - this appears to be browser chrome, not a visualization"
- "That's not right - I see navigation bars, not graph edges"
- "Hold on - this doesn't match what I expected to see"

Now analyze what you actually see:
```

### **For Edge Routing Quality**:
```
I'm showing you a graph visualization that should show parallel edge routing between nodes.

WHAT I EXPECT TO SEE:
- Multiple edges between the same pair of nodes
- Curved paths that separate from each other
- Clear visual distinction between parallel edges
- Professional graph visualization

IF THE EDGE ROUTING LOOKS WRONG: Tell me "This looks wrong" (or "Wait a minute", "Hold on", "That's not right") and explain:
- What's actually happening with the edges
- How it differs from proper parallel edge separation
- What the specific problem is

Examples of "wrong" responses:
- "This looks wrong - the parallel edges are completely overlapping"
- "Wait a minute - I see straight lines instead of curved separation"
- "That's not right - edges are not separated at all"
- "Hold on - the edge routing doesn't match what I expected"

Now analyze the edge routing quality:
```

---

## 🔍 **Built-in Verification Questions**

### **Always Include These**:
1. **"Does this match what I expected to see?"**
2. **"Are there clear nodes and edges visible?"**
3. **"If this looks wrong, tell me what's actually wrong"**
4. **"Should I capture a different screenshot?"**

### **Expected Response Patterns**:
- **Good**: "I can see a graph with nodes and edges as expected"
- **Wrong**: "This looks wrong - I see [actual content] instead of [expected content]"
- **Wrong**: "Wait a minute - this appears to be [wrong thing], not [expected thing]"
- **Wrong**: "That's not right - I'm seeing [problem] instead of [expectation]"
- **Uncertain**: "I'm not sure - this might not be the right capture"

---

## 🎯 **Examples of Smart Prompts**

### **Instead of**:
```
"Analyze this ReactFlow visualization"
```

### **Use**:
```
"I'm showing you a ReactFlow visualization that should show parallel edge routing. 

WHAT I EXPECT: nodes, edges, curved paths for parallel edges
IF WRONG: Tell me "This looks wrong" and explain what you actually see

Now analyze:"
```

---

## 🚨 **The Key Insight**

**Build the skepticism into the prompt itself.**

Don't ask "what do you see?" - ask "is this actually what I think it is, or did I fuck up the capture?"

Make Ollama your quality control partner, not just a description tool.

---

*This approach builds basic intelligence into the AI interaction, making it actively look for problems instead of just describing what it sees.*
