# Next Session

**Branch**: Merge `hierarchical-machines-with-viz-r5` to `main`, then work post-merge tickets

---

## Immediate: Merge Decision

See `MERGE-READINESS.md` for full assessment.

**TL;DR**: Branch is ready. Pre-merge tasks complete. Known issues are acceptable or tracked.

### To Merge

```bash
git checkout main
git merge hierarchical-machines-with-viz-r5
# Resolve any conflicts
git push
```

---

## Post-Merge Work Queue

Priority order:

| Priority | Ticket | Task |
|----------|--------|------|
| P1 | matchina-dx0 | Implement `.extend()` on FactoryMachine |
| P1 | matchina-2c5 | Create `withEventApi` extension function |
| P2 | matchina-1ve | StoreMachine guide and example |
| P2 | matchina-p4g | Design manifest format for visualization |
| P2 | matchina-3sj | Create `matchina/inspect` subpath |
| P3 | matchina-hi7 | Type system Phase 2 (FlattenFactoryStateKeys) |
| P3 | matchina-9zh | Externalize visualizers from docs |

### Suggested Session Flow

1. **Session N**: Merge to main, start `.extend()` implementation
2. **Session N+1**: Complete `.extend()`, create `withEventApi`
3. **Session N+2**: StoreMachine docs OR manifest design (user choice)
4. **Future**: Visualizer externalization, type Phase 2

---

## Reference Docs

| Doc | Purpose |
|-----|---------|
| `MERGE-READINESS.md` | Merge decision checklist |
| `18-work-plan.md` | Full work breakdown |
| `05-types.md` | Type optimization status |
| `12-api-brainstorm.md` | `.extend()` design notes |
| `14-visualizers.md` | Viz infrastructure review |

---

## User Preferences

- Make it work. Do not get fancy.
- Tree-shakeable, à la carte imports
- Good TS support is most important
- Flattening > propagation for HSM
- Viz should not mandate React
