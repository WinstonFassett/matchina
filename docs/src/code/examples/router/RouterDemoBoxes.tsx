import React, { useEffect, useMemo, useState } from "react";
import { createBrowserRouter } from "@lib/src/router-history";
import { defineRouteBoxes, goto, replaceWith } from "./defineRouteBoxes";

// Define your named route patterns (typed)
const { routes, match } = defineRouteBoxes({
  Home: "/",
  About: "/about",
  Products: "/products",
  Product: "/products/:id",
  User: "/users/:userId",
} as const);

// Create browser router (store + history) with our matcher
const { store, history } = createBrowserRouter({
  match: async (path: string) => {
    const inst = match(path);
    return inst ? (inst.params as Record<string, unknown>) : null;
  },
});

export const RouterDemoBoxes: React.FC = () => {
  // Simple polling to keep demo self-contained (no subscribe API on store)
  const [snap, setSnap] = useState(() => store.getState());
  useEffect(() => {
    const id = setInterval(() => setSnap(store.getState()), 100);
    history.start();
    return () => clearInterval(id);
  }, []);

  const currentPath = useMemo(() => {
    const cur = snap.stack[snap.index];
    return cur?.path ?? "/";
  }, [snap]);

  const currentBox = useMemo(() => match(currentPath), [currentPath]);

  return (
    <div>
      <h2>Matchbox Router Demo</h2>
      <p>Status: {snap.status}</p>
      <p>Current: {currentPath}</p>

      <nav style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => goto(routes.Home({}), history.push)}>Home</button>
        <button onClick={() => goto(routes.About({}), history.push)}>About</button>
        <button onClick={() => goto(routes.Products({}), history.push)}>Products</button>
        <button onClick={() => goto(routes.Product({ id: "42" }), history.push)}>Product 42</button>
        <button onClick={() => goto(routes.User({ userId: "winston" }), history.push)}>User winston</button>
        <button onClick={() => history.back()}>Back</button>
        <button onClick={() => replaceWith(routes.User({ userId: "z" }), history.replace)}>Replace</button>
      </nav>

      <section style={{ padding: 12, border: "1px solid #ddd" }}>
        {currentBox?.match({
          Home: () => <div><h3>Home</h3><p>Welcome!</p></div>,
          About: () => <div><h3>About</h3><p>About this app.</p></div>,
          Products: () => (
            <div>
              <h3>Products</h3>
              <button onClick={() => goto(routes.Product({ id: "abc" }), history.push)}>
                View Product abc
              </button>
            </div>
          ),
          Product: ({ id }) => (
            <div>
              <h3>Product</h3>
              <p>ID: {id}</p>
              <button onClick={() => goto(routes.Products({}), history.push)}>Back to list</button>
            </div>
          ),
          User: ({ userId }) => (
            <div>
              <h3>User</h3>
              <p>ID: {userId}</p>
            </div>
          ),
          _: () => <div><h3>Unknown</h3></div>,
        })}
      </section>

      <pre style={{ marginTop: 12, fontSize: 12 }}>
        {JSON.stringify(snap, null, 2)}
      </pre>
    </div>
  );
};
