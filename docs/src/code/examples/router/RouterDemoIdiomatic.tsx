import React from "react";
import { createReactRouter } from "./reactAdapter";

// Declare routes once (typed)
const {
  RouterProvider,
  Routes,
  Route,
  Link,
  useNavigation,
  RouteLayouts,
} = createReactRouter({
  Home: "/",
  About: "/about",
  Products: "/products",
  Product: "/products/:id",
  ProductOverview: "/products/:id/overview",
  ProductSpecs: "/products/:id/specs",
  ProductReviews: "/products/:id/reviews",
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
  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
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
            <Route name="Home" element={<Home />} />
            <Route name="About" element={<About />} />
            <Route name="Products" element={<Products />} />
            <Route name="Product" view={Product} />
            <Route name="ProductOverview" view={ProductOverview} />
            <Route name="ProductSpecs" view={ProductSpecs} />
            <Route name="ProductReviews" view={ProductReviews} />
            <Route name="User" view={User} />
          </Routes>
        </RouteLayouts>
      </div>
    </RouterProvider>
  );
};
