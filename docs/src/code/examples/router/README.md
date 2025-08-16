# Router Example

This example demonstrates how to build a lightweight, type-safe router using matchina.

## Overview

The router machine manages navigation between different pages in an application:
- Home
- About
- Products (with category, page, and search parameters)
- Product Detail (with ID parameter)
- Cart
- Checkout
- NotFound

## Key Features

- **Type Safety**: All routes and their parameters are fully typed
- **State Management**: Each route can have its own data parameters
- **Navigation**: Type-safe navigation between routes
- **Parameter Updates**: Ability to update route parameters while staying on the same route

## Usage

```typescript
import { createRouterMachine } from "./machine";

const router = createRouterMachine();

// Navigate to different routes
router.navigateToHome();
router.navigateToAbout();
router.navigateToProducts();

// Update route parameters
router.updateSearch("laptop");
router.updateCategory("electronics");
router.goToPage(2);

// Access current route data
console.log(router.current.key); // "Products"
console.log(router.current.data); // { category: "electronics", page: 2, searchTerm: "laptop" }
```
