import axios from "axios";
import { User } from "blaise-api-node-client";
import { AuthManager } from "./token";

export async function getCurrentUser(authManager: AuthManager): Promise<User | null> {
  const response = await axios.get("/api/login/current-user", {
    headers: authManager.authHeader()
  });

  return response.data;
}

export async function getUser(username: string): Promise<User | undefined> {
  try {
    const response = await axios.get(`/api/login/users/${username}`);

    return response.data;
  } catch (error: unknown) {
    return undefined;
  }
}

export async function validatePassword(username: string, password: string): Promise<boolean> {
  try {
    const response = await axios.post("/api/login/users/password/validate", {
      username: username,
      password: password
    });

    if (response.status === 200) {
      return response.data;
    }
    console.log(`Did not get the expected response from password validate: ${response.status} - ${response.data}`);
    return false;
  } catch (error: unknown) {
    console.log(`Failed to validate password: ${error}`);
    return false;
  }
}

export async function validateUserPermissions(username: string): Promise<[boolean, string | null]> {
  try {
    const response = await axios.get(`/api/login/users/${username}/authorised`);

    if (response.status === 200) {
      return [true, response.data.token];
    }
  } catch {
    return [false, null];
  }
  return [false, null];
}

export async function validateToken(token: string | null): Promise<boolean> {
  try {
    const response = await axios.post("/api/login/token/validate",
      { token: token }, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    return response.status === 200;
  } catch {
    return false;
  }
}
