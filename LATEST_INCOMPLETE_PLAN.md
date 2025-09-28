
  Implementation Plan

  Phase 0: Clean Up Current State

  1. Create commit for current stubbed work
    - Review git status and stage appropriate files
    - Conventional commit for the planning/stub work done so far
  2. Test: User runs docs to verify current state works

  Phase 1: Foundation Layer

  3. Create folder structure under docs/src/code/examples/message-composer/
  4. Implement generic ComposerMachine with basic state (input, attachments, metadata)
  5. Create mock global store for synced state simulation
  6. Commit: feat: add composer machine and global store foundation
  7. Run npm run build:lib to update lib dependency
  8. Test: User runs docs to verify no breakage

  Phase 2: Simple All-in-One Demo (No Composition)

  9. Build basic UI primitives (Frame, Input, Footer)
  10. Create SimpleComposer - single component with boolean props
    - Uses machine directly, no context
    - Boolean props like showDropZone, showEmoji, isEditMode
  11. Create demo wrapper component for MDX consumption
  12. Commit: feat: add simple composer demo with boolean props
  13. Add simple demo to MDX page
  14. Commit: docs: add simple composer to react composition guide
  15. Test: User runs docs to verify Astro page works, simple demo renders

  Phase 3: React Integration Layer (Composition Setup)

  16. Create contexts/scopes using createMachineContext helper
  17. Commit: feat: add composer contexts for composition patterns
  18. Run npm run build:lib only if lib changes needed
  19. Test: User runs docs to verify no breakage

  Phase 4: Composition Demos (Incremental - One at a time)

  20. Create EditMessageComposer (composition version)
  21. Commit: feat: add edit message composer with composition
  22. Add to MDX
  23. Commit: docs: add edit composer demo and comparison
  24. Test: User runs docs
  25. Create ChannelComposer (synced state)
  26. Commit: feat: add channel composer with synced state
  27. Add to MDX
  28. Commit: docs: add channel composer demo
  29. Test: User runs docs

  (Continue pattern for Thread and Forward composers...)

  Important Notes:

  - User will do NOT test or run anything except npm run build:lib when needed
  - I test docs after each phase
  - Ask me about TypeScript if User will need info/verification
  - Conventional commits for each logical chunk
  - One demo added to MDX at a time for incremental testing