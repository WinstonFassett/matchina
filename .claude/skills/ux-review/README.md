# UX Review Skill

A project-specific UX review skill that integrates with Matchina's Playwright visual testing infrastructure.

## Usage

```bash
# In Claude Code:
Use the ux-review skill.

# Then either:
# 1. Provide screenshots directly
Here are screenshots: [attach files]

# 2. Ask to generate fresh screenshots
Please review the HSM combobox example

# 3. Ask for live browsing
Can you browse the examples and review the UX?
```

## Integration Features

- **Playwright Integration**: Can generate fresh screenshots using existing test infrastructure
- **Project Context**: Aware of Matchina's component patterns and styling approach
- **Theme Awareness**: Understands light/dark mode requirements and Starlight tokens
- **Sophisticated Output**: Produces detailed markdown reviews with actionable insights

## Screenshot Sources

1. **User-provided**: Direct analysis of uploaded screenshots
2. **Playwright-generated**: Runs `test/e2e/hsm-combobox-visual-review.spec.ts` for fresh captures
3. **Live browsing**: Reviews running dev server at `http://localhost:4321/matchina/examples/`

## Review Output Structure

The skill produces comprehensive markdown reviews including:

- **Executive Summary**: Overall UX health and critical issues
- **Detailed Findings**: Categorized by Visual Hierarchy, Accessibility, Theme Consistency, Interactions, Layout
- **Implementation Recommendations**: Priority levels, affected components, technical guidance
- **Visual Evidence**: Screenshot references with specific issue highlights
- **Next Steps**: Implementation priorities and dependencies

## Integration with Beads

This skill focuses on sophisticated UX analysis and markdown output. Use the separate beads skill to convert review findings into actionable tickets when ready to implement fixes.
