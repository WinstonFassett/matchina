import React from "react";
import "./transitions.css";
import { createRouter } from "./createRouter";
import { RTGViewer, AnimModeProvider } from "./viewers";

/** Minimal, self-contained router instance just for this demo */
const {
  RouterProvider,
  Routes,
  Link,
} = createRouter({
  Start: "/",
  A: "/a",
  B: "/b",
}, {
  useHash: true,
});

/** Helper Component to make a new page, matching the RR example style */
const Page: React.FC<{ to: { name: "A" | "B" } }> = (props) => (
  <main className="p-6">
    {/* Use our Link with named routes */}
    <Link {...props.to}>
      <span className="underline text-blue-600 hover:text-blue-700 cursor-pointer">
        {props.children}
      </span>
    </Link>
  </main>
);

/** Page A */
const A: React.FC = () => (
  <Page to={{ name: "B" }}>You're on "/a": click to go to "/b"</Page>
);
/** Page B */
const B: React.FC = () => (
  <Page to={{ name: "A" }}>Now on "/b": now click to go to "/a"</Page>
);
/** Start Page */
const StartDemo: React.FC = () => (
  <Page to={{ name: "A" }}>Click to start animated pages demo</Page>
);

/**
 * App mirrors the simplicity of the React Router + TransitionGroup example,
 * but leverages our data-only `Routes` with the `RTGViewer` to handle
 * enter/exit and parallel animations via CSS in `transitions.css`.
 */
export const MiniRouterTransitionsApp: React.FC = () => {
  // Choose a simple slideshow or fade; slideshow shows full travel.
  return (
    <RouterProvider>
      {/* Presentation-only: choose animation mode; both directions same for this demo */}
      <AnimModeProvider value={{ forward: "slideshow", back: "slideshow" }}>
        <div className="min-h-[200px]">
          <Routes
            viewer={RTGViewer}
            // keep=1 ensures previous remains mounted to animate out in parallel
            keep={1}
            views={{
              A,
              B,
              Start: StartDemo,
            }}
          />
        </div>
      </AnimModeProvider>
    </RouterProvider>
  );
};

/**
 * Root component for mounting in a sandbox or story.
 * Consumers can import and render <MiniRouterTransitionsRoot/>.
 */
export const MiniRouterTransitionsRoot: React.FC = () => (
  <MiniRouterTransitionsApp />
);
