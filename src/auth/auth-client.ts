import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_HOST ?? "http://localhost:3000",
  plugins: [],
});


