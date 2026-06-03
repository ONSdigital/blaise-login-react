import type { AuthManager } from "./authManager";
import type { User } from "../types/user.types";

export type LoginFailureReason =
  | "invalid-credentials"
  | "not-authorized"
  | "rate-limited"
  | "request-failed";

export type LoginResult =
  | { authenticated: true; token: string }
  | { authenticated: false; reason: LoginFailureReason };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isUser(value: unknown): value is User {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === "string" &&
    typeof value.role === "string" &&
    typeof value.defaultServerPark === "string" &&
    isStringArray(value.serverParks)
  );
}

function hasTokenResponse(value: unknown): value is { token: string } {
  return isRecord(value) && typeof value.token === "string";
}

export async function getCurrentUser(authManager: AuthManager): Promise<User | null> {
  const response = await fetch("/api/login/current-user", {
    method: "GET",
    headers: authManager.authHeader(),
  });

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

export async function authenticateUser(username: string, password: string): Promise<LoginResult> {
  let response: Response;

  try {
    response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`Failed to authenticate user: ${errorMessage}`);

    return { authenticated: false, reason: "request-failed" };
  }

  if (response.ok) {
    const data: unknown = await response.json();

    if (!hasTokenResponse(data)) {
      console.error("Failed to authenticate user: Login response did not include a token");

      return { authenticated: false, reason: "request-failed" };
    }

    return { authenticated: true, token: data.token };
  }

  if (response.status === 401) {
    return { authenticated: false, reason: "invalid-credentials" };
  }

  if (response.status === 403) {
    return { authenticated: false, reason: "not-authorized" };
  }

  if (response.status === 429) {
    return { authenticated: false, reason: "rate-limited" };
  }

  console.error(`Failed to authenticate user: HTTP ${response.status}`);

  return { authenticated: false, reason: "request-failed" };
}
