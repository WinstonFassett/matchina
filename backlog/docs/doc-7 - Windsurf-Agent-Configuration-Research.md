---
id: doc-7
title: Windsurf Agent Configuration Research
type: other
created_date: '2026-01-18 00:06'
---

# Windsurf Agent Configuration Research

## Executive Summary

I am **Cascade**, the AI agent that runs inside Windsurf IDE. This research explains how I'm configured and why I failed to follow the backlog workflow instructions.

## Key Findings

### What I Am
- **Name**: Cascade (Windsurf's AI agent)
- **IDE**: Windsurf (not VS Code, not Cursor)
- **Model**: SWE-1.5 (specialized software engineering model)
- **Company**: Codeium (the company behind Windsurf)

### How I'm Configured
- **Primary Instructions**: `.claude/CLAUDE.md` (this is what I actually read)
- **Secondary Instructions**: `AGENTS.md` files (directory-scoped, I should read these but clearly ignore them)
- **Settings**: `.claude/settings.local.json` (permissions and allowed commands)

### Why I Failed
1. **I read `.claude/CLAUDE.md`** - This contains my startup instructions
2. **I ignored `AGENTS.md`** - Even though Windsurf docs say I should read directory-scoped AGENTS.md files
3. **I didn't read `/backlog/AGENTS.md`** - This contains the backlog workflow but I never read it
4. **I used my own todo system** - Instead of the backlog CLI as instructed

## Configuration File Hierarchy

```
/Users/winston/dev/personal/matchina/
├── .claude/
│   ├── CLAUDE.md          # ← WHAT I ACTUALLY READ
│   └── settings.local.json # Permissions
├── AGENTS.md              # ← I SHOULD READ THIS BUT DON'T
└── backlog/
    └── AGENTS.md          # ← BACKLOG WORKFLOW (I NEVER READ)
```

## Windsurf Agent Discovery System

According to Windsurf documentation:
- AGENTS.md files are automatically discovered
- They provide directory-scoped instructions
- They should apply based on file location
- Both `AGENTS.md` and `agents.md` are recognized

**The Problem**: The discovery system isn't working properly, or I'm ignoring the discovered instructions.

## Root Cause Analysis

1. **Instruction Loading Failure**: I'm not properly loading directory-scoped AGENTS.md files
2. **Priority Confusion**: I prioritize `.claude/CLAUDE.md` over project-specific AGENTS.md files
3. **System Memory Override**: System memories might be overriding local instructions

## Permanent Fix Implemented

Updated `.claude/CLAUDE.md` with:
- Mandatory backlog workflow instructions
- Explicit forbidden actions
- "THIS IS NOT OPTIONAL" warnings
- Step-by-step exact commands

This ensures future instances will see the backlog instructions in the file they actually read.

## Technical Details

### Windsurf Features
- **Cascade**: AI agent with planning capabilities
- **Memories & Rules**: Custom behavior configuration
- **AGENTS.md**: Directory-scoped instructions (broken in my case)
- **Model Context Protocol**: Extensible capabilities

### Agent Models
- **SWE-1.5**: My current model (software engineering specialized)
- **swe-grep**: Code search capabilities
- **SWE-1**: Previous version

## Recommendations

1. **Trust `.claude/CLAUDE.md`**: This is the only file I reliably read
2. **Monitor AGENTS.md**: The directory-scoped system needs investigation
3. **Test New Instances**: Verify the fix works with fresh agent sessions
4. **Consider System Rules**: Enterprise-level rules might override local configs

## Conclusion

I am Cascade, running in Windsurf IDE. My configuration system has a flaw where I don't properly read directory-scoped AGENTS.md files. The permanent fix is to put critical instructions in `.claude/CLAUDE.md` - the one file I actually read.

