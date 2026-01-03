# Type Inference Issues in Matchina Library

## Core Problem
The library is supposed to provide ergonomic APIs with proper typing, but we're having to fight it with workarounds. These are the issues that should be handled by the library itself.

## Issues Found

### 1. Machine Method Type Inference
**Problem**: `machine.success(data)` calls fail with "Expected 0 arguments, but got 1"
**Expected**: Library should infer that `success` method accepts parameters based on machine definition
**Current Workaround**: Manually adding ergonomic methods to machine
**Files Affected**: auth-flow, checkout

### 2. State Data vs Store Data Confusion  
**Problem**: Examples mix `state.data` and `machine.store.getState()` patterns
**Expected**: Library should provide clear, consistent patterns for data access
**Current Workaround**: Manually converting all data access to use store
**Files Affected**: auth-flow, checkout, rock-paper-scissors

### 3. Form Component Parameter Passing
**Problem**: Form components receive `data` parameter but should access store directly
**Expected**: Library should handle form data binding to stores automatically
**Current Workaround**: Removing `data` parameters and accessing store manually
**Files Affected**: auth-flow forms

### 4. Transition Hook Type Stripping
**Problem**: `transitionHooks` appears to strip enhanced ergonomics API from machines
**Expected**: Library should preserve ergonomic methods regardless of setup approach
**Current Workaround**: Using `effect` instead of `transitionHooks`
**Files Affected**: auth-flow

### 5. Component Props Type Mismatch
**Problem**: Components expect different data patterns than what machines provide
**Expected**: Library should provide consistent typing between machines and components
**Current Workaround**: Manual type conversions and optional chaining
**Files Affected**: Multiple examples

## Root Cause Analysis
The library seems to have incomplete type inference for:
- Machine method signatures based on transition definitions
- Data flow between states, stores, and components  
- Consistent ergonomic APIs across different setup patterns

## Recommended Library Fixes
1. **Enhance machine method type inference** - `machine.success(data)` should work based on transitions
2. **Standardize data access patterns** - Clear guidance on `state.data` vs `store.getState()`
3. **Improve component integration** - Better typing between machines and React components
4. **Fix transition hook typing** - Preserve ergonomic APIs regardless of setup method
5. **Add form data binding** - Automatic store integration for form components

## Current Status
We're hacking around these issues instead of fixing them in the library. This defeats the purpose of having a type-safe state machine library.
