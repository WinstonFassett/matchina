import React from "react";
import "./transitions.css";
import {
  RouterProvider,
  Routes,
  Route,
  Link,
  RouteLayouts,
} from "./appRouter";
import { ProductsLayout, ProductDetailLayout, Home, About, Products, Product, ProductOverview, ProductSpecs, ProductReviews, User, DebugPanel } from "./RouterDemoScreens";

export const RouterDemoIdiomatic: React.FC = () => {
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
            {/* Apply nested layouts via RouteLayouts (adapter applies them per-view) */}
            <RouteLayouts layouts={{ Products: ProductsLayout, Product: ProductsLayout }}>
              <RouteLayouts layouts={{ Product: ProductDetailLayout }}>
                <Routes>
                  <Route name="Home" view={Home} />
                  <Route name="About" view={About} />
                  <Route name="Products" view={Products} />
                  {/* these work but are showing TS errors in IDE. Prob need to fix typing */}
                  <Route name="Product" view={Product} />
                  <Route name="ProductOverview" view={ProductOverview} />
                  <Route name="ProductSpecs" view={ProductSpecs} />
                  <Route name="ProductReviews" view={ProductReviews} />
                  <Route name="User" view={User} />
                </Routes>
              </RouteLayouts>
            </RouteLayouts>
          </div>
        </div>

        <DebugPanel />
      </div>
    </RouterProvider>
  );
};
