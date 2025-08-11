import { createRouterMachine } from "./machine";

describe("Router Machine", () => {
  it("should navigate between routes", () => {
    const router = createRouterMachine();
    
    // Should start at Home
    expect(router.current.key).toBe("Home");
    
    // Navigate to About
    router.navigateToAbout();
    expect(router.current.key).toBe("About");
    
    // Navigate to Products
    router.navigateToProducts();
    expect(router.current.key).toBe("Products");
    
    // Navigate to specific product
    router.navigateToProductDetail("123");
    expect(router.current.key).toBe("ProductDetail");
    expect(router.current.data.id).toBe("123");
  });
  
  it("should update route parameters", () => {
    const router = createRouterMachine();
    
    // Go to products page
    router.navigateToProducts();
    expect(router.current.key).toBe("Products");
    expect(router.current.data.category).toBe("all");
    expect(router.current.data.page).toBe(1);
    expect(router.current.data.searchTerm).toBe("");
    
    // Update search term
    router.updateSearch("laptop");
    expect(router.current.data.searchTerm).toBe("laptop");
    
    // Update category
    router.updateCategory("electronics");
    expect(router.current.data.category).toBe("electronics");
    expect(router.current.data.page).toBe(1); // Page should reset
    
    // Go to next page
    router.goToPage(2);
    expect(router.current.data.page).toBe(2);
    expect(router.current.data.category).toBe("electronics"); // Category should remain
  });
});
