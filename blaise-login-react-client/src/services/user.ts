import axios from "axios";
import type { User } from "blaise-api-node-client";
import type { AuthManager } from "./AuthManager";

export async function getCurrentUser(authManager: AuthManager): Promise<User> {
  const response = await axios.get<User>("/api/login/current-user", {
    headers: authManager.authHeader(),
  });

  return response.data;
}

export async function getUser(username: string): Promise<User | undefined> {
  try {
    const response = await axios.get<User>(`/api/login/users/${username}`);

    return response.data;
  } catch {
    return undefined;
  }
}

export async function validatePassword(username: string, password: string): Promise<boolean> {
  try {
    const response = await axios.post<boolean>("/api/login/users/password/validate", {
      username,
      password,
    });

    return response.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(`Failed to validate password: ${errorMessage}`);

    return false;
  }
}

export async function validateUserPermissions(username: string): Promise<[boolean, string | null]> {
  try {
    const response = await axios.get<{ token: string }>(`/api/login/users/${username}/authorised`);

    return [true, response.data.token];
  } catch {
    return [false, null];
  }
}

export async function validateToken(token: string | null): Promise<boolean> {
  try {
    await axios.post(
      "/api/login/token/validate",
      { token },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    return true;
  } catch {
    return false;
  }
}
