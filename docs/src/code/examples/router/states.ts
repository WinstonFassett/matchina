import { defineStates } from "matchina";

// Define the possible routes in our application with their path patterns
export const states = defineStates({
  Home: () => ({ path: "/" }),
  About: () => ({ path: "/about" }),
  Products: ({
    category = "all",
    page = 1,
  }: {
    category?: string;
    page?: number;
  } = {}) => ({ 
    path: "/products", 
    params: { category, page } 
  }),
  ProductDetail: ({ id }: { id: string }) => ({ 
    path: `/products/${id}`, 
    params: { id } 
  }),
  UserProfile: ({ userId }: { userId: string }) => ({ 
    path: `/users/${userId}`, 
    params: { userId } 
  }),
  NotFound: () => ({ path: "*" }),
});
