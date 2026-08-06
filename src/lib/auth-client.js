import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  /** The base URL of the server (fallback to origin if undefined on client) */
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || (typeof window !== "undefined" ? window.location.origin : undefined),
});

export const { signIn, signUp, useSession } = authClient;