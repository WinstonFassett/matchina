# Product

## Register

brand

## Users

TypeScript developers — intermediate to expert — who write stateful logic daily and feel the friction of verbose state machine libraries. They evaluate Matchina by reading the docs once, running an example, and deciding whether the primitives fit their mental model. They are opinionated about library size, type safety, and API ergonomics. They do not need to be sold to with marketing copy; they need to be shown working code and convinced the abstractions are right.

## Product Purpose

Matchina is a nanolib state machine runtime: composable primitives, zero dependencies, 3.42 kB gzipped, end-to-end TypeScript inference. It was built as an alternative to XState — less ceremony, stronger types, expressive pattern matching. The docs site is the product's primary surface: it must teach the library through live interactive examples (many variations of the same concept, e.g. a dozen stopwatch implementations), demonstrate hierarchical state machines, and show off the visualization layer. Currently mid-redesign using the Editorial direction from ui26.

## Brand Personality

Technical, precise, understated. Confident, not loud. Terse. Declarative statements, no exclamation marks. The library is small and correct; the docs should feel the same way.

## References

- **Kibo UI** — favorite design system and docs; the aesthetic bar
- **XState docs** — not bad; comprehensive, system-thinking energy
- **Linear / Raycast** — the spirit: sharp tool for serious professionals, high craft, opinionated
- **Claude Design** — used as a direct design source for the Editorial direction (see `/Users/winston/Downloads/matchina-starlight-redesign-ui26`)
- **ui26 design system** — the peer design system in `../ui26`; Editorial theme is the approved direction for all Matchina surfaces

## Anti-references

- Anything that reads as "AI made that" — clichéd SaaS hero sections, gradient text, hero-metric templates, identical card grids
- Verbose, certification-heavy docs energy (heavy sidebars, bureaucratic information architecture)
- Warm/consumer aesthetics — this is not a beginner tool, not trying to be friendly to non-developers
- Heavy decoration, shadows, glassmorphism

## Visual Direction

Editorial theme only (for now). Key constraints from ui26:
- **Newsreader** (serif) for display headings and stat numerals; **Geist** sans for UI; **Geist Mono** for code, eyebrows, badges, metadata
- Warm off-white light (`#f6f5f1`) / near-black dark (`#0e0e0f`); fog blue accent (`#8ab4d8`)
- Sharp corners — no radius above 2px
- 1px hairline rules for all structure; no drop shadows
- ALL-CAPS mono for eyebrows and labels
- Sentence case everywhere else; no Title Case; no em dashes with spaces (use ` — ` per ui26 convention or restructure)

## Design Principles

1. **Show, don't sell.** Every design decision should make the live examples and code easier to read and run. The docs exist to demonstrate the library; the aesthetics exist to serve that demonstration.
2. **Earn every pixel.** Small library, small docs surface. No section exists unless it carries weight. No copy restates the heading above it.
3. **Expert confidence.** The reader writes TypeScript daily. Treat them as a peer. No hand-holding copy, no beginner scaffolding, no unnecessary introductions.
4. **Theme coherence over completeness.** The multi-theme system is a capability showcase, but Editorial is the canonical direction. Every design decision should look correct in Editorial first.
5. **Dense, not cluttered.** Compact layout, tight rhythm, information-forward hierarchy. Breathing room is deliberate, not default.

## Accessibility & Inclusion

Best effort, no hard compliance target. Maintain readable contrast, logical focus order, and reduced-motion support given the number of live interactive visualizations on the page.
