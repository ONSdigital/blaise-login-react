import type { AuthManager } from "./authManager";
import type { User } from "../types/user.types";

export type LoginFailureReason = "invalid-credentials" | "not-authorized" | "request-failed";

export type LoginResult =
  | { authenticated: true; token: string }
  | { authenticated: false; reason: LoginFailureReason };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isUser(value: unknown): value is User {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.name === "string" &&
    typeof candidate.role === "string" &&
    typeof candidate.defaultServerPark === "string" &&
    isStringArray(candidate.serverParks)
  );
}

function hasTokenResponse(value: unknown): value is { token: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "token" in value &&
    typeof value.token === "string"
  );
}

export async function getCurrentUser(authManager: AuthManager): Promise<User | null> {
  const response = await fetch("/api/login/current-user", {
    method: "GET",
    headers: authManager.authHeader(),
  });

  // Changed: treat 403 as an unauthenticated session so callers can use one current-user request for both auth and data.
  if (response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch current user: ${response.statusText}`);
  }

  const data: unknown = await response.json();

  if (!isUser(data)) {
    throw new Error("Current user response was malformed");
  }

  return data;
}

export async function getUser(
  username: string,
  authManager?: Pick<AuthManager, "authHeader">,
): Promise<User | undefined> {
  try {
    const response = await fetch(`/api/login/users/${encodeURIComponent(username)}`, {
      method: "GET",
      headers: authManager?.authHeader() ?? {},
    });

    if (!response.ok) {
      return undefined;
    }

    const data: unknown = await response.json();

    if (!isUser(data)) {
      return undefined;
    }

    return data;
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
      const data: unknown = await response.json();

      if (!hasTokenResponse(data)) {
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
  if (!token) {
    return false;
  }

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
