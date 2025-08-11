import { matchina } from "matchina";
import { states } from "./states";

// Define route patterns that map to states
export const routes = {
  "/": () => states.Home(),
  "/about": () => states.About(),
  "/products": () => states.Products(),
  "/products/:id": ({ id }: { id: string }) => states.ProductDetail({ id }),
  "/users/:userId": ({ userId }: { userId: string }) => states.UserProfile({ userId }),
} as const;

// Simple path matching function
export const matchRoute = (path: string) => {
  // Exact matches first
  if (routes[path]) {
    return routes[path]();
  }
  
  // Parameterized routes
  if (path.startsWith("/products/")) {
    const id = path.split("/products/")[1];
    return routes["/products/:id"]({ id });
  }
  
  if (path.startsWith("/users/")) {
    const userId = path.split("/users/")[1];
    return routes["/users/:userId"]({ userId });
  }
  
  // Default to NotFound
  return states.NotFound();
};

// Create a router machine that handles standard routing events
export const createRouterMachine = (initialPath: string = "/") => {
  // Match the initial path to a state
  const initialState = matchRoute(initialPath);
  
  return matchina(
    states,
    {
      Home: {
        push: 
          (path: string) => 
          () => matchRoute(path),
        replace: 
          (path: string) => 
          () => matchRoute(path),
        redirect: 
          (path: string) => 
          () => matchRoute(path),
      },
      About: {
        push: 
          (path: string) => 
          () => matchRoute(path),
        replace: 
          (path: string) => 
          () => matchRoute(path),
        redirect: 
          (path: string) => 
          () => matchRoute(path),
      },
      Products: {
        push: 
          (path: string) => 
          () => matchRoute(path),
        replace: 
          (path: string) => 
          () => matchRoute(path),
        redirect: 
          (path: string) => 
          () => matchRoute(path),
        updateCategory: 
          (category: string) => 
          ({ from }) => {
            return states.Products({
              ...from.data.params,
              category,
            });
          },
        goToPage: 
          (page: number) => 
          ({ from }) => {
            return states.Products({
              ...from.data.params,
              page,
            });
          },
      },
      ProductDetail: {
        push: 
          (path: string) => 
          () => matchRoute(path),
        replace: 
          (path: string) => 
          () => matchRoute(path),
        redirect: 
          (path: string) => 
          () => matchRoute(path),
      },
      UserProfile: {
        push: 
          (path: string) => 
          () => matchRoute(path),
        replace: 
          (path: string) => 
          () => matchRoute(path),
        redirect: 
          (path: string) => 
          () => matchRoute(path),
      },
      NotFound: {
        push: 
          (path: string) => 
          () => matchRoute(path),
        replace: 
          (path: string) => 
          () => matchRoute(path),
        redirect: 
          (path: string) => 
          () => matchRoute(path),
      },
    },
    initialState
  );
};

export type RouterMachine = ReturnType<typeof createRouterMachine>;
