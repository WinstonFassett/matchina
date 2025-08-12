import { createReactRouter } from "./reactRouter";

// Central, pre-bound router instance for the docs demo
export const {
  RouterProvider,
  Routes,
  Route,
  Outlet,
  Link,
  // RouteLayouts,
  useRouter,
  useRoute,
  useNavigation,
  store,
  history,
  routes: routeDefs,
} = createReactRouter({
  Home: "/",
  About: "/about",
  Products: "/products",
  Product: "/products/:id",
  ProductOverview: "/products/:id/overview",
  ProductSpecs: "/products/:id/specs",
  ProductReviews: "/products/:id/reviews",
  User: "/users/:userId",
}, {
  useHash: true,
});
