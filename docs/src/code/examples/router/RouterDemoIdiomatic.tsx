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
    <div>
      <h3>Products</h3>
      <button onClick={nav.goto("Product", { id: "42" })}>View Product 42</button>
      <button onClick={nav.goto("Product", { id: "abc" })} style={{ marginLeft: 8 }}>View Product abc</button>
    </div>
  );
};

const Product: React.FC<{ params: { id: string } }> = ({ params }) => {
  const nav = useNavigation();
  // Default to Overview tab if landing on /products/:id
  React.useEffect(() => {
    if (params?.id) {
      nav.replace("ProductOverview", { id: params.id });
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!params) return <div>No params!!</div>
  return (
    <div>
      <h3>Product {params.id}</h3>
      <p>Use the browser back or buttons to navigate.</p>
      <button onClick={nav.goto("Products")}>Back to list</button>
    </div>
  );
};

// Nested Product tabs
const ProductOverview: React.FC<{ params: { id: string } }> = ({ params }) => (
  <div>
    <h4>Overview</h4>
    <p>Overview for product {params.id}</p>
  </div>
);
const ProductSpecs: React.FC<{ params: { id: string } }> = ({ params }) => (
  <div>
    <h4>Specs</h4>
    <p>Specs for product {params.id}</p>
  </div>
);
const ProductReviews: React.FC<{ params: { id: string } }> = ({ params }) => (
  <div>
    <h4>Reviews</h4>
    <p>Reviews for product {params.id}</p>
  </div>
);

// Layout that persists across product and its tabs
// Note: RouteLayouts passes route params as top-level props, not wrapped in { params }
const ProductLayout: React.FC<{ id: string; children?: React.ReactNode }> = ({ id, children }) => {
  const nav = useNavigation();
  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <button onClick={nav.goto("Products")} style={{ marginRight: 8 }}>← Back to Products</button>
        <Link name="Product" params={{ id }}>Summary</Link>
        <Link name="ProductOverview" params={{ id }}>Overview</Link>
        <Link name="ProductSpecs" params={{ id }}>Specs</Link>
        <Link name="ProductReviews" params={{ id }}>Reviews</Link>
      </div>
      <div>
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
          <Link name="Product" params={{ id: "42" }}>Product 42</Link>
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
