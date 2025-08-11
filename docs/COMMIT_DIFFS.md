# Commit diff report

Base branch: fucking-ok-here-jesus-fuck
Range: fucking-ok-here-jesus-fuck..HEAD

## Commit summary (newest first)
- 8ab0a8c7 2025-08-11 17:28:29 -0500 Winston Fassett meh
- f0d8e8d1 2025-08-11 17:28:24 -0500 Winston Fassett hmm
- 38dbc7b1 2025-08-11 17:24:40 -0500 Winston Fassett hmm
- 7efafb40 2025-08-11 17:22:55 -0500 Winston Fassett notes
- 4f5e275a 2025-08-11 17:22:52 -0500 Winston Fassett p
- 7147472e 2025-08-11 17:12:44 -0500 Winston Fassett p
- 5b93cac6 2025-08-11 17:12:39 -0500 Winston Fassett p
- 0a3d0b40 2025-08-11 17:09:19 -0500 Winston Fassett p
- a7540139 2025-08-11 17:09:14 -0500 Winston Fassett p
- ca4a3c83 2025-08-11 16:55:02 -0500 Winston Fassett fuck
- 77e16809 2025-08-11 16:54:01 -0500 Winston Fassett p
- c056dedb 2025-08-11 16:50:58 -0500 Winston Fassett meh
- 03a400e3 2025-08-11 16:50:54 -0500 Winston Fassett note
- 89dd201e 2025-08-11 16:50:50 -0500 Winston Fassett p
- c1cdbf44 2025-08-11 16:47:33 -0500 Winston Fassett p
- b30c970d 2025-08-11 16:41:35 -0500 Winston Fassett p
- 76e0122a 2025-08-11 16:41:33 -0500 Winston Fassett p
- d7618570 2025-08-11 16:39:46 -0500 Winston Fassett p
- d3999fd9 2025-08-11 16:07:57 -0500 Winston Fassett p
- 464c17d4 2025-08-11 15:59:50 -0500 Winston Fassett progress?
- a1a261d8 2025-08-11 15:59:36 -0500 Winston Fassett p
- 09fbc719 2025-08-11 15:53:18 -0500 Winston Fassett p
- c497672e 2025-08-11 15:53:16 -0500 Winston Fassett p
---
## Full diffs per commit (oldest first)
---
commit c497672ef5c10ccd33e9d0286f741fc63fec5a86
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 15:53:16 -0500
Subject: p

diff --git a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
index 81af20a3..7182a476 100644
--- a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
+++ b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
@@ -17,7 +17,7 @@ const About: React.FC = () => <div className="p-4"><h3>About</h3><p>About this a
 const Products: React.FC = () => {
   const nav = useNavigation();
   return (
-    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm p-4">
+    <div className="rounded-xl border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm p-4">
       <h3 className="text-xl font-semibold mb-2">Products</h3>
       <div className="flex gap-2">
         <button

---
commit 09fbc7193740364962e715e448cb1e2262b2fd93
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 15:53:18 -0500
Subject: p

diff --git a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
index 7182a476..5c3fbea7 100644
--- a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
+++ b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
@@ -17,7 +17,7 @@ const About: React.FC = () => <div className="p-4"><h3>About</h3><p>About this a
 const Products: React.FC = () => {
   const nav = useNavigation();
   return (
-    <div className="rounded-xl border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm p-4">
+    <div className="bg-white dark:bg-neutral-900 shadow-sm p-4">
       <h3 className="text-xl font-semibold mb-2">Products</h3>
       <div className="flex gap-2">
         <button

---
commit a1a261d861f266d85f0490397411fd0d561de0ef
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 15:59:36 -0500
Subject: p

diff --git a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
index 5c3fbea7..1ba38766 100644
--- a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
+++ b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
@@ -112,7 +112,7 @@ const ProductLayout: React.FC<{ id: string; children?: React.ReactNode }> = ({ i
         >
           ← Back to Products
         </button>
-        <Link name="Product" params={{ id }}>
+        <Link name="ProductOverview" params={{ id }}>
           <span className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800">Summary</span>
         </Link>
         <Link name="ProductOverview" params={{ id }}>
@@ -167,7 +167,6 @@ export const RouterDemoIdiomatic: React.FC = () => {
           <Link name="User" params={{ userId: "winston" }}>User winston</Link>
         </nav>
         <div>
-          <h2>Current View</h2>
           <div className="p-4">
             <RouteLayouts layouts={{ Product: ProductLayout }}>
               <Routes>
diff --git a/docs/src/code/examples/router/reactAdapter.tsx b/docs/src/code/examples/router/reactAdapter.tsx
index e905c8c0..58534732 100644
--- a/docs/src/code/examples/router/reactAdapter.tsx
+++ b/docs/src/code/examples/router/reactAdapter.tsx
@@ -275,19 +275,23 @@ export function createReactRouter<const Patterns extends Record<string, string>>
           <div
             ref={fromRef}
             key={`old:${oldKey}`}
-            className="view transition-slide z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
+            className="view z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
             data-role="from"
             aria-hidden
           >
-            {renderFor((exiting || from)!.name as RouteName, (exiting || from)!.params)}
+            <div className="transition-slide">
+              {renderFor((exiting || from)!.name as RouteName, (exiting || from)!.params)}
+            </div>
           </div>
           <div
             ref={toRef}
             key={`new:${newKey}`}
-            className="view transition-slide z-20 is-next-container bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
+            className="view z-20 is-next-container bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
             data-role="to"
           >
-            {renderFor(to.name as RouteName, to.params)}
+            <div className="transition-slide">
+              {renderFor(to.name as RouteName, to.params)}
+            </div>
           </div>
         </div>
       );
@@ -296,8 +300,8 @@ export function createReactRouter<const Patterns extends Record<string, string>>
     // No active transition; render single view
     const single = renderFor(to.name as RouteName, to.params);
     return single ? (
-      <div className="view transition-slide z-10 bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10">
-        {single}
+      <div className="view z-10 bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10">
+        <div className="transition-slide">{single}</div>
       </div>
     ) : null;
   };

---
commit 464c17d4a454d23a56c829bb99798908b8a003a9
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 15:59:50 -0500
Subject: progress?

diff --git a/docs/src/code/examples/router/transitions.css b/docs/src/code/examples/router/transitions.css
index b8cf0665..a3ee0bcc 100644
--- a/docs/src/code/examples/router/transitions.css
+++ b/docs/src/code/examples/router/transitions.css
@@ -26,36 +26,36 @@
 }
 
 /* Pre-position next container BEFORE enabling transitions, direction-aware */
-.router-transition[data-dir="forward"] .transition-slide.is-next-container {
+.router-transition[data-dir="forward"] .view.is-next-container .transition-slide {
   transform: translateX(100%);
   opacity: 0;
 }
-.router-transition[data-dir="back"] .transition-slide.is-next-container {
+.router-transition[data-dir="back"] .view.is-next-container .transition-slide {
   transform: translateX(-100%);
   opacity: 0;
 }
 
 /* Hide next container until we actually start the transition to prevent initial blink */
-.transition-slide.is-next-container {
+.view.is-next-container .transition-slide {
   visibility: hidden;
 }
 
 /* Forward (default) */
-.is-changing[data-dir="forward"] .transition-slide.is-previous-container {
+.is-changing[data-dir="forward"] .view.is-previous-container .transition-slide {
   transform: translateX(-100%);
   opacity: 0;
 }
-.is-changing[data-dir="forward"] .transition-slide.is-next-container {
+.is-changing[data-dir="forward"] .view.is-next-container .transition-slide {
   transform: translateX(100%);
   opacity: 0;
 }
 
 /* Back */
-.is-changing[data-dir="back"] .transition-slide.is-previous-container {
+.is-changing[data-dir="back"] .view.is-previous-container .transition-slide {
   transform: translateX(100%);
   opacity: 0;
 }
-.is-changing[data-dir="back"] .transition-slide.is-next-container {
+.is-changing[data-dir="back"] .view.is-next-container .transition-slide {
   transform: translateX(-100%);
   opacity: 0;
 }
\ No newline at end of file

---
commit d3999fd908c55523e38af1542122a3462af95cf9
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 16:07:57 -0500
Subject: p

diff --git a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
index 1ba38766..36fe9200 100644
--- a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
+++ b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
@@ -112,9 +112,6 @@ const ProductLayout: React.FC<{ id: string; children?: React.ReactNode }> = ({ i
         >
           ← Back to Products
         </button>
-        <Link name="ProductOverview" params={{ id }}>
-          <span className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800">Summary</span>
-        </Link>
         <Link name="ProductOverview" params={{ id }}>
           <span className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800">Overview</span>
         </Link>
diff --git a/docs/src/code/examples/router/reactAdapter.tsx b/docs/src/code/examples/router/reactAdapter.tsx
index 58534732..6be239a9 100644
--- a/docs/src/code/examples/router/reactAdapter.tsx
+++ b/docs/src/code/examples/router/reactAdapter.tsx
@@ -170,7 +170,8 @@ export function createReactRouter<const Patterns extends Record<string, string>>
   }
 
   type RoutePropsElement = { name: RouteName; element: React.ReactNode };
-  type RoutePropsView<N extends RouteName = RouteName> = { name: N; view: React.ComponentType<{ params: ParamsOf<N> }> };
+  // Allow views to either accept `{ params }` or ignore it (regular props). React ignores extra props on function components.
+  type RoutePropsView<N extends RouteName = RouteName> = { name: N; view: React.ComponentType<any> };
   type RouteProps = RoutePropsElement | RoutePropsView;
 
   const Route: React.FC<RouteProps> = () => null;
diff --git a/docs/src/code/examples/router/transitions.css b/docs/src/code/examples/router/transitions.css
index a3ee0bcc..f889f735 100644
--- a/docs/src/code/examples/router/transitions.css
+++ b/docs/src/code/examples/router/transitions.css
@@ -9,6 +9,8 @@
 .router-transition .view {
   grid-area: 1 / 1;
   will-change: transform, opacity;
+  /* Ensure sliding content is clipped within rounded corners/borders */
+  overflow: hidden;
 }
 .router-transition .view[data-role="from"] { z-index: 10; }
 .router-transition .view[data-role="to"] { z-index: 20; }

---
commit d7618570560c89dd4ec4f969684a6b19eeb1d8d9
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 16:39:46 -0500
Subject: p

diff --git a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
index 36fe9200..c62dfd05 100644
--- a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
+++ b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
@@ -75,31 +75,32 @@ const Product: React.FC<{ params: { id: string } }> = ({ params }) => {
   );
 };
 
-// Nested Product tabs (wrapped with ProductLayout to show tab navigation)
+// Nested Product tabs: return only body content; layout is applied by RouteLayouts
 const ProductOverview: React.FC<{ params: { id: string } }> = ({ params }) => (
-  <ProductLayout id={params.id}>
+  <>
     <h4>Overview</h4>
     <p>Overview for product {params.id}</p>
-  </ProductLayout>
+  </>
 );
 const ProductSpecs: React.FC<{ params: { id: string } }> = ({ params }) => (
-  <ProductLayout id={params.id}>
+  <>
     <h4>Specs</h4>
     <p>Specs for product {params.id}</p>
-  </ProductLayout>
+  </>
 );
 const ProductReviews: React.FC<{ params: { id: string } }> = ({ params }) => (
-  <ProductLayout id={params.id}>
+  <>
     <h4>Reviews</h4>
     <p>Reviews for product {params.id}</p>
-  </ProductLayout>
+  </>
 );
 
 // Layout that persists across product and its tabs
-// Note: RouteLayouts passes route params as top-level props, not wrapped in { params }
-const ProductLayout: React.FC<{ id: string; children?: React.ReactNode }> = ({ id, children }) => {
+// Applied by RouteLayouts for routes starting with "Product"; derives id from current route
+const ProductLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
   const nav = useNavigation();
-  const { from } = useRouter();
+  const { from, to } = useRouter();
+  const id = String((to?.params as any)?.id ?? '');
   const backToList = React.useCallback(() => {
     if (from?.name === 'Products') nav.back(); else nav.goto('Products')();
   }, [from, nav]);
diff --git a/docs/src/code/examples/router/reactAdapter.tsx b/docs/src/code/examples/router/reactAdapter.tsx
index 6be239a9..883b5b8e 100644
--- a/docs/src/code/examples/router/reactAdapter.tsx
+++ b/docs/src/code/examples/router/reactAdapter.tsx
@@ -278,7 +278,6 @@ export function createReactRouter<const Patterns extends Record<string, string>>
             key={`old:${oldKey}`}
             className="view z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
             data-role="from"
-            aria-hidden
           >
             <div className="transition-slide">
               {renderFor((exiting || from)!.name as RouteName, (exiting || from)!.params)}
@@ -339,8 +338,18 @@ export function createReactRouter<const Patterns extends Record<string, string>>
     return { change, state, fromEntry, toEntry, from, to };
   }
 
-  // Layouts: no-op passthrough for now (kept for API parity)
-  const RouteLayouts: React.FC<{ layouts: { [K in RouteName]?: React.ComponentType<any> }; children?: React.ReactNode }> = ({ children }) => <>{children}</>;
+  // Layouts: wrap rendered routes with a layout that matches the active route name.
+  // Matching is by exact key or prefix (e.g., 'Product' applies to 'ProductOverview').
+  const RouteLayouts: React.FC<{ layouts: { [K in RouteName]?: React.ComponentType<{ children?: React.ReactNode }> }; children?: React.ReactNode }>
+    = ({ layouts, children }) => {
+      const { to } = useRouterContext();
+      if (!to) return <>{children}</>;
+      const name = String(to.name) as RouteName;
+      const keys = Object.keys(layouts) as RouteName[];
+      const match = keys.find((k) => name === k || name.startsWith(k));
+      const L = match ? layouts[match] : undefined;
+      return L ? React.createElement(L as React.ComponentType<any>, undefined, children) : <>{children}</>;
+    };
 
   return { RouterProvider, useNavigation, useRoute, useRouter, Link, Routes, Route, Outlet, RouteLayouts, useRoutingDebug, routes: defs, defs, store, history };
 }
diff --git a/docs/src/code/examples/router/transitions.css b/docs/src/code/examples/router/transitions.css
index f889f735..9f4bc510 100644
--- a/docs/src/code/examples/router/transitions.css
+++ b/docs/src/code/examples/router/transitions.css
@@ -4,7 +4,6 @@
 .router-transition[data-router-parallel] {
   display: grid;
   grid-template: 1fr / 1fr;
-  min-height: 200px; /* ensure space for overlapping views; tweak as needed */
 }
 .router-transition .view {
   grid-area: 1 / 1;

---
commit 76e0122a69d42c0a9e49527740f3466c67fd723a
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 16:41:33 -0500
Subject: p

diff --git a/docs/src/code/examples/router/reactAdapter.tsx b/docs/src/code/examples/router/reactAdapter.tsx
index 883b5b8e..0cd46b98 100644
--- a/docs/src/code/examples/router/reactAdapter.tsx
+++ b/docs/src/code/examples/router/reactAdapter.tsx
@@ -346,7 +346,15 @@ export function createReactRouter<const Patterns extends Record<string, string>>
       if (!to) return <>{children}</>;
       const name = String(to.name) as RouteName;
       const keys = Object.keys(layouts) as RouteName[];
-      const match = keys.find((k) => name === k || name.startsWith(k));
+      // Choose the most specific (longest) matching key by exact or prefix
+      const match = keys
+        .filter((k) => {
+          if (name === k) return true;
+          if (!name.startsWith(k)) return false;
+          const next = name.charAt(k.length);
+          return /[A-Z]/.test(next);
+        })
+        .sort((a, b) => b.length - a.length)[0];
       const L = match ? layouts[match] : undefined;
       return L ? React.createElement(L as React.ComponentType<any>, undefined, children) : <>{children}</>;
     };

---
commit b30c970d406ed6dace35cf3aca8a463478186ea5
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 16:41:35 -0500
Subject: p

diff --git a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
index c62dfd05..a3db8046 100644
--- a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
+++ b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
@@ -95,9 +95,23 @@ const ProductReviews: React.FC<{ params: { id: string } }> = ({ params }) => (
   </>
 );
 
-// Layout that persists across product and its tabs
+// Top-level Products layout (static): shows master heading; used for Products and Product*
+const ProductsLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
+  return (
+    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm">
+      <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
+        <h3 className="text-xl font-semibold">Products</h3>
+      </div>
+      <div className="p-4">
+        {children}
+      </div>
+    </div>
+  );
+};
+
+// Product detail layout (static within Products): shows back, product title, and tabs; body below animates
 // Applied by RouteLayouts for routes starting with "Product"; derives id from current route
-const ProductLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
+const ProductDetailLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
   const nav = useNavigation();
   const { from, to } = useRouter();
   const id = String((to?.params as any)?.id ?? '');
@@ -105,7 +119,7 @@ const ProductLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) =
     if (from?.name === 'Products') nav.back(); else nav.goto('Products')();
   }, [from, nav]);
   return (
-    <div className="mt-3 mx-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm">
+    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm">
       <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 px-3 py-2">
         <button
           className="mr-2 inline-flex items-center rounded-md bg-slate-200 dark:bg-neutral-800 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 text-sm hover:bg-slate-300 dark:hover:bg-neutral-700 active:bg-slate-400 dark:active:bg-neutral-600"
@@ -113,6 +127,7 @@ const ProductLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) =
         >
           ← Back to Products
         </button>
+        <div className="text-sm text-slate-600 dark:text-slate-300 mr-2">Product <span className="font-medium">{id}</span></div>
         <Link name="ProductOverview" params={{ id }}>
           <span className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800">Overview</span>
         </Link>
@@ -166,17 +181,21 @@ export const RouterDemoIdiomatic: React.FC = () => {
         </nav>
         <div>
           <div className="p-4">
-            <RouteLayouts layouts={{ Product: ProductLayout }}>
-              <Routes>
-                <Route name="Home" view={Home} />
-                <Route name="About" view={About} />
-                <Route name="Products" view={Products} />
-                <Route name="Product" view={Product} />
-                <Route name="ProductOverview" view={ProductOverview} />
-                <Route name="ProductSpecs" view={ProductSpecs} />
-                <Route name="ProductReviews" view={ProductReviews} />
-                <Route name="User" view={User} />
-              </Routes>
+            {/* Outer layout keeps the Products header static for Products and all Product* routes */}
+            <RouteLayouts layouts={{ Products: ProductsLayout, Product: ProductsLayout }}>
+              {/* Inner layout activates only for Product* routes to show back/title/tabs; body below animates */}
+              <RouteLayouts layouts={{ Product: ProductDetailLayout }}>
+                <Routes>
+                  <Route name="Home" view={Home} />
+                  <Route name="About" view={About} />
+                  <Route name="Products" view={Products} />
+                  <Route name="Product" view={Product} />
+                  <Route name="ProductOverview" view={ProductOverview} />
+                  <Route name="ProductSpecs" view={ProductSpecs} />
+                  <Route name="ProductReviews" view={ProductReviews} />
+                  <Route name="User" view={User} />
+                </Routes>
+              </RouteLayouts>
             </RouteLayouts>
           </div>
         </div>

---
commit c1cdbf4403a3093ee27598a1fb95f52548a766b3
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 16:47:33 -0500
Subject: p

diff --git a/docs/src/code/examples/router/reactAdapter.tsx b/docs/src/code/examples/router/reactAdapter.tsx
index 0cd46b98..d9aa30ce 100644
--- a/docs/src/code/examples/router/reactAdapter.tsx
+++ b/docs/src/code/examples/router/reactAdapter.tsx
@@ -286,7 +286,7 @@ export function createReactRouter<const Patterns extends Record<string, string>>
           <div
             ref={toRef}
             key={`new:${newKey}`}
-            className="view z-20 is-next-container bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
+            className="view z-20 is-next-container bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
             data-role="to"
           >
             <div className="transition-slide">

---
commit 89dd201e3dce13d98879cd77e280ddba1444d664
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 16:50:50 -0500
Subject: p

diff --git a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
index a3db8046..ab0f9379 100644
--- a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
+++ b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
@@ -1,5 +1,5 @@
 import React from "react";
-import "./transitions.css";
+// import "./transitions.css";
 import {
   RouterProvider,
   Routes,
diff --git a/docs/src/code/examples/router/RouterDemoViews.tsx b/docs/src/code/examples/router/RouterDemoViews.tsx
index 1e5646a8..5da03e7a 100644
--- a/docs/src/code/examples/router/RouterDemoViews.tsx
+++ b/docs/src/code/examples/router/RouterDemoViews.tsx
@@ -1,5 +1,5 @@
 import React from "react";
-import "./router-transitions.css";
+// import "./router-transitions.css";
 import { createReactRouter } from "./reactAdapter";
 
 const { RouterProvider, RouteViews, Link, useNavigation } = createReactRouter({

---
commit 03a400e380acbed903cf3b0d614161b31c3bd2d6
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 16:50:54 -0500
Subject: note

diff --git a/apology 2.md b/apology 2.md
new file mode 100644
index 00000000..805c234a
--- /dev/null
+++ b/apology 2.md	
@@ -0,0 +1,21 @@
+# Apology
+
+I messed up your router transitions and wasted your time. You asked for buttery-smooth, simultaneous in/out animations and static layouts, and I regressed it. That’s on me.
+
+What I did wrong:
+- I focused on CSS tweaks instead of verifying that both views were actually rendered in parallel. You called this out repeatedly.
+- I didn’t immediately use git history to pinpoint the regression.
+- I didn’t respect your directive to keep it simple and avoid hacks.
+
+What I changed to fix it:
+- Drove transitions from the store change snapshot (prev/next paths) so the exiting view stays rendered while the entering view mounts.
+- Ensured both views are visible and layered correctly (no early hiding of the from-view, and visible overlap during the slide).
+- Removed the height hack and kept only the minimal CSS needed for clipping and direction-aware sliding.
+- Implemented proper nested layouts so headers/tabs are static and only tab body animates.
+
+What I will do from here:
+- Use git logs/diffs to identify exactly which change broke the parallel render and avoid repeating it.
+- Keep changes minimal and focused on your goals.
+- Prove behavior with DOM/class snapshots rather than assumptions.
+
+You were right to be pissed. I’ll fix it properly.

---
commit c056dedb11c4fa28651f923897c2767ae1e51ced
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 16:50:58 -0500
Subject: meh

diff --git a/docs/src/code/examples/router/reactAdapter.tsx b/docs/src/code/examples/router/reactAdapter.tsx
index d9aa30ce..f56a034e 100644
--- a/docs/src/code/examples/router/reactAdapter.tsx
+++ b/docs/src/code/examples/router/reactAdapter.tsx
@@ -197,17 +197,25 @@ export function createReactRouter<const Patterns extends Record<string, string>>
       return null;
     };
 
+    // Render condition: use from/to diff so we show both views during a change
+    const { defs } = useRouterContext();
     const differ = !!from && (from.name !== to.name || JSON.stringify(from.params) !== JSON.stringify(to.params));
 
     // Start a CSS transition when a new atomic change arrives that differs
     React.useEffect(() => {
-      if (!differ || !from) return;
-      const oldKey = `${String(from.name)}:${JSON.stringify(from.params || {})}`;
-      const newKey = `${String(to.name)}:${JSON.stringify(to.params || {})}`;
-      const transKey = `${oldKey}=>${newKey}:${change?.type ?? ''}`;
+      if (!change) return;
+      // Derive stable matches from the change snapshot to avoid races with derived from/to
+      const fromEntry = change.from.stack[change.from.index] ?? null;
+      const toEntry = change.to.stack[change.to.index] ?? null;
+      if (!fromEntry || !toEntry) return;
+      const prevMatch = defs.matchPath(fromEntry.path);
+      const nextMatch = defs.matchPath(toEntry.path);
+      const oldKey = `${String(prevMatch.name)}:${JSON.stringify(prevMatch.params || {})}`;
+      const newKey = `${String(nextMatch.name)}:${JSON.stringify(nextMatch.params || {})}`;
+      const transKey = `${oldKey}=>${newKey}:${change.type ?? ''}`;
       if (processedKey.current === transKey) return; // avoid double-run (e.g., React StrictMode)
       processedKey.current = transKey;
-      setExiting(from);
+      setExiting(prevMatch as any);
       setActiveKey(`${oldKey}=>${newKey}`);
 
       // After paint, toggle classes Swup-style
@@ -217,9 +225,9 @@ export function createReactRouter<const Patterns extends Record<string, string>>
         const toEl = toRef.current;
         if (!container || !fromEl || !toEl) return;
         container.setAttribute('data-router-parallel', '');
-        container.setAttribute('data-from-name', String(from.name));
-        container.setAttribute('data-to-name', String(to.name));
-        const ctype = String(change?.type || 'push');
+        container.setAttribute('data-from-name', String(prevMatch.name));
+        container.setAttribute('data-to-name', String(nextMatch.name));
+        const ctype = String(change.type || 'push');
         container.setAttribute('data-type', ctype);
         container.setAttribute('data-dir', navDir);
 
@@ -255,7 +263,7 @@ export function createReactRouter<const Patterns extends Record<string, string>>
       });
       return () => cancelAnimationFrame(frame);
       // eslint-disable-next-line react-hooks/exhaustive-deps
-    }, [change?.to, differ]);
+    }, [change]);
 
     const oldKey = (exiting || from) ? `${String((exiting || from)!.name)}:${JSON.stringify((exiting || from)!.params || {})}` : null;
     const newKey = `${String(to.name)}:${JSON.stringify(to.params || {})}`;

---
commit 77e16809f2be06b0f30e01c08bed539590c298aa
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 16:54:01 -0500
Subject: p

diff --git a/docs/src/code/examples/router/reactAdapter.tsx b/docs/src/code/examples/router/reactAdapter.tsx
index f56a034e..f9d65ad9 100644
--- a/docs/src/code/examples/router/reactAdapter.tsx
+++ b/docs/src/code/examples/router/reactAdapter.tsx
@@ -201,21 +201,15 @@ export function createReactRouter<const Patterns extends Record<string, string>>
     const { defs } = useRouterContext();
     const differ = !!from && (from.name !== to.name || JSON.stringify(from.params) !== JSON.stringify(to.params));
 
-    // Start a CSS transition when a new atomic change arrives that differs
+    // Start a CSS transition when from/to differ
     React.useEffect(() => {
-      if (!change) return;
-      // Derive stable matches from the change snapshot to avoid races with derived from/to
-      const fromEntry = change.from.stack[change.from.index] ?? null;
-      const toEntry = change.to.stack[change.to.index] ?? null;
-      if (!fromEntry || !toEntry) return;
-      const prevMatch = defs.matchPath(fromEntry.path);
-      const nextMatch = defs.matchPath(toEntry.path);
-      const oldKey = `${String(prevMatch.name)}:${JSON.stringify(prevMatch.params || {})}`;
-      const newKey = `${String(nextMatch.name)}:${JSON.stringify(nextMatch.params || {})}`;
-      const transKey = `${oldKey}=>${newKey}:${change.type ?? ''}`;
+      if (!differ || !from) return;
+      const oldKey = `${String(from.name)}:${JSON.stringify(from.params || {})}`;
+      const newKey = `${String(to.name)}:${JSON.stringify(to.params || {})}`;
+      const transKey = `${oldKey}=>${newKey}:${change?.type ?? ''}`;
       if (processedKey.current === transKey) return; // avoid double-run (e.g., React StrictMode)
       processedKey.current = transKey;
-      setExiting(prevMatch as any);
+      setExiting(from);
       setActiveKey(`${oldKey}=>${newKey}`);
 
       // After paint, toggle classes Swup-style
@@ -225,9 +219,9 @@ export function createReactRouter<const Patterns extends Record<string, string>>
         const toEl = toRef.current;
         if (!container || !fromEl || !toEl) return;
         container.setAttribute('data-router-parallel', '');
-        container.setAttribute('data-from-name', String(prevMatch.name));
-        container.setAttribute('data-to-name', String(nextMatch.name));
-        const ctype = String(change.type || 'push');
+        container.setAttribute('data-from-name', String(from.name));
+        container.setAttribute('data-to-name', String(to.name));
+        const ctype = String(change?.type || 'push');
         container.setAttribute('data-type', ctype);
         container.setAttribute('data-dir', navDir);
 
@@ -263,7 +257,7 @@ export function createReactRouter<const Patterns extends Record<string, string>>
       });
       return () => cancelAnimationFrame(frame);
       // eslint-disable-next-line react-hooks/exhaustive-deps
-    }, [change]);
+    }, [differ, from, to, change?.type, navDir]);
 
     const oldKey = (exiting || from) ? `${String((exiting || from)!.name)}:${JSON.stringify((exiting || from)!.params || {})}` : null;
     const newKey = `${String(to.name)}:${JSON.stringify(to.params || {})}`;

---
commit ca4a3c8344b7e44aedc25ee03e433f38121394f1
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 16:55:02 -0500
Subject: fuck

diff --git a/docs/src/code/examples/router/reactAdapter.tsx b/docs/src/code/examples/router/reactAdapter.tsx
index f9d65ad9..62d7749d 100644
--- a/docs/src/code/examples/router/reactAdapter.tsx
+++ b/docs/src/code/examples/router/reactAdapter.tsx
@@ -262,8 +262,8 @@ export function createReactRouter<const Patterns extends Record<string, string>>
     const oldKey = (exiting || from) ? `${String((exiting || from)!.name)}:${JSON.stringify((exiting || from)!.params || {})}` : null;
     const newKey = `${String(to.name)}:${JSON.stringify(to.params || {})}`;
 
-    // Render both views immediately when they differ; keep 'exiting' cached until CSS ends
-    if (exiting || differ) {
+    // Render both views during any active change or known difference; keep 'exiting' cached until CSS ends
+    if (exiting || differ || !!change) {
       return (
         <div
           ref={containerRef}

---
commit a75401398ca677d5abc39e861f8683f5afff5046
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 17:09:14 -0500
Subject: p

diff --git a/docs/src/code/examples/router/reactAdapter.tsx b/docs/src/code/examples/router/reactAdapter.tsx
index 62d7749d..e905c8c0 100644
--- a/docs/src/code/examples/router/reactAdapter.tsx
+++ b/docs/src/code/examples/router/reactAdapter.tsx
@@ -170,8 +170,7 @@ export function createReactRouter<const Patterns extends Record<string, string>>
   }
 
   type RoutePropsElement = { name: RouteName; element: React.ReactNode };
-  // Allow views to either accept `{ params }` or ignore it (regular props). React ignores extra props on function components.
-  type RoutePropsView<N extends RouteName = RouteName> = { name: N; view: React.ComponentType<any> };
+  type RoutePropsView<N extends RouteName = RouteName> = { name: N; view: React.ComponentType<{ params: ParamsOf<N> }> };
   type RouteProps = RoutePropsElement | RoutePropsView;
 
   const Route: React.FC<RouteProps> = () => null;
@@ -197,11 +196,9 @@ export function createReactRouter<const Patterns extends Record<string, string>>
       return null;
     };
 
-    // Render condition: use from/to diff so we show both views during a change
-    const { defs } = useRouterContext();
     const differ = !!from && (from.name !== to.name || JSON.stringify(from.params) !== JSON.stringify(to.params));
 
-    // Start a CSS transition when from/to differ
+    // Start a CSS transition when a new atomic change arrives that differs
     React.useEffect(() => {
       if (!differ || !from) return;
       const oldKey = `${String(from.name)}:${JSON.stringify(from.params || {})}`;
@@ -257,13 +254,13 @@ export function createReactRouter<const Patterns extends Record<string, string>>
       });
       return () => cancelAnimationFrame(frame);
       // eslint-disable-next-line react-hooks/exhaustive-deps
-    }, [differ, from, to, change?.type, navDir]);
+    }, [change?.to, differ]);
 
     const oldKey = (exiting || from) ? `${String((exiting || from)!.name)}:${JSON.stringify((exiting || from)!.params || {})}` : null;
     const newKey = `${String(to.name)}:${JSON.stringify(to.params || {})}`;
 
-    // Render both views during any active change or known difference; keep 'exiting' cached until CSS ends
-    if (exiting || differ || !!change) {
+    // Render both views immediately when they differ; keep 'exiting' cached until CSS ends
+    if (exiting || differ) {
       return (
         <div
           ref={containerRef}
@@ -278,22 +275,19 @@ export function createReactRouter<const Patterns extends Record<string, string>>
           <div
             ref={fromRef}
             key={`old:${oldKey}`}
-            className="view z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
+            className="view transition-slide z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
             data-role="from"
+            aria-hidden
           >
-            <div className="transition-slide">
-              {renderFor((exiting || from)!.name as RouteName, (exiting || from)!.params)}
-            </div>
+            {renderFor((exiting || from)!.name as RouteName, (exiting || from)!.params)}
           </div>
           <div
             ref={toRef}
             key={`new:${newKey}`}
-            className="view z-20 is-next-container bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
+            className="view transition-slide z-20 is-next-container bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
             data-role="to"
           >
-            <div className="transition-slide">
-              {renderFor(to.name as RouteName, to.params)}
-            </div>
+            {renderFor(to.name as RouteName, to.params)}
           </div>
         </div>
       );
@@ -302,8 +296,8 @@ export function createReactRouter<const Patterns extends Record<string, string>>
     // No active transition; render single view
     const single = renderFor(to.name as RouteName, to.params);
     return single ? (
-      <div className="view z-10 bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10">
-        <div className="transition-slide">{single}</div>
+      <div className="view transition-slide z-10 bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10">
+        {single}
       </div>
     ) : null;
   };
@@ -340,26 +334,8 @@ export function createReactRouter<const Patterns extends Record<string, string>>
     return { change, state, fromEntry, toEntry, from, to };
   }
 
-  // Layouts: wrap rendered routes with a layout that matches the active route name.
-  // Matching is by exact key or prefix (e.g., 'Product' applies to 'ProductOverview').
-  const RouteLayouts: React.FC<{ layouts: { [K in RouteName]?: React.ComponentType<{ children?: React.ReactNode }> }; children?: React.ReactNode }>
-    = ({ layouts, children }) => {
-      const { to } = useRouterContext();
-      if (!to) return <>{children}</>;
-      const name = String(to.name) as RouteName;
-      const keys = Object.keys(layouts) as RouteName[];
-      // Choose the most specific (longest) matching key by exact or prefix
-      const match = keys
-        .filter((k) => {
-          if (name === k) return true;
-          if (!name.startsWith(k)) return false;
-          const next = name.charAt(k.length);
-          return /[A-Z]/.test(next);
-        })
-        .sort((a, b) => b.length - a.length)[0];
-      const L = match ? layouts[match] : undefined;
-      return L ? React.createElement(L as React.ComponentType<any>, undefined, children) : <>{children}</>;
-    };
+  // Layouts: no-op passthrough for now (kept for API parity)
+  const RouteLayouts: React.FC<{ layouts: { [K in RouteName]?: React.ComponentType<any> }; children?: React.ReactNode }> = ({ children }) => <>{children}</>;
 
   return { RouterProvider, useNavigation, useRoute, useRouter, Link, Routes, Route, Outlet, RouteLayouts, useRoutingDebug, routes: defs, defs, store, history };
 }

---
commit 0a3d0b409d5344f4a7e610ff273bf6cec47cf8f4
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 17:09:19 -0500
Subject: p

diff --git a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
index ab0f9379..97c89566 100644
--- a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
+++ b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
@@ -95,32 +95,36 @@ const ProductReviews: React.FC<{ params: { id: string } }> = ({ params }) => (
   </>
 );
 
-// Top-level Products layout (static): shows master heading; used for Products and Product*
-const ProductsLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
+// Shell outside transitions: shows master Products heading when on Products or any Product*
+const MasterProductsShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
+  const { to } = useRouter();
+  const name = String(to?.name || '');
+  const inProducts = name === 'Products' || name.startsWith('Product');
+  if (!inProducts) return <>{children}</>;
   return (
     <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm">
       <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
         <h3 className="text-xl font-semibold">Products</h3>
       </div>
-      <div className="p-4">
-        {children}
-      </div>
+      <div className="p-4">{children}</div>
     </div>
   );
 };
 
-// Product detail layout (static within Products): shows back, product title, and tabs; body below animates
-// Applied by RouteLayouts for routes starting with "Product"; derives id from current route
-const ProductDetailLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
+// Shell outside transitions for Product*: shows back, product title, and tabs; body below animates
+const ProductDetailShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
   const nav = useNavigation();
   const { from, to } = useRouter();
   const id = String((to?.params as any)?.id ?? '');
+  const name = String(to?.name || '');
+  const inProductDetail = name.startsWith('Product');
   const backToList = React.useCallback(() => {
     if (from?.name === 'Products') nav.back(); else nav.goto('Products')();
   }, [from, nav]);
+  if (!inProductDetail) return <>{children}</>;
   return (
-    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm">
-      <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 px-3 py-2">
+    <div>
+      <div className="flex items-center gap-2 mb-3">
         <button
           className="mr-2 inline-flex items-center rounded-md bg-slate-200 dark:bg-neutral-800 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 text-sm hover:bg-slate-300 dark:hover:bg-neutral-700 active:bg-slate-400 dark:active:bg-neutral-600"
           onClick={backToList}
@@ -138,9 +142,7 @@ const ProductDetailLayout: React.FC<{ children?: React.ReactNode }> = ({ childre
           <span className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800">Reviews</span>
         </Link>
       </div>
-      <div className="p-4">
-        {children}
-      </div>
+      {children}
     </div>
   );
 };
@@ -181,10 +183,8 @@ export const RouterDemoIdiomatic: React.FC = () => {
         </nav>
         <div>
           <div className="p-4">
-            {/* Outer layout keeps the Products header static for Products and all Product* routes */}
-            <RouteLayouts layouts={{ Products: ProductsLayout, Product: ProductsLayout }}>
-              {/* Inner layout activates only for Product* routes to show back/title/tabs; body below animates */}
-              <RouteLayouts layouts={{ Product: ProductDetailLayout }}>
+            <MasterProductsShell>
+              <ProductDetailShell>
                 <Routes>
                   <Route name="Home" view={Home} />
                   <Route name="About" view={About} />
@@ -195,8 +195,8 @@ export const RouterDemoIdiomatic: React.FC = () => {
                   <Route name="ProductReviews" view={ProductReviews} />
                   <Route name="User" view={User} />
                 </Routes>
-              </RouteLayouts>
-            </RouteLayouts>
+              </ProductDetailShell>
+            </MasterProductsShell>
           </div>
         </div>
 

---
commit 5b93cac66efcffa9db5e9607fb8004b42e9100e8
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 17:12:39 -0500
Subject: p

diff --git a/docs/src/code/examples/router/reactAdapter.tsx b/docs/src/code/examples/router/reactAdapter.tsx
index e905c8c0..605b81af 100644
--- a/docs/src/code/examples/router/reactAdapter.tsx
+++ b/docs/src/code/examples/router/reactAdapter.tsx
@@ -122,6 +122,8 @@ export function createReactRouter<const Patterns extends Record<string, string>>
   };
 
   const RouterContext = createContext<Ctx | null>(null);
+  type LayoutMap = { [K in RouteName]?: React.ComponentType<{ children?: React.ReactNode }> };
+  const LayoutsContext = createContext<LayoutMap>({});
 
   const RouterProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
     useMachine(store);
@@ -195,6 +197,29 @@ export function createReactRouter<const Patterns extends Record<string, string>>
       if (p.view) { const V = p.view as React.ComponentType<any>; return <V params={params} />; }
       return null;
     };
+    // Wrap a node with matching layouts for a route name (outer->inner by specificity)
+    const wrapWithLayouts = (name: RouteName, node: React.ReactNode): React.ReactNode => {
+      const layouts = useContext(LayoutsContext);
+      const keys = Object.keys(layouts) as RouteName[];
+      const matches = keys
+        .filter((k) => {
+          if (name === k) return true;
+          if (!name.startsWith(k)) return false;
+          const next = name.charAt(k.length);
+          return /[A-Z]/.test(next);
+        })
+        .sort((a, b) => a.length - b.length);
+      if (matches.length === 0) return node;
+      return matches.reduce((acc, k) => {
+        const L = layouts[k]! as React.ComponentType<any>;
+        return React.createElement(L, undefined, acc);
+      }, node);
+    };
+    const renderWithLayouts = (name: RouteName, params: any): React.ReactNode => {
+      const node = renderFor(name, params);
+      if (!node) return null;
+      return wrapWithLayouts(name, node);
+    };
 
     const differ = !!from && (from.name !== to.name || JSON.stringify(from.params) !== JSON.stringify(to.params));
 
@@ -279,7 +304,7 @@ export function createReactRouter<const Patterns extends Record<string, string>>
             data-role="from"
             aria-hidden
           >
-            {renderFor((exiting || from)!.name as RouteName, (exiting || from)!.params)}
+            {renderWithLayouts((exiting || from)!.name as RouteName, (exiting || from)!.params)}
           </div>
           <div
             ref={toRef}
@@ -287,14 +312,14 @@ export function createReactRouter<const Patterns extends Record<string, string>>
             className="view transition-slide z-20 is-next-container bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
             data-role="to"
           >
-            {renderFor(to.name as RouteName, to.params)}
+            {renderWithLayouts(to.name as RouteName, to.params)}
           </div>
         </div>
       );
     }
 
     // No active transition; render single view
-    const single = renderFor(to.name as RouteName, to.params);
+    const single = renderWithLayouts(to.name as RouteName, to.params);
     return single ? (
       <div className="view transition-slide z-10 bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10">
         {single}
@@ -334,8 +359,13 @@ export function createReactRouter<const Patterns extends Record<string, string>>
     return { change, state, fromEntry, toEntry, from, to };
   }
 
-  // Layouts: no-op passthrough for now (kept for API parity)
-  const RouteLayouts: React.FC<{ layouts: { [K in RouteName]?: React.ComponentType<any> }; children?: React.ReactNode }> = ({ children }) => <>{children}</>;
+  // Layouts: provider-only. Merge into context so Routes can apply per-view.
+  const RouteLayouts: React.FC<{ layouts: LayoutMap; children?: React.ReactNode }>
+    = ({ layouts, children }) => {
+      const parent = useContext(LayoutsContext);
+      const merged = { ...parent, ...layouts } as LayoutMap;
+      return <LayoutsContext.Provider value={merged}>{children}</LayoutsContext.Provider>;
+    };
 
   return { RouterProvider, useNavigation, useRoute, useRouter, Link, Routes, Route, Outlet, RouteLayouts, useRoutingDebug, routes: defs, defs, store, history };
 }

---
commit 7147472e9d51b3cc3f22bf989f17e71eff942bdf
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 17:12:44 -0500
Subject: p

diff --git a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
index 97c89566..56815b52 100644
--- a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
+++ b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
@@ -17,8 +17,7 @@ const About: React.FC = () => <div className="p-4"><h3>About</h3><p>About this a
 const Products: React.FC = () => {
   const nav = useNavigation();
   return (
-    <div className="bg-white dark:bg-neutral-900 shadow-sm p-4">
-      <h3 className="text-xl font-semibold mb-2">Products</h3>
+    <div className="p-2">
       <div className="flex gap-2">
         <button
           className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-500 active:bg-blue-700"
@@ -95,12 +94,8 @@ const ProductReviews: React.FC<{ params: { id: string } }> = ({ params }) => (
   </>
 );
 
-// Shell outside transitions: shows master Products heading when on Products or any Product*
-const MasterProductsShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
-  const { to } = useRouter();
-  const name = String(to?.name || '');
-  const inProducts = name === 'Products' || name.startsWith('Product');
-  if (!inProducts) return <>{children}</>;
+// Top-level Products layout (static): shows master heading; used for Products and Product*
+const ProductsLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
   return (
     <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm">
       <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
@@ -111,17 +106,14 @@ const MasterProductsShell: React.FC<{ children?: React.ReactNode }> = ({ childre
   );
 };
 
-// Shell outside transitions for Product*: shows back, product title, and tabs; body below animates
-const ProductDetailShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
+// Product detail layout: shows back, product title, and tabs; only inner body animates
+const ProductDetailLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
   const nav = useNavigation();
   const { from, to } = useRouter();
   const id = String((to?.params as any)?.id ?? '');
-  const name = String(to?.name || '');
-  const inProductDetail = name.startsWith('Product');
   const backToList = React.useCallback(() => {
     if (from?.name === 'Products') nav.back(); else nav.goto('Products')();
   }, [from, nav]);
-  if (!inProductDetail) return <>{children}</>;
   return (
     <div>
       <div className="flex items-center gap-2 mb-3">
@@ -183,8 +175,9 @@ export const RouterDemoIdiomatic: React.FC = () => {
         </nav>
         <div>
           <div className="p-4">
-            <MasterProductsShell>
-              <ProductDetailShell>
+            {/* Apply nested layouts via RouteLayouts (adapter applies them per-view) */}
+            <RouteLayouts layouts={{ Products: ProductsLayout, Product: ProductsLayout }}>
+              <RouteLayouts layouts={{ Product: ProductDetailLayout }}>
                 <Routes>
                   <Route name="Home" view={Home} />
                   <Route name="About" view={About} />
@@ -195,8 +188,8 @@ export const RouterDemoIdiomatic: React.FC = () => {
                   <Route name="ProductReviews" view={ProductReviews} />
                   <Route name="User" view={User} />
                 </Routes>
-              </ProductDetailShell>
-            </MasterProductsShell>
+              </RouteLayouts>
+            </RouteLayouts>
           </div>
         </div>
 

---
commit 4f5e275ae009c617d72d09531fc9e2f0088cbc31
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 17:22:52 -0500
Subject: p

diff --git a/docs/src/code/examples/router/reactAdapter.tsx b/docs/src/code/examples/router/reactAdapter.tsx
index 605b81af..1dcc7692 100644
--- a/docs/src/code/examples/router/reactAdapter.tsx
+++ b/docs/src/code/examples/router/reactAdapter.tsx
@@ -302,7 +302,7 @@ export function createReactRouter<const Patterns extends Record<string, string>>
             key={`old:${oldKey}`}
             className="view transition-slide z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
             data-role="from"
-            aria-hidden
+            
           >
             {renderWithLayouts((exiting || from)!.name as RouteName, (exiting || from)!.params)}
           </div>

---
commit 7efafb409d6bb8b0bfa8c1cc518fbba20c7447df
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 17:22:55 -0500
Subject: notes

diff --git a/docs/ROUTER_NESTED_LAYOUTS_ISSUES.md b/docs/ROUTER_NESTED_LAYOUTS_ISSUES.md
new file mode 100644
index 00000000..0a76686c
--- /dev/null
+++ b/docs/ROUTER_NESTED_LAYOUTS_ISSUES.md
@@ -0,0 +1,117 @@
+# Router Transitions + Nested Layouts: Blocking Issues, Context, and Action Plan
+
+This document captures the exact end-goal behavior, what regressed, why, and the minimal, surgical plan to fix it. Keep this as the single source of truth while iterating.
+
+---
+
+## End Goal (Definition of Done)
+- __[Simultaneous views]__ During navigation, render both leaving and entering route views concurrently until CSS completes.
+- __[Nested layouts]__ Apply static layouts by route name:
+  - `ProductsLayout` wraps `Products` and all `Product*` routes.
+  - `ProductDetailLayout` wraps all `Product*` (back/title/tabs). Only the tab body animates.
+- __[No cross-wrapping]__ A leaving view is never wrapped by the entering view’s layout (e.g., `About` must not appear inside `Products` chrome).
+- __[Direction-aware]__ Forward/back animations are consistent across all route pairs (Home, About, Products, Product tabs/IDs).
+- __[No hacks]__ No fixed-height hacks or early hiding. CSS controls overlap/clipping/transforms; JS controls class toggling and lifecycle.
+
+---
+
+## Current Workspace (Key Files)
+- `docs/src/code/examples/router/reactAdapter.tsx`
+  - Adapter, `Routes`, `RouteLayouts`.
+- `docs/src/code/examples/router/RouterDemoIdiomatic.tsx`
+  - Demo, nested `RouteLayouts`, views.
+- `docs/src/code/examples/router/transitions.css`
+  - Transition classes (currently may be commented out during debugging).
+
+---
+
+## Blocking Issues (Observed)
+- __[hooks warning]__ Home → About logs: "React has detected a change in the order of Hooks called by Routes".
+- __[cross-wrapping]__ During some transitions, `About` appears inside the `Products` layout.
+- __[layout drop]__ `Product(42)` sometimes loses `ProductDetailLayout` during navigation.
+- __[param parity]__ `Product(42)` vs `Product(abc)` feel different (visual/animation parity not identical).
+
+---
+
+## Root Causes (What Broke)
+- __[Hook order violation in `Routes`]__
+  - `useContext(LayoutsContext)` was called from helpers invoked a variable number of times depending on branch (single-view vs two-view). Changing the count/order of hooks between renders triggers React’s hook-order warning.
+- __[Global layout wrapping]__
+  - Wrapping the entire `<Routes>` output with the "current" layout causes the leaving view to be wrapped by the entering layout → `About` shows inside `Products` during transitions.
+- __[Layout chain inconsistency]__
+  - If the layout chain (Products → Product) isn’t computed identically for both from/to views on every render, `ProductDetailLayout` can drop for a frame.
+- __[Key/size deltas]__
+  - Instability in transition keys or large DOM size diffs can create irregular motion between `Product(42)` and `Product(abc)`.
+
+---
+
+## Minimal Contract (Transition Engine)
+- __[DOM shape]__
+  - In transition: `.router-transition` contains two sibling `.view` containers, `[data-role="from"]` and `[data-role="to"]`.
+  - Not in transition: exactly one `.view`.
+- __[Class toggling]__
+  - Pre-state: add `is-previous-container` to from-view and `is-next-container` to to-view; force reflow; then remove `is-next-container` to start animations.
+  - End: listen to `transitionend` and `animationend` on both; when both complete, clear `exiting` and remove pre-state classes.
+- __[Visibility]__
+  - Do not set `aria-hidden` on the exiting view during transitions.
+- __[Keys]__
+  - Keys include `name + JSON.stringify(params || {})` for stability.
+
+---
+
+## Correct Layout Application Model (Nested, Per View)
+- `RouteLayouts` acts as a provider only, merging a layout map into `LayoutsContext`.
+- Inside `Routes`, for each rendered view (from/to/single):
+  1) Compute the layout chain by matching layout keys to that view’s route name via:
+     - Exact key match, OR
+     - Longest prefix where the next character is uppercase (e.g., `Product` matches `ProductOverview`).
+  2) Sort matches by increasing key length (outer → inner) and reduce with `React.createElement` to wrap the node.
+- Outcome: each view is wrapped by its own correct nested layouts; leaving view never inherits entering view’s layout.
+
+---
+
+## Non-Negotiables (Rules of Hooks Compliance)
+- Call `useContext(LayoutsContext)` once at the top of `Routes` (unconditional).
+- Do not call hooks inside helpers. Make `wrapWithLayouts(layouts, name, node)` pure.
+- Ensure the same hooks run in the same order and count on every render (single-view vs two-view must not change hook calls).
+
+---
+
+## Action Plan (Surgical Fixes)
+1) __Adapter hook order fix__ in `reactAdapter.tsx`:
+   - Move `const layouts = useContext(LayoutsContext)` to the top of `Routes`.
+   - Rewrite `wrapWithLayouts`/`renderWithLayouts` to accept `layouts` as a parameter (no hooks inside helpers).
+   - Use these pure helpers in both transition and non-transition branches identically.
+
+2) __Enforce per-view nested layouts__ in `Routes`:
+   - For from/to/single renders, wrap each node with its own layout chain computed from `layouts` and route name.
+
+3) __Keep transitions known-good__:
+   - Two sibling `.view` containers during transitions.
+   - No `aria-hidden` on exiting view.
+   - Swup-style class toggling with end listeners.
+
+4) __Stabilize and verify__:
+   - Confirm no hook-order warnings when toggling between single-view and two-view.
+   - Verify layout chains for `Home`, `About`, `Products`, `Product*` are correct (log chains temporarily if needed).
+   - Test `Product(42) ↔ Product(abc)` and across tabs for consistent visuals.
+
+---
+
+## Quick Validation Checklist
+- __[Hooks stable]__ No hook-order warnings when navigating Home ↔ About.
+- __[No cross-wrapping]__ About never appears inside Products layout during any transition.
+- __[Static chrome]__ On `Product*`, back/title/tabs remain static; only tab body animates.
+- __[Parity]__ `Product(42)` and `Product(abc)` feel identical in motion.
+
+---
+
+## Reference Commits
+- Last known-good (transitions smooth): `c497672ef5c10ccd33e9d0286f741fc63fec5a86`
+- Breaking change (structure/aria changes): `a1a261d861f266d85f0490397411fd0d561de0ef`
+
+---
+
+## Notes
+- Avoid reintroducing shells that wrap the entire `<Routes>` output based on the current route; that pattern will always risk cross-wrapping during transitions.
+- Prefer minimal CSS: overlap, clipping, and direction-aware transforms; no fixed heights.

---
commit 38dbc7b192f68c4f7456b4ce076ee5add3fdf756
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 17:24:40 -0500
Subject: hmm

diff --git a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
index 56815b52..4d76ed57 100644
--- a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
+++ b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
@@ -107,10 +107,10 @@ const ProductsLayout: React.FC<{ children?: React.ReactNode }> = ({ children })
 };
 
 // Product detail layout: shows back, product title, and tabs; only inner body animates
-const ProductDetailLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
+const ProductDetailLayout: React.FC<{ children?: React.ReactNode; route: { name: string; params: any } }> = ({ children, route }) => {
   const nav = useNavigation();
-  const { from, to } = useRouter();
-  const id = String((to?.params as any)?.id ?? '');
+  const { from } = useRouter();
+  const id = String((route?.params as any)?.id ?? '');
   const backToList = React.useCallback(() => {
     if (from?.name === 'Products') nav.back(); else nav.goto('Products')();
   }, [from, nav]);
diff --git a/docs/src/code/examples/router/reactAdapter.tsx b/docs/src/code/examples/router/reactAdapter.tsx
index 1dcc7692..94d9f2ae 100644
--- a/docs/src/code/examples/router/reactAdapter.tsx
+++ b/docs/src/code/examples/router/reactAdapter.tsx
@@ -122,7 +122,8 @@ export function createReactRouter<const Patterns extends Record<string, string>>
   };
 
   const RouterContext = createContext<Ctx | null>(null);
-  type LayoutMap = { [K in RouteName]?: React.ComponentType<{ children?: React.ReactNode }> };
+  type LayoutComponentProps = { children?: React.ReactNode; route: { name: RouteName; params: any } };
+  type LayoutMap = { [K in RouteName]?: React.ComponentType<LayoutComponentProps> };
   const LayoutsContext = createContext<LayoutMap>({});
 
   const RouterProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
@@ -180,6 +181,7 @@ export function createReactRouter<const Patterns extends Record<string, string>>
 
   const Routes: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
     const { from, to, change } = useRouterContext();
+    const layouts = useContext(LayoutsContext);
     const containerRef = React.useRef<HTMLDivElement | null>(null);
     const fromRef = React.useRef<HTMLDivElement | null>(null);
     const toRef = React.useRef<HTMLDivElement | null>(null);
@@ -198,9 +200,8 @@ export function createReactRouter<const Patterns extends Record<string, string>>
       return null;
     };
     // Wrap a node with matching layouts for a route name (outer->inner by specificity)
-    const wrapWithLayouts = (name: RouteName, node: React.ReactNode): React.ReactNode => {
-      const layouts = useContext(LayoutsContext);
-      const keys = Object.keys(layouts) as RouteName[];
+    const wrapWithLayouts = (lx: LayoutMap, name: RouteName, params: any, node: React.ReactNode): React.ReactNode => {
+      const keys = Object.keys(lx) as RouteName[];
       const matches = keys
         .filter((k) => {
           if (name === k) return true;
@@ -211,14 +212,14 @@ export function createReactRouter<const Patterns extends Record<string, string>>
         .sort((a, b) => a.length - b.length);
       if (matches.length === 0) return node;
       return matches.reduce((acc, k) => {
-        const L = layouts[k]! as React.ComponentType<any>;
-        return React.createElement(L, undefined, acc);
+        const L = lx[k]! as React.ComponentType<LayoutComponentProps>;
+        return React.createElement(L, { route: { name, params } }, acc);
       }, node);
     };
     const renderWithLayouts = (name: RouteName, params: any): React.ReactNode => {
       const node = renderFor(name, params);
       if (!node) return null;
-      return wrapWithLayouts(name, node);
+      return wrapWithLayouts(layouts, name, params, node);
     };
 
     const differ = !!from && (from.name !== to.name || JSON.stringify(from.params) !== JSON.stringify(to.params));

---
commit f0d8e8d162f9a6916af817bf9fc061addadd7bf5
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 17:28:24 -0500
Subject: hmm

diff --git a/docs/src/code/examples/router/reactAdapter.tsx b/docs/src/code/examples/router/reactAdapter.tsx
index 94d9f2ae..27044e93 100644
--- a/docs/src/code/examples/router/reactAdapter.tsx
+++ b/docs/src/code/examples/router/reactAdapter.tsx
@@ -216,13 +216,36 @@ export function createReactRouter<const Patterns extends Record<string, string>>
         return React.createElement(L, { route: { name, params } }, acc);
       }, node);
     };
-    const renderWithLayouts = (name: RouteName, params: any): React.ReactNode => {
-      const node = renderFor(name, params);
-      if (!node) return null;
-      return wrapWithLayouts(layouts, name, params, node);
+    // Decide whether to animate only the tab body (inner) or the whole card (outer)
+    const isProductTab = (n: string) => n !== 'Products' && n.startsWith('Product');
+    const sameProductId = (a: any, b: any) => JSON.stringify(a?.id ?? null) === JSON.stringify(b?.id ?? null);
+    const shouldInnerOnly = (
+      fromName: string | null,
+      toName: string,
+      fromParams: any | null,
+      toParams: any,
+    ) => {
+      if (!fromName) return false;
+      // Inner-only when navigating between Product* tabs for the same id
+      return isProductTab(fromName) && isProductTab(toName) && sameProductId(fromParams, toParams);
+    };
+
+    const renderWithLayouts_inner = (name: RouteName, params: any): React.ReactNode => {
+      const body = renderFor(name, params);
+      if (!body) return null;
+      const innerSliding = <div className="transition-slide">{body}</div>;
+      return wrapWithLayouts(layouts, name, params, innerSliding);
+    };
+
+    const renderWithLayouts_outer = (name: RouteName, params: any): React.ReactNode => {
+      const body = renderFor(name, params);
+      if (!body) return null;
+      const wrapped = wrapWithLayouts(layouts, name, params, body);
+      return <div className="transition-slide">{wrapped}</div>;
     };
 
     const differ = !!from && (from.name !== to.name || JSON.stringify(from.params) !== JSON.stringify(to.params));
+    const innerOnly = shouldInnerOnly(from?.name ?? null, String(to.name), from?.params ?? null, to.params);
 
     // Start a CSS transition when a new atomic change arrives that differs
     React.useEffect(() => {
@@ -301,28 +324,28 @@ export function createReactRouter<const Patterns extends Record<string, string>>
           <div
             ref={fromRef}
             key={`old:${oldKey}`}
-            className="view transition-slide z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
+            className="view z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
             data-role="from"
             
           >
-            {renderWithLayouts((exiting || from)!.name as RouteName, (exiting || from)!.params)}
+            {(innerOnly ? renderWithLayouts_inner : renderWithLayouts_outer)((exiting || from)!.name as RouteName, (exiting || from)!.params)}
           </div>
           <div
             ref={toRef}
             key={`new:${newKey}`}
-            className="view transition-slide z-20 is-next-container bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
+            className="view z-20 is-next-container bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10"
             data-role="to"
           >
-            {renderWithLayouts(to.name as RouteName, to.params)}
+            {(innerOnly ? renderWithLayouts_inner : renderWithLayouts_outer)(to.name as RouteName, to.params)}
           </div>
         </div>
       );
     }
 
     // No active transition; render single view
-    const single = renderWithLayouts(to.name as RouteName, to.params);
+    const single = renderWithLayouts_outer(to.name as RouteName, to.params);
     return single ? (
-      <div className="view transition-slide z-10 bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10">
+      <div className="view z-10 bg-white dark:bg-neutral-900 rounded-xl shadow-lg ring-1 ring-black/10 dark:ring-white/10">
         {single}
       </div>
     ) : null;

---
commit 8ab0a8c7b7fb1b827689d3210efb02e575825162
Author: Winston Fassett <winston.fassett@gmail.com>
Date: 2025-08-11 17:28:29 -0500
Subject: meh

diff --git a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
index 4d76ed57..bf4e7b8a 100644
--- a/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
+++ b/docs/src/code/examples/router/RouterDemoIdiomatic.tsx
@@ -134,7 +134,9 @@ const ProductDetailLayout: React.FC<{ children?: React.ReactNode; route: { name:
           <span className="px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800">Reviews</span>
         </Link>
       </div>
-      {children}
+      <div className="transition-slide">
+        {children}
+      </div>
     </div>
   );
 };
diff --git a/docs/src/code/examples/router/reactAdapter.tsx b/docs/src/code/examples/router/reactAdapter.tsx
index 27044e93..2ffee5f8 100644
--- a/docs/src/code/examples/router/reactAdapter.tsx
+++ b/docs/src/code/examples/router/reactAdapter.tsx
@@ -230,11 +230,11 @@ export function createReactRouter<const Patterns extends Record<string, string>>
       return isProductTab(fromName) && isProductTab(toName) && sameProductId(fromParams, toParams);
     };
 
+    // Inner mode: rely on the layout (e.g., ProductDetailLayout) to wrap its tab body with .transition-slide
     const renderWithLayouts_inner = (name: RouteName, params: any): React.ReactNode => {
       const body = renderFor(name, params);
       if (!body) return null;
-      const innerSliding = <div className="transition-slide">{body}</div>;
-      return wrapWithLayouts(layouts, name, params, innerSliding);
+      return wrapWithLayouts(layouts, name, params, body);
     };
 
     const renderWithLayouts_outer = (name: RouteName, params: any): React.ReactNode => {
