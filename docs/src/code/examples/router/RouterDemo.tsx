import React, { useState } from "react";
import { createRouterMachine } from "./machine";

// Create the router machine instance
const routerMachine = createRouterMachine();

export const RouterDemo = () => {
  const [currentRoute, setCurrentRoute] = useState(routerMachine.current);
  
  // Subscribe to state changes
  routerMachine.subscribe(() => {
    setCurrentRoute(routerMachine.current);
  });

  return (
    <div className="router-demo">
      <h1>Matchina Router Demo</h1>
      
      <nav style={{ marginBottom: "20px" }}>
        <button onClick={() => routerMachine.push("/")}>
          Home
        </button>
        <button onClick={() => routerMachine.push("/about")}>
          About
        </button>
        <button onClick={() => routerMachine.push("/products")}>
          Products
        </button>
        <button onClick={() => routerMachine.push("/users/123")}>
          User Profile
        </button>
      </nav>

      {/* Route Content */}
      {currentRoute.match({
        Home: () => (
          <div>
            <h2>Home Page</h2>
            <p>Welcome to our application!</p>
          </div>
        ),
        About: () => (
          <div>
            <h2>About Page</h2>
            <p>Learn more about our company.</p>
          </div>
        ),
        Products: ({ data }) => (
          <div>
            <h2>Products Page</h2>
            <p>Category: {data.params?.category || "all"}</p>
            <p>Page: {data.params?.page || 1}</p>
            
            <div style={{ margin: "10px 0" }}>
              <input 
                type="text" 
                placeholder="Search products..." 
                value={data.params?.searchTerm || ""}
                onChange={(e) => routerMachine.updateCategory(e.target.value)}
              />
            </div>
            
            <div>
              <button onClick={() => routerMachine.updateCategory("electronics")}>
                Electronics
              </button>
              <button onClick={() => routerMachine.updateCategory("clothing")}>
                Clothing
              </button>
              <button onClick={() => routerMachine.updateCategory("books")}>
                Books
              </button>
            </div>
            
            <div style={{ margin: "10px 0" }}>
              <button 
                onClick={() => routerMachine.goToPage(Math.max(1, (data.params?.page || 1) - 1))}
                disabled={(data.params?.page || 1) <= 1}
              >
                Previous Page
              </button>
              <span style={{ margin: "0 10px" }}>Page {data.params?.page || 1}</span>
              <button 
                onClick={() => routerMachine.goToPage((data.params?.page || 1) + 1)}
              >
                Next Page
              </button>
            </div>
            
            <div style={{ margin: "10px 0" }}>
              <button onClick={() => routerMachine.push("/products/demo-id")}>
                View Product Detail
              </button>
            </div>
          </div>
        ),
        ProductDetail: ({ data }) => (
          <div>
            <h2>Product Detail</h2>
            <p>Product ID: {data.params?.id || "unknown"}</p>
            <button onClick={() => routerMachine.push("/products")}>
              Back to Products
            </button>
          </div>
        ),
        UserProfile: ({ data }) => (
          <div>
            <h2>User Profile</h2>
            <p>User ID: {data.params?.userId || "unknown"}</p>
            <button onClick={() => routerMachine.push("/")}>
              Back to Home
            </button>
          </div>
        ),
        Cart: () => (
          <div>
            <h2>Shopping Cart</h2>
            <p>Your cart is empty.</p>
            <button onClick={() => routerMachine.push("/")}>
              Continue Shopping
            </button>
            <h2>Checkout</h2>
            <p>Complete your purchase.</p>
            <button onClick={() => routerMachine.navigateToCart()}>
              Back to Cart
            </button>
          </div>
        ),
        NotFound: () => (
          <div>
            <h2>404 - Page Not Found</h2>
            <button onClick={() => routerMachine.navigateToHome()}>
              Go Home
            </button>
          </div>
        ),
      })}
    </div>
  );
};
