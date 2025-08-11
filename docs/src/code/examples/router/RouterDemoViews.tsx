import React from "react";
import { createReactRouter } from "./reactAdapter";

const { RouterProvider, RouteViews, Link, useNavigation } = createReactRouter({
  Home: "/",
  About: "/about",
  Products: "/products",
  Product: "/products/:id",
  User: "/users/:userId",
} as const);

const Home: React.FC = () => <div><h3>Home</h3><p>Welcome!</p></div>;
const About: React.FC = () => <div><h3>About</h3><p>About this app.</p></div>;
const Products: React.FC = () => {
  const nav = useNavigation();
  return (
    <div>
      <h3>Products</h3>
      <button onClick={nav.goto("Product", { id: "42" })}>View Product 42</button>
    </div>
  );
};
const Product: React.FC<{ id: string }> = ({ id }) => (
  <div>
    <h3>Product</h3>
    <p>ID: {id}</p>
  </div>
);
const User: React.FC<{ userId: string }> = ({ userId }) => (
  <div>
    <h3>User</h3>
    <p>ID: {userId}</p>
  </div>
);

export const RouterDemoViews: React.FC = () => (
  <RouterProvider>
    <div>
      <h2>RouteViews Demo</h2>
      <nav style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Link name="Home">Home</Link>
        <Link name="About">About</Link>
        <Link name="Products">Products</Link>
        <Link name="Product" params={{ id: "42" }}>Product 42</Link>
        <Link name="User" params={{ userId: "winston" }}>User winston</Link>
      </nav>

      <RouteViews
        views={{
          Home,
          About,
          Products,
          Product,
          User,
        }}
      />
    </div>
  </RouterProvider>
);
