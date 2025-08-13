import React from "react";
import { RouterProvider, Routes, Route, Link } from "./appRouter";
import { SlideViewer } from "./viewers";
// import "./transitions.css";
import { Home, About, Products, Product, ProductOverview, ProductSpecs, ProductReviews, User, DebugPanel } from "./RouterAppScreens";

export const RouterApp: React.FC = () => {
  return (
    <RouterProvider>
      <div>
        <h2>Idiomatic Router Demo</h2>
        <nav style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Link name="Home">Home</Link>
          <Link name="About">About</Link>
          <Link name="Products">Products</Link>
          <Link name="ProductOverview" params={{ id: "42" }}>Product 42</Link>
          <Link name="User" params={{ userId: "winston" }}>User winston</Link>
        </nav>
        <div>
          <div className="p-4">
            <Routes viewer={SlideViewer}>
              <Route name="Home" view={Home} />
              <Route name="About" view={About} />
              <Route name="Products" view={Products}>
                <Route name="Product" view={Product} viewer={SlideViewer}>
                  <Route index name="ProductOverview" view={ProductOverview} />
                  <Route name="ProductSpecs" view={ProductSpecs} />
                  <Route name="ProductReviews" view={ProductReviews} />
                </Route>
              </Route>
              <Route name="User" view={User} />
            </Routes>
          </div>
        </div>

        <DebugPanel />
      </div>
    </RouterProvider>
  );
};
