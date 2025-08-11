import React from "react";
import "./transitions.css";
import {
  RouterProvider,
  Routes,
  Route,
  Link,
  useNavigation,
  RouteLayouts,
  useRouter,
  store,
} from "./appRouter";

const Home: React.FC = () => <div className="p-4"><h3>Home</h3><p>Welcome!</p></div>;
const About: React.FC = () => <div className="p-4"><h3>About</h3><p>About this app.</p></div>;

const Products: React.FC = () => {
  const nav = useNavigation();
  return (
    <div className="p-2">
      <div className="flex gap-2">
        <button
          className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-500 active:bg-blue-700"
          onClick={nav.goto("ProductOverview", { id: "42" })}
        >
          View Product 42
        </button>
        <button
          className="inline-flex items-center rounded-md bg-slate-200 dark:bg-neutral-800 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm hover:bg-slate-300 dark:hover:bg-neutral-700 active:bg-slate-400 dark:active:bg-neutral-600"
          onClick={nav.goto("ProductOverview", { id: "abc" })}
        >
          View Product abc
        </button>
      </div>
    </div>
  );
};

const Product: React.FC<{ params: { id: string } }> = ({ params }) => {
  const nav = useNavigation();
  const { from } = useRouter();
  // Default to Overview tab if landing on /products/:id
  React.useEffect(() => {
    if (params?.id) {
      // replace() returns a handler; invoke it immediately
      nav.replace("ProductOverview", { id: params.id })();
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const backToList = React.useCallback(() => {
    if (from?.name === 'Products') {
      // If we navigated here from the list, pop back
      nav.back();
    } else {
      // Otherwise goto the list route
      nav.goto('Products')();
    }
  }, [from, nav]);
  if (!params) return <div>No params!!</div>
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm p-4">
      <h3 className="text-xl font-semibold mb-1">Product {params.id}</h3>
      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">Use the browser back or buttons to navigate.</p>
      <div className="flex gap-2">
        <button
          className="inline-flex items-center rounded-md bg-slate-200 dark:bg-neutral-800 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm hover:bg-slate-300 dark:hover:bg-neutral-700 active:bg-slate-400 dark:active:bg-neutral-600"
          onClick={backToList}
        >
          ← Back to list
        </button>
      </div>
    </div>
  );
};

// Nested Product tabs: return only body content; layout is applied by RouteLayouts
const ProductOverview: React.FC<{ params: { id: string } }> = ({ params }) => (
  <>
    <h4>Overview</h4>
    <p>Overview for product {params.id}</p>
  </>
);
const ProductSpecs: React.FC<{ params: { id: string } }> = ({ params }) => (
  <>
    <h4>Specs</h4>
    <p>Specs for product {params.id}</p>
  </>
);
const ProductReviews: React.FC<{ params: { id: string } }> = ({ params }) => (
  <>
    <h4>Reviews</h4>
    <p>Reviews for product {params.id}</p>
  </>
);

// Top-level Products layout (static): shows master heading; used for Products and Product*
const ProductsLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm">
      <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
        <h3 className="text-xl font-semibold">Products</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};

// Product detail layout: big title, subtle back, tabs below; inner body animates (adapter provides wrapper)
const ProductDetailLayout: React.FC<{ children?: React.ReactNode; route: { name: string; params: any } }> = ({ children, route }) => {
  const nav = useNavigation();
  const { from, to } = useRouter();
  const id = String((route?.params as any)?.id ?? '');
  const backToList = React.useCallback(() => {
    if (from?.name === 'Products') nav.back(); else nav.goto('Products')();
  }, [from, nav]);
  const isActive = (name: string) => to?.name === name && String((to?.params as any)?.id ?? '') === id;
  const Tab: React.FC<{ name: string; label: string }> = ({ name, label }) => {
    const active = isActive(name);
    const clsBase = "px-2 py-1 rounded";
    const clsActive = "bg-blue-600 text-white cursor-default pointer-events-none";
    const clsDefault = "hover:bg-slate-100 dark:hover:bg-neutral-800";
    if (active) {
      return (
        <span aria-current="page" data-active className={`${clsBase} ${clsActive}`}>{label}</span>
      );
    }
    return (
      <Link name={name as any} params={{ id }}>
        <span className={`${clsBase} ${clsDefault}`}>{label}</span>
      </Link>
    );
  };
  return (
    <div>
      <h3 className="text-xl font-semibold mb-1">Product <span className="font-bold">{id}</span></h3>
      <div className="mb-3">
        <button
          className="inline-flex items-center rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-slate-200 px-2 py-1 text-xs hover:bg-slate-200 dark:hover:bg-neutral-700 active:bg-slate-300 dark:active:bg-neutral-600"
          onClick={backToList}
        >
          ← Back to Products
        </button>
      </div>
      <nav className="flex items-center gap-2 mb-3">
        <Tab name="ProductOverview" label="Overview" />
        <Tab name="ProductSpecs" label="Specs" />
        <Tab name="ProductReviews" label="Reviews" />
      </nav>
      {/* Content area: overflow hidden so inner slides don't bleed */}
      <div className="overflow-hidden">
        {children}
      </div>
    </div>
  );
};

const User: React.FC<{ params: { userId: string } }> = (props) => <div className="p-4"><h3>User</h3>
{ JSON.stringify(props.params ?? ("MISSING in props" + JSON.stringify(props))) }
</div>;

// Small debug panel to visualize store change/state and derived from/to
const DebugPanel: React.FC = () => {
  const { change, from, to } = useRouter();
  // Fall back to current state if no change yet
  const state = store.getState();
  const snapshot = {
    change: change ? { type: change.type, from: change.from, to: change.to } : null,
    state,
    fromMatch: from,
    toMatch: to,
  };
  return (
    <pre className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm p-4">
      {JSON.stringify(snapshot, null, 2)}
    </pre>
  );
};

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
