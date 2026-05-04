import type { User } from "../types/User";
import type { AuthManager } from "./AuthManager";

export type LoginFailureReason = "invalid-credentials" | "not-authorized" | "request-failed";

export type LoginResult =
  | { authenticated: true; token: string }
  | { authenticated: false; reason: LoginFailureReason };

export async function getCurrentUser(authManager: AuthManager): Promise<User> {
  const response = await fetch("/api/login/current-user", {
    method: "GET",
    headers: authManager.authHeader(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch current user: ${response.statusText}`);
  }

  return response.json();
}

export async function getUser(username: string): Promise<User | undefined> {
  try {
    const response = await fetch(`/api/login/users/${username}`, {
      method: "GET",
    });

    if (!response.ok) {
      return undefined;
    }

    return await response.json();
  } catch {
    return undefined;
  }
}

export async function authenticateUser(username: string, password: string): Promise<LoginResult> {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = (await response.json()) as { token?: string };

      if (!data.token) {
        throw new Error("Login response did not include a token");
      }

      return { authenticated: true, token: data.token };
    }

    if (response.status === 401) {
      return { authenticated: false, reason: "invalid-credentials" };
    }

    if (response.status === 403) {
      return { authenticated: false, reason: "not-authorized" };
    }

    throw new Error(`HTTP ${response.status}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`Failed to authenticate user: ${errorMessage}`);

    return { authenticated: false, reason: "request-failed" };
  }
}

export async function validateToken(token: string | null): Promise<boolean> {
  try {
    const response = await fetch("/api/login/token/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
