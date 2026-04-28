import type { User } from "../types/User";
import type { AuthManager } from "./AuthManager";

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
      return undefined; // Matches original behavior on failure
    }

    return await response.json();
  } catch {
    return undefined;
  }
}

export async function validatePassword(username: string, password: string): Promise<boolean> {
  try {
    const response = await fetch("/api/login/users/password/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Since the original returned a plain boolean, we parse it as JSON
    return await response.json();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`Failed to validate password: ${errorMessage}`);

    return false;
  }
}

export async function validateUserPermissions(username: string): Promise<[boolean, string | null]> {
  try {
    const response = await fetch(`/api/login/users/${username}/authorized`, {
      method: "GET",
    });

    if (!response.ok) {
      return [false, null];
    }

    const data = await response.json();

    return [true, data.token];
  } catch {
    return [false, null];
  }
}

export async function validateToken(token: string | null): Promise<boolean> {
  try {
    const response = await fetch("/api/login/token/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    // If the original simply expected a 200 OK without a response body
    return response.ok;
  } catch {
    return false;
  }
}
