# GOAL_TECH_DESIGN.md: Message Composer Demo Implementation

## Goal
Implement Fernando Rojo's "Composition is all you need" patterns using Matchina machinery to showcase React composition patterns with state machines.

## Technical Design Decisions

### 1. Machine Types & Scoping
- **Scoped machines**: Each component gets its own machine instance
- **Lower-scoped preferred**: Machines live at component/provider level, not global
- **Runtime construction**: Machines are constructed by providers, live as long as provider exists
- **Generic machines**: Same machine type, different initialization for different use cases

### 2. State Management Patterns

#### Ephemeral State (EditMessage, ForwardMessage)
- Local machine constructed by provider
- Lives only during component lifecycle
- Uses local state that dies with unmount

#### Synced State (Channel, Thread)
- Simulated global store that mocks cross-client syncing
- Multiple components on same page can simulate different clients
- Mock persistent channels/threads across "clients"
- Still uses scoped machines, but they read/write to shared mock store

### 3. Actions & API Design
- **Actions are demo concept, not lib concept**
- Lib doesn't care about actions - up to developer
- Two patterns to explore:
  - Actions on `meta` (passed through provider)
  - Actions on machine as API (machine.api)
- No action override in lib - that's application concern

### 4. Architecture Principles
- **No standalone store layer** - keep focused on React UI & composition
- **All backends mocked** - no real persistence, just simulation
- **Provider-scoped lifecycle** - machines constructed and die with providers
- **Composition over configuration** - JSX assembly, not boolean props

### 5. Code Structure
```
docs/src/code/examples/message-composer/
├── machines/
│   ├── composer-machine.ts        # Generic composer machine
│   └── global-store.ts           # Mock global store for synced state
├── providers/
│   ├── ComposerProvider.tsx      # Generic provider
│   └── GlobalStoreProvider.tsx   # Simulated sync state
├── components/
│   ├── ChannelComposer.tsx       # The 4 main demo exports
│   ├── ThreadComposer.tsx        # for MDX consumption
│   ├── EditMessageComposer.tsx
│   ├── ForwardMessageComposer.tsx
│   ├── CommonActions.tsx         # App-specific shared components
│   └── AlsoSendToChannel.tsx
└── ui/                           # Reusable primitives (non-app)
    ├── Frame.tsx
    ├── Header.tsx
    ├── Input.tsx
    ├── Footer.tsx
    └── DropZone.tsx
```

### 6. Machine Design Questions to Resolve

1. **What machine types make sense?**
   - Single `ComposerMachine` type with different initialization?
   - Or specialized machines (`ChannelMachine`, `EditMachine`, etc.)?

2. **State shape consistency?**
   - Common state interface across all composers?
   - Or allow different state shapes per use case?

3. **Mock global store pattern?**
   - Simple object store with observers?
   - Or more sophisticated event system?

4. **Actions placement preference?**
   - `meta.actions` pattern vs `machine.api` pattern?
   - Which feels more ergonomic for the demos?

## Next Steps
1. Define specific machine types needed
2. Design mock global store for synced state simulation
3. Create folder structure under `code/examples/message-composer/`
4. Implement UI primitives and demo composers
5. Export demo components for MDX consumption

## Success Criteria
- 4 working composer demo exports for MDX documentation
- Clear separation between ephemeral and "synced" state
- Demonstrates provider scoping and machine lifecycle
- Shows both actions patterns (meta vs machine API)
- Can simulate multiple clients on same page for synced demos
- Clean exports that MDX can import and display