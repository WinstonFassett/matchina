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

const Home: React.FC = () => <div><h3>Home</h3><p>Welcome!</p></div>;
const About: React.FC = () => <div><h3>About</h3><p>About this app.</p></div>;

const Products: React.FC = () => {
  const nav = useNavigation();
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm p-4">
      <h3 className="text-xl font-semibold mb-2">Products</h3>
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

// Nested Product tabs (wrapped with ProductLayout to show tab navigation)
const ProductOverview: React.FC<{ params: { id: string } }> = ({ params }) => (
  <ProductLayout id={params.id}>
    <h4>Overview</h4>
    <p>Overview for product {params.id}</p>
  </ProductLayout>
);
const ProductSpecs: React.FC<{ params: { id: string } }> = ({ params }) => (
  <ProductLayout id={params.id}>
    <h4>Specs</h4>
    <p>Specs for product {params.id}</p>
  </ProductLayout>
);
const ProductReviews: React.FC<{ params: { id: string } }> = ({ params }) => (
  <ProductLayout id={params.id}>
    <h4>Reviews</h4>
    <p>Reviews for product {params.id}</p>
  </ProductLayout>
);

// Layout that persists across product and its tabs
// Note: RouteLayouts passes route params as top-level props, not wrapped in { params }
const ProductLayout: React.FC<{ id: string; children?: React.ReactNode }> = ({ id, children }) => {
  const nav = useNavigation();
  const { from } = useRouter();
  const backToList = React.useCallback(() => {
    if (from?.name === 'Products') nav.back(); else nav.goto('Products')();
  }, [from, nav]);
  return (
    <div className="mt-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm">
      <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 px-3 py-2">
        <button
          className="mr-2 inline-flex items-center rounded-md bg-slate-200 dark:bg-neutral-800 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 text-sm hover:bg-slate-300 dark:hover:bg-neutral-700 active:bg-slate-400 dark:active:bg-neutral-600"
          onClick={backToList}
        >
          ← Back to Products
        </button>
        <Link name="Product" params={{ id }}>
          <span className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800">Summary</span>
        </Link>
        <Link name="ProductOverview" params={{ id }}>
          <span className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800">Overview</span>
        </Link>
        <Link name="ProductSpecs" params={{ id }}>
          <span className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800">Specs</span>
        </Link>
        <Link name="ProductReviews" params={{ id }}>
          <span className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800">Reviews</span>
        </Link>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

const User: React.FC<{ params: { userId: string } }> = (props) => <div><h3>User</h3>
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
    <pre style={{ fontSize: 11, background: '#f8f8f8', padding: 8, border: '1px solid #eee', borderRadius: 6, marginTop: 12 }}>
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

        <RouteLayouts layouts={{ Product: ProductLayout }}>
          <Routes>
            <Route name="Home" view={Home} />
            <Route name="About" view={About} />
            <Route name="Products" view={Products} />
            <Route name="Product" view={Product} />
            <Route name="ProductOverview" view={ProductOverview} />
            <Route name="ProductSpecs" view={ProductSpecs} />
            <Route name="ProductReviews" view={ProductReviews} />
            <Route name="User" view={User} />
          </Routes>
        </RouteLayouts>
        <DebugPanel />
      </div>
    </RouterProvider>
  );
};
