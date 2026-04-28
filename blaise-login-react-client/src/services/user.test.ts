import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { AuthManager } from "./AuthManager";
import {
  getCurrentUser,
  getUser,
  validatePassword,
  validateToken,
  validateUserPermissions,
} from "./user";

describe("userService", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCurrentUser", () => {
    it("returns the user details", async () => {
      const authManager = new AuthManager();

      // Stub the auth header method to avoid testing AuthManager logic here
      vi.spyOn(authManager, "authHeader").mockReturnValue({ Authorization: "Bearer token" });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "test" }),
      });

      expect(await getCurrentUser(authManager)).toEqual({ role: "test" });
      expect(mockFetch).toHaveBeenCalledWith("/api/login/current-user", expect.any(Object));
    });
  });

  describe("getUser", () => {
    it("returns user details on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "test" }),
      });

      expect(await getUser("bob")).toEqual({ role: "test" });
    });

    it("returns undefined when the API call fails", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      expect(await getUser("bob")).toBeUndefined();
    });
  });

  describe("validatePassword", () => {
    it("returns true on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => true,
      });

      expect(await validatePassword("bob", "password")).toBeTruthy();
    });

    it("returns false and logs error on network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network fail"));
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(await validatePassword("bob", "password")).toBe(false);

      expect(spy).toHaveBeenCalledWith(expect.stringContaining("Network fail"));
      spy.mockRestore();
    });

    it("handles non-error objects thrown in catch", async () => {
      mockFetch.mockRejectedValueOnce("Just a string error");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await validatePassword("bob", "password");

      expect(result).toBe(false);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("Just a string error"));

      spy.mockRestore();
    });
  });

  describe("validateUserPermissions", () => {
    it("returns true and jwt on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "token" }),
      });

      const [validated, token] = await validateUserPermissions("bob");

      expect(validated).toBe(true);
      expect(token).toBe("token");
    });

    it("returns false on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      const [validated, token] = await validateUserPermissions("bob");

      expect(validated).toBe(false);
      expect(token).toBeNull();
    });

    it("returns false on throw/rejection (HTTP error)", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

      const [validated, token] = await validateUserPermissions("bob");

      expect(validated).toBe(false);
      expect(token).toBeNull();
    });
  });

  describe("validateToken", () => {
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
  });
});
