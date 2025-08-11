import React from "react";
import { createReactRouter } from "./reactAdapter";

// Declare routes once (typed)
const {
  RouterProvider,
  Routes,
  Route,
  Link,
  useNavigation,
} = createReactRouter({
  Home: "/",
  About: "/about",
  Products: "/products",
  Product: "/products/:id",
  User: "/users/:userId",
} as const, {
  // Hash routing keeps us on the same Astro page under /matchina/router-demo
  useHash: true,
  base: "/matchina/router-demo",
});

const Home: React.FC = () => <div><h3>Home</h3><p>Welcome!</p></div>;
const About: React.FC = () => <div><h3>About</h3><p>About this app.</p></div>;

const Products: React.FC = () => {
  const nav = useNavigation();
  return (
    <div>
      <h3>Products</h3>
      <button onClick={nav.goto("Product", { id: "42" })}>View Product 42</button>
      <button onClick={nav.goto("Product", { id: "abc" })} style={{ marginLeft: 8 }}>View Product abc</button>
    </div>
  );
};

const Product: React.FC = () => {
  const nav = useNavigation();
  return (
    <div>
      <h3>Product</h3>
      <p>Use the browser back or buttons to navigate.</p>
      <button onClick={nav.goto("Products")}>Back to list</button>
    </div>
  );
};

const User: React.FC = () => <div><h3>User</h3></div>;

export const RouterDemoIdiomatic: React.FC = () => {
  return (
    <RouterProvider>
      <div>
        <h2>Idiomatic Router Demo</h2>
        <nav style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Link name="Home">Home</Link>
          <Link name="About">About</Link>
          <Link name="Products">Products</Link>
          <Link name="Product" params={{ id: "42" }}>Product 42</Link>
          <Link name="User" params={{ userId: "winston" }}>User winston</Link>
        </nav>

        <Routes>
          <Route name="Home" element={<Home />} />
          <Route name="About" element={<About />} />
          <Route name="Products" element={<Products />} />
          <Route name="Product" element={<Product />} />
          <Route name="User" element={<User />} />
        </Routes>
      </div>
    </RouterProvider>
  );
};
