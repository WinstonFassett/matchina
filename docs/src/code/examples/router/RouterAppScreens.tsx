import React from "react";
import { useNavigation, useRouter, Link, store, Routes } from "./appRouter";
import { SlideViewer } from "./viewers";

export const Home: React.FC = () => <div className="p-4"><h3>Home</h3><p>Welcome!</p></div>;
export const About: React.FC = () => <div className="p-4"><h3>About</h3><p>About this app.</p></div>;
export const Products: React.FC<React.PropsWithChildren> = () => {
  const nav = useNavigation();
  const { to } = useRouter();
  // Scope: any Product* route renders the Product shell at this level
  const ProductShellViews = {
    Product,
    ProductOverview: Product,
    ProductSpecs: Product,
    ProductReviews: Product,
  } as const;
  const inProductScope = !!(to && (ProductShellViews as any)[to.name]);

  return (
    <div className="">
      <div className="p-4">
        <h3>Products</h3>
      </div>

      {!inProductScope && (
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
      )}

      {/* Descendant route level for product shell */}
      <Routes viewer={SlideViewer} views={ProductShellViews as any} />
    </div>
  );
};
export const Product: React.FC<React.PropsWithChildren<{ id: string; }>> = ({ children, ...params}) => {
  const nav = useNavigation();
  const { to } = useRouter();
  // Default to Overview tab if landing on /products/:id

  if (!params) return <div>No params!!</div>;
  const id = params.id;
  // If we are on the bare Product route, redirect to the default tab (Overview)
  React.useEffect(() => {
    if (to?.name === 'Product' && String((to?.params as any)?.id ?? '') === String(id)) {
      // replace so back button returns to previous page, not the intermediate shell URL
      nav.replace('ProductOverview', { id })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to?.name, (to?.params as any)?.id, id]);
  const isActive = (name: string) => to?.name === name && String((to?.params as any)?.id ?? '') === String(id);
  
  const ProductTab: React.FC<{ name: 'ProductOverview' | 'ProductSpecs' | 'ProductReviews'; label: string }> = ({ name, label }) => {
    const active = isActive(name);
    const clsBase = "px-2 py-1 rounded";
    const clsActive = "bg-blue-600 text-white cursor-default pointer-events-none";
    const clsDefault = "hover:bg-slate-100 dark:hover:bg-neutral-800";
    if (active) return <span aria-current="page" data-active className={`${clsBase} ${clsActive}`}>{label}</span>;
    return (
      <Link name={name as any} params={{ id }}>
        <span className={`${clsBase} ${clsDefault}`}>{label}</span>
      </Link>
    );
  };
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm p-4">
      <h3 className="text-xl font-semibold mb-1">Product {params.id}</h3>
      <nav className="flex items-center gap-2 mb-3">
        <ProductTab name="ProductOverview" label="Overview" />
        <ProductTab name="ProductSpecs" label="Specs" />
        <ProductTab name="ProductReviews" label="Reviews" />
      </nav>
      {/* Descendant route level for tab content */}
      <Routes
        viewer={SlideViewer}
        views={{
          ProductOverview,
          ProductSpecs,
          ProductReviews,
        }}
      />
      {/* Fallback: directly render current tab if needed */}
      {(() => {
        const name = to?.name;
        const Tab = (name === 'ProductOverview') ? ProductOverview : (name === 'ProductSpecs') ? ProductSpecs : (name === 'ProductReviews') ? ProductReviews : null;
        return Tab ? <Tab id={id} /> : null;
      })()}
    </div>
  );
};
// Nested Product tabs: return only body content; layout is applied by RouteLayouts
export const ProductOverview: React.FC<{ id: string; }> = (params) => (
  <>
    <h4>Overview</h4>
    <p>Overview for product {params.id}</p>
  </>
);
export const ProductSpecs: React.FC<{ id: string; }> = (params) => (
  <>
    <h4>Specs</h4>
    <p>Specs for product {params.id}</p>
  </>
);
export const ProductReviews: React.FC<{ id: string; }> = (params) => (
  <>
    <h4>Reviews</h4>
    <p>Reviews for product {params.id}</p>
  </>
);
// Top-level Products layout (static): shows master heading; used for Products and Product*
export const ProductsLayout: React.FC<{ children?: React.ReactNode; }> = ({ children }) => {
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
export const ProductDetailLayout: React.FC<{ children?: React.ReactNode; route: { name: string; params: any; }; }> = ({ children, route }) => {
  const nav = useNavigation();
  const { from, to } = useRouter();
  const id = String((route?.params as any)?.id ?? '');
  const backToList = React.useCallback(() => {
    if (from?.name === 'Products') nav.back(); else nav.goto('Products')();
  }, [from, nav]);
  const isActive = (name: string) => to?.name === name && String((to?.params as any)?.id ?? '') === id;

  // Diagnostics: log children count/shape whenever children or route changes
  React.useEffect(() => {
    const arr = React.Children.toArray(children) as any[];
    const describe = (n: any) => {
      if (n == null) return n;
      if (typeof n === 'string' || typeof n === 'number') return n;
      const type = typeof n.type === 'string' ? n.type : (n.type?.displayName || n.type?.name || 'Anonymous');
      return { type, key: n.key ?? null, className: n.props?.className ?? null, props: Object.keys(n.props || {}) };
    };
    // eslint-disable-next-line no-console
    console.log('[PDL] children', {
      route,
      from,
      to,
      count: React.Children.count(children),
      arrayLen: arr.length,
      items: arr.map(describe),
    });
  }, [children, route, from, to]);
  const Tab: React.FC<{ name: string; label: string; }> = ({ name, label }) => {
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
      {/* Diagnostics tip: exit view timing is controlled by reactRouter.tsx; see console for [Routes] logs */}
      <div className="overflow-hidden">
        {children}
      </div>
    </div>
  );
};
export const User: React.FC<{ userId: string; }> = (props) => <div className="p-4"><h3>User</h3>
  {JSON.stringify(props.userId ?? ("MISSING in props" + JSON.stringify(props)))}
</div>;
// Small debug panel to visualize store change/state and derived from/to
export const DebugPanel: React.FC = () => {
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
