# Failure Registry
**Purpose**: Systematic documentation of critical failures to prevent repetition  
**Location**: `review/failure-registry/`  
**Maintainers**: AI Agents working on Matchina  

---

## 🎯 **Purpose**

This registry exists to capture critical failures, their root causes, solutions, and prevention measures. It's designed to help agents learn from mistakes and avoid repeating them.

---

## 📁 **Registry Structure**

```
review/failure-registry/
├── README.md                    # This file - registry overview
├── visual-testing-failures.md  # Visual system failures
├── build-system-failures.md     # Build/script failures (when created)
├── architecture-failures.md      # Architecture/design failures (when created)
└── template-failure.md          # Template for new failure entries
```

---

## 📋 **Failure Entry Template**

Copy `template-failure.md` for new entries. Each entry should include:

### Required Sections:
- **Failure Summary** - What, when, severity, impact
- **What Went Wrong** - Detailed failure description
- **Root Cause Analysis** - Immediate and systemic causes
- **Solution Implemented** - How it was fixed
- **Lessons Learned** - Key takeaways and principles
- **Prevention Measures** - Checklist and protocols
- **Related Documentation** - Links to relevant files
- **Future Improvements** - Automation and knowledge sharing

### Format:
- Use **VTF-XXX** IDs (Visual Testing Failure), **BSF-XXX** (Build System), etc.
- Include dates, severity levels, status tracking
- Provide code examples of wrong vs right approaches
- Add red flags and prevention checklists

---

## 🔍 **Using This Registry**

### Before Starting Work:
1. **Check relevant failure entries** - look for similar past issues
2. **Review prevention checklists** - apply lessons learned
3. **Use shared infrastructure** - avoid reinventing solutions

### During Work:
1. **Watch for red flags** - early warning signs from past failures
2. **Follow prevention protocols** - use established patterns
3. **Document new issues** - add to registry if discovered

### After Completion:
1. **Update registry** - document any new failures encountered
2. **Share learnings** - add to team knowledge base
3. **Improve checklists** - add new prevention measures

---

## 📊 **Failure Categories**

### Visual Testing (VTF)
- Screenshot capture issues
- Visualizer selection problems
- AI analysis failures
- Selector/validation issues

### Build System (BSF)
- Script execution failures
- Dependency management issues
- Build configuration problems
- Environment setup failures

### Architecture (AF)
- Design pattern failures
- Integration issues
- Performance bottlenecks
- Scalability problems

### Testing (TF)
- Test infrastructure failures
- Mock/stub issues
- Coverage gaps
- Test reliability problems

---

## 🔄 **Maintenance**

### Regular Reviews:
- **Monthly**: Review recent failures for patterns
- **Quarterly**: Update prevention protocols
- **Annually**: Archive old failures, update templates

### When to Add Entries:
- **Critical failures** that block work
- **Systemic issues** that could recur
- **Learning opportunities** with broad applicability
- **Infrastructure gaps** that need addressing

---

## 🎯 **Success Metrics**

### Registry Effectiveness:
- **Reduced failure repetition** - same issues not recurring
- **Faster problem resolution** - quicker identification of root causes
- **Better prevention** - proactive issue avoidance
- **Knowledge sharing** - team learning from past mistakes

### Quality Indicators:
- **Comprehensive entries** with actionable insights
- **Cross-referenced solutions** linking to working code
- **Updated checklists** reflecting current best practices
- **Active maintenance** with regular reviews

---

## 📚 **Related Documentation**

- `test/e2e/utils/test-helpers.ts` - Shared test infrastructure
- `docs/DEVELOPMENT.md` - Development patterns and best practices
- `AGENTS.md` - Agent guidelines and command references
- Individual project documentation for context

---

*This registry is a living document of our collective learning. Treat it as essential infrastructure for preventing repeated failures.*

**Created**: January 4, 2026  
**Maintained by**: AI Agents working on Matchina  
**Review frequency**: Monthly or as needed
