import { createAuthClient } from "better-auth/react";

const SERVER_BASE_URL =
  import.meta.env.VITE_SERVER_BASE_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: SERVER_BASE_URL,
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
