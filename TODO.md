# TODO: Finalize Project for Release

## 1. Examples Handling
- [ ] Decide on best location for examples (root, docs/examples, or packages/examples if monorepo)
- [ ] Ensure examples are type-checked in CI (script or as part of docs build)
- [ ] Ensure examples are not included in npm package
- [ ] Confirm best way to import both raw and rendered code in Astro/Starlight
- [ ] Consider alternatives (StackBlitz, Sandpack) and document pros/cons

## 2. Types Review
- [ ] Audit `matchbox.ts`, `types.ts`, and other files for type quality and usage
- [ ] Document findings and recommendations in dev docs

## 3. Documentation Improvements
- [ ] Review and improve guides and structure
- [ ] Update `docs/README.md` to clarify structure and usage
- [ ] Consider moving examples into docs if it simplifies things

## 4. Dependency Management
- [ ] Audit dependencies for both root and docs
- [ ] Remove unused or experimental dependencies
- [ ] Ensure clean separation between lib, docs, and examples

## 5. NPM Publishing
- [ ] Clarify what is and isn’t published to npm
- [ ] Ensure only the library (not docs/examples) is published

## 6. General Cleanup
- [ ] Prune unused code and experimental features
- [ ] Make experimental features clearly marked or move to a separate area

---

_This file is a working plan. Delete when project is finalized._
