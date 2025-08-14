import React from "react";
import { RouterProvider, Routes, Route, Link } from "./appRouter";
import { SlideViewer, DebugVisProvider } from "./viewers";
import "./transitions.css";
import { Home, About, Products, Product, ProductOverview, ProductSpecs, ProductReviews, User, DebugPanel } from "./RouterAppScreens";

export const RouterApp: React.FC = () => {
  const [debugVis, setDebugVis] = React.useState(false);
  return (
    <RouterProvider>
      <DebugVisProvider value={debugVis}>
        <div className="p-2">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-xl font-semibold">Idiomatic Router Demo</h2>
            <button
              className="inline-flex items-center rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-slate-200 px-2 py-1 text-xs hover:bg-slate-200 dark:hover:bg-neutral-700 active:bg-slate-300 dark:active:bg-neutral-600"
              onClick={() => setDebugVis((v) => !v)}
              aria-pressed={debugVis}
            >
              {debugVis ? 'Disable Debug' : 'Enable Debug'}
            </button>
          </div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 shadow-sm backdrop-blur">
            <div className="px-4 pt-4">
              <nav className="flex flex-wrap gap-2 mb-3">
                <Link name="Home">Home</Link>
                <Link name="About">About</Link>
                <Link name="Products">Products</Link>
                <Link name="ProductOverview" params={{ id: "42" }}>Product 42</Link>
                <Link name="User" params={{ userId: "winston" }}>User winston</Link>
              </nav>
            </div>
            <div>
              <div className="p-4">
                <Routes
                  viewer={SlideViewer}
                  keep={1}
                  views={{
                    Home,
                    About,
                    Products,
                    User,
                    // Ensure site-level shell shows when inside product routes
                    Product: Products,
                    ProductOverview: Products,
                    ProductSpecs: Products,
                    ProductReviews: Products,
                  }}
                />
              </div>
            </div>
            <div className="px-4 pb-4">
              <DebugPanel />
            </div>
          </div>
        </div>
      </DebugVisProvider>
    </RouterProvider>
  );
};
