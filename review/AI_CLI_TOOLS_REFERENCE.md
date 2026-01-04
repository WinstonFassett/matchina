# AI CLI Tools Reference

**Date**: 2026-01-04
**Purpose**: Comprehensive reference for AI CLI tools available in the Matchina development environment
**Source**: Research of codebase configuration and Agent-Orchestration-Analysis.md

## 🔧 Local AI Tools (Ollama)

### Configuration
- **Model**: `llava` (multimodal vision-language model)
- **Runner**: Ollama CLI
- **Purpose**: Visual analysis and screenshot review for UI development

### Available Scripts

#### `scripts/visual-agent.cjs`
- **Purpose**: Production workflow for visual analysis of Matchina state machines
- **Usage**: Automated visual testing and feedback
- **Features**: Local, private analysis with no API costs

#### `scripts/comprehensive-visual-audit.cjs`
- **Purpose**: Detailed visual auditing of UI components
- **Usage**: Comprehensive visual quality assessment
- **Output**: JSON analysis with containment, overlaps, hierarchy, and clipping metrics

#### `scripts/multi-visualizer-comparison.cjs`
- **Purpose**: Side-by-side comparison of visualizer implementations
- **Usage**: Comparing ReactFlow vs ForceGraph vs Mermaid renderings
- **Features**: Automated comparison workflows

#### `scripts/adversarial-visual-comparison.cjs`
- **Purpose**: Adversarial testing of visual implementations
- **Usage**: Stress-testing visual components under edge conditions

#### `scripts/context-optimized-visual-agent.cjs`
- **Purpose**: Context-aware visual optimization
- **Usage**: Intelligent visual analysis with context optimization

### Ollama Commands
```bash
# Basic usage
ollama run llava "analyze this screenshot"

# With image input
ollama run llava < /path/to/screenshot.png

# From scripts (typical usage)
const ollama = spawn('ollama', ['run', 'llava', imagePath], {
  stdio: ['pipe', 'pipe', 'pipe']
});
```

## 🌐 Hosted AI CLI Tools

### Claude Code (`claude-code`)
- **Provider**: Anthropic
- **Purpose**: Advanced reasoning, architecture work
- **Strengths**: Complex reasoning, architectural decisions, code planning
- **Typical Usage**:
  ```bash
  claude-code --fix="ReactFlow layout"
  claude-code --task="implement new feature"
  ```

### OpenCode (`opencode`)
- **Provider**: Independent
- **Purpose**: Fast, multi-agent parallel development
- **Strengths**: Speed, parallel processing, multi-agent coordination
- **Typical Usage**:
  ```bash
  opencode --swarm  # Parallel coding tasks
  opencode --multi  # Multi-agent workflows
  ```

### Gemini CLI (`gemini-cli`)
- **Provider**: Google
- **Purpose**: Research, web search, information gathering
- **Strengths**: Web research, documentation lookup, information synthesis
- **Typical Usage**:
  ```bash
  gemini-cli --search "API documentation"
  gemini-cli --research "best practices"
  ```

### AmpCode (`ampcode`)
- **Provider**: Independent
- **Purpose**: Specialized code refactoring and transformation
- **Strengths**: Automated refactoring, code restructuring, optimization
- **Typical Usage**:
  ```bash
  ampcode --refactor "optimize performance"
  ampcode --transform "modernize syntax"
  ```

## 🔄 Integration Patterns

### Preferred Workflow: Direct CLI Integration
```bash
# Simple, fast workflow (recommended for 95% of tasks)
Windsurf: "Fix ReactFlow layout"
→ claude-code --fix="ReactFlow layout"
→ Result integrated directly
```

### Smart Task Routing
```python
def route_task(prompt):
    if "architecture" in prompt or "design" in prompt:
        return "claude-code"
    elif "parallel" in prompt or "multi-agent" in prompt:
        return "opencode --swarm"
    elif "research" in prompt or "docs" in prompt:
        return "gemini-cli"
    elif "refactor" in prompt or "optimize" in prompt:
        return "ampcode"
    else:
        return "windsurf"  # Default
```

### Orchestration with Beads (Complex Cases Only)
```bash
# Only for genuinely complex work (>30 minutes, multi-person, paid work)
bd create "Complex refactoring task" -p 0
claude-code --task="bd-abc123"
bd update bd-abc123 --status=completed
bd close bd-abc123
bd sync --flush-only
```

## 📊 Efficiency Comparison

| Approach | Setup Time | Task Time | Mental Overhead | Use Case |
|----------|------------|-----------|-----------------|----------|
| **Direct Windsurf** | 0s | 5s | Low | 95% of tasks |
| **Direct CLI** | 30s | 10s | Medium | Specialized tasks |
| **Beads Orchestration** | 5min | 30s+ | High | Complex projects only |

## 🎯 When to Use Each Tool

### Claude Code
- ✅ Architecture decisions
- ✅ Complex reasoning tasks
- ✅ Code planning and design
- ✅ Multi-step feature implementation

### OpenCode
- ✅ Fast prototyping
- ✅ Parallel development tasks
- ✅ Multi-agent workflows
- ✅ Rapid iteration cycles

### Gemini CLI
- ✅ API research and documentation
- ✅ Web information gathering
- ✅ Best practices lookup
- ✅ Technical documentation synthesis

### AmpCode
- ✅ Code refactoring and cleanup
- ✅ Automated transformations
- ✅ Performance optimization
- ✅ Code modernization

### Ollama (Local)
- ✅ Visual UI analysis
- ✅ Screenshot review and feedback
- ✅ Private, offline analysis
- ✅ No API costs or rate limits

## 🚫 Anti-Patterns to Avoid

### Over-Engineering
```bash
# ❌ Don't do this for simple tasks
bd create "Fix typo" -p 1
claude-code --task="bd-abc123"
bd update bd-abc123 --status=done

# ✅ Do this instead
claude-code --fix="typo in README"
```

### Process for Process' Sake
- Don't create workflows that don't solve real problems
- Don't add tracking "just in case"
- Don't optimize for hypothetical future needs

## 📋 Setup Requirements

### Ollama (Local AI)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull LLaVA model
ollama pull llava

# Verify installation
ollama list
```

### Hosted AI CLI Tools
- `claude-code`: Requires Anthropic API key
- `opencode`: Independent service
- `gemini-cli`: Requires Google API key
- `ampcode`: Independent service

## 🔄 Workflow Integration

### With Windsurf
1. **Direct Integration**: Windsurf can invoke CLI tools via shell commands
2. **Cascade Hooks**: Windsurf's hook system enables automated tool invocation
3. **MCP Integration**: Model Context Protocol support for external tool connections

### Task Complexity Decision Tree
```
Is task > 30 minutes?
├── YES → Consider beads orchestration
└── NO → Direct CLI integration

Is task research-focused?
├── YES → gemini-cli
└── NO → Continue

Is task architecture/complex reasoning?
├── YES → claude-code
└── NO → Continue

Is task parallel/multi-agent?
├── YES → opencode --swarm
└── NO → Continue

Is task refactoring/transformation?
├── YES → ampcode
└── NO → Default to Windsurf
```

## 📈 Performance Characteristics

### Speed Rankings
1. **Ollama** (local): ~2-5 seconds for visual analysis
2. **OpenCode**: Fastest hosted solution
3. **Claude Code**: Moderate speed, high quality
4. **Gemini CLI**: Variable, depends on query complexity
5. **AmpCode**: Moderate, depends on transformation scope

### Cost Rankings
1. **Ollama**: Free (local compute only)
2. **OpenCode**: Low cost
3. **AmpCode**: Low-moderate cost
4. **Gemini CLI**: Variable (API-based)
5. **Claude Code**: Higher cost (premium reasoning)

## 🔮 Future Considerations

### When Orchestration Might Become Valuable
- AI agents become more specialized and coordination becomes valuable
- Team sizes grow and real coordination problems emerge
- Projects become more complex and dependency tracking is essential
- Regulatory requirements mandate audit trails

### Signals to Re-evaluate Tool Choices
- Regularly losing context between sessions
- Multiple people working on the same codebase
- Tasks getting blocked by dependencies
- Need to explain who did what when

---

**Status**: Reference documentation complete
**Last Updated**: 2026-01-04
**Maintained by**: Development team</content>
<parameter name="filePath">review/AI_CLI_TOOLS_REFERENCE.md