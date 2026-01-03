# Auth Flow Example Redesign

## Current Problems
- Mixed patterns: Some parts use stores, others try to pass data inline
- Type inference issues with `machine.success(data)` 
- Inconsistent data access (sometimes `state.data`, sometimes store)
- Fighting the library instead of showcasing it elegantly

## Design Goals

### 1. Simple Machine
- All states are `undefined` (no parameters)
- All transitions are simple strings
- Machine logic is minimal and clean

### 2. Store for All Data
- Form fields: email, password, name
- User data: id, name, email, avatar  
- Error messages
- Loading states

### 3. Elegant API
```typescript
machine.success(user)  // Updates store with user data
machine.failure(error) // Updates store with error message
machine.login()         // Triggers login transition
machine.register()      // Triggers register transition
```

### 4. Clean Data Flow
- Machine methods handle store updates
- View reads from store only
- No inline data passing to transitions
- No type casts needed

## Implementation Plan

### Machine Structure
```typescript
const machine = matchina(states, transitions, "LoggedOut");

// Add ergonomic methods that update the store
machine.success = (user: User) => {
  store.dispatch("setUser", user);
  machine.send("success");
};

machine.failure = (error: string) => {
  store.dispatch("setError", error);  
  machine.send("failure");
};

return Object.assign(machine, { store });
```

### Store Structure
```typescript
interface AuthStore {
  email: string;
  password: string;
  name: string;
  user: User | null;
  error: string | null;
}
```

### View Pattern
```typescript
// Always read from store
const storeData = machine.store.getState();

// Use ergonomic methods
machine.success({ id: "123", name: "Demo", email: "demo@example.com" });
machine.failure("Invalid credentials");

// Simple transitions
machine.login();
machine.register();
```

## Benefits
- Showcases elegant matchina patterns
- No type fighting or casts
- Clean separation of concerns
- Demonstrates store + machine integration
- Maintains strong typing throughout
