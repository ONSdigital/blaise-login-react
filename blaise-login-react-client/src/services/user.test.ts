import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthManager } from "./authManager";
import { authenticateUser, getCurrentUser, getUser, validateToken } from "./user";

describe("userService", () => {
  const mockFetch = vi.fn();
  const authManagerOptions = { sessionKey: "blaise-user-test" };

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCurrentUser", () => {
    it("returns the user details", async () => {
      const authManager = new AuthManager(authManagerOptions);

      vi.spyOn(authManager, "authHeader").mockReturnValue({ authorization: "Bearer token" });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: "Jake",
          role: "DST",
          defaultServerPark: "gusty",
          serverParks: ["gusty"],
        }),
      });

      expect(await getCurrentUser(authManager)).toEqual({
        name: "Jake",
        role: "DST",
        defaultServerPark: "gusty",
        serverParks: ["gusty"],
      });
      expect(mockFetch).toHaveBeenCalledWith("/api/login/current-user", expect.any(Object));
    });

    it("returns null for a 403 response", async () => {
      const authManager = new AuthManager(authManagerOptions);

      vi.spyOn(authManager, "authHeader").mockReturnValue({ authorization: "Bearer token" });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403, statusText: "Forbidden" });

      await expect(getCurrentUser(authManager)).resolves.toBeNull();
    });

    it("throws if the response is not ok", async () => {
      const authManager = new AuthManager(authManagerOptions);

      vi.spyOn(authManager, "authHeader").mockReturnValue({ authorization: "Bearer token" });
      mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Unauthorized" });
      await expect(getCurrentUser(authManager)).rejects.toThrow(
        "Failed to fetch current user: Unauthorized",
      );
    });

    it("throws if the response body is malformed", async () => {
      const authManager = new AuthManager(authManagerOptions);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "test" }),
      });

      await expect(getCurrentUser(authManager)).rejects.toThrow(
        "Current user response was malformed",
      );
    });

    it("throws if the response body is null", async () => {
      const authManager = new AuthManager(authManagerOptions);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      await expect(getCurrentUser(authManager)).rejects.toThrow(
        "Current user response was malformed",
      );
    });

    it("throws if the response body has invalid server parks", async () => {
      const authManager = new AuthManager(authManagerOptions);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: "Jake",
          role: "DST",
          defaultServerPark: "gusty",
          serverParks: [123],
        }),
      });

      await expect(getCurrentUser(authManager)).rejects.toThrow(
        "Current user response was malformed",
      );
    });
  });

  describe("getUser", () => {
    it("returns user details on success", async () => {
      const authManager = new AuthManager(authManagerOptions);

      vi.spyOn(authManager, "authHeader").mockReturnValue({ authorization: "Bearer token" });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: "Bob",
          role: "DST",
          defaultServerPark: "gusty",
          serverParks: ["gusty"],
        }),
      });

      expect(await getUser("bob", authManager)).toEqual({
        name: "Bob",
        role: "DST",
        defaultServerPark: "gusty",
        serverParks: ["gusty"],
      });
      expect(mockFetch).toHaveBeenCalledWith("/api/login/users/bob", {
        method: "GET",
        headers: { authorization: "Bearer token" },
      });
    });

    it("returns undefined when the API call fails", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      expect(await getUser("bob")).toBeUndefined();
    });

    it("returns undefined when the response body is malformed", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "test" }),
      });

      expect(await getUser("bob")).toBeUndefined();
    });

    it("returns undefined when fetch throws (network error)", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      expect(await getUser("bob")).toBeUndefined();
    });
  });

  describe("authenticateUser", () => {
    it("returns a token on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "token" }),
      });

      expect(await authenticateUser("bob", "password")).toEqual({
        authenticated: true,
        token: "token",
      });
      expect(mockFetch).toHaveBeenCalledWith("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "bob", password: "password" }),
      });
    });

    it("returns request-failed if response is ok but token is missing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const result = await authenticateUser("bob", "password");

      expect(result).toEqual({ authenticated: false, reason: "request-failed" });
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("Login response did not include a token"),
      );
      spy.mockRestore();
    });

    it("returns invalid-credentials on a 401 response", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

      expect(await authenticateUser("bob", "password")).toEqual({
        authenticated: false,
        reason: "invalid-credentials",
      });
    });

    it("returns not-authorized on a 403 response", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

      expect(await authenticateUser("bob", "password")).toEqual({
        authenticated: false,
        reason: "not-authorized",
      });
    });

    it("returns request-failed and logs error on network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network fail"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(await authenticateUser("bob", "password")).toEqual({
        authenticated: false,
        reason: "request-failed",
      });
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("Network fail"));
      spy.mockRestore();
    });

    it("handles non-error objects thrown in catch", async () => {
      mockFetch.mockRejectedValueOnce("Just a string error");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await authenticateUser("bob", "password");

      expect(result).toEqual({ authenticated: false, reason: "request-failed" });
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("Just a string error"));

      spy.mockRestore();
    });

    it("returns request-failed if the login response token is not a string", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 123 }),
      });
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await authenticateUser("bob", "password");

      expect(result).toEqual({ authenticated: false, reason: "request-failed" });
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("Login response did not include a token"),
      );

      spy.mockRestore();
    });

    it("returns request-failed on unexpected HTTP errors", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(await authenticateUser("bob", "password")).toEqual({
        authenticated: false,
        reason: "request-failed",
      });
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("HTTP 500"));

      spy.mockRestore();
    });
  });

  describe("validateToken", () => {
    it("returns false when no token is provided", async () => {
      const result = await validateToken(null);

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("returns true for a valid token", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await validateToken("valid-token");

      expect(result).toBe(true);
    });

    it("returns false for an invalid token", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

      const result = await validateToken("invalid-token");

      expect(result).toBe(false);
    });

    it("returns false when fetch throws (network error)", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const result = await validateToken("any-token");

      expect(result).toBe(false);
    });
  });
});
