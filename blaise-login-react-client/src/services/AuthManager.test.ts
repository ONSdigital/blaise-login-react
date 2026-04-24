import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthManager } from "./AuthManager";
import * as userModule from "./user";

vi.mock("./user");

describe("AuthManager", () => {
  let authManager: AuthManager;

  beforeEach(() => {
    authManager = new AuthManager();
    authManager.clearToken();
    vi.clearAllMocks();
  });

  describe("loggedIn", () => {
    it("should return false if no token is present", async () => {
      vi.spyOn(authManager, "getToken").mockReturnValue(null);

      const spy = vi.spyOn(userModule, "validateToken").mockResolvedValue(false);

      const loggedIn = await authManager.loggedIn();

      expect(loggedIn).toBe(false);
      expect(spy).toHaveBeenCalledWith(null);
    });

    it("should handle non-error objects in catch", async () => {
      vi.spyOn(userModule, "validateToken").mockRejectedValue("Random string error");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const loggedIn = await authManager.loggedIn();

      expect(loggedIn).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error checking logged in state: Random string error",
      );

      consoleSpy.mockRestore();
    });

    it("should catch errors in validateToken and return false", async () => {
      vi.spyOn(userModule, "validateToken").mockRejectedValue(new Error("API Fail"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const loggedIn = await authManager.loggedIn();

      expect(loggedIn).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("authHeader", () => {
    it("should return empty object when no token exists (Line 39)", () => {
      authManager.clearToken();

      expect(authManager.authHeader()).toEqual({});
    });

    it("should return authorization header when token exists", () => {
      authManager.setToken("mock-token");

      expect(authManager.authHeader()).toEqual({ authorization: "mock-token" });
    });
  });

  describe("cookieSettings", () => {
    it("should set secure to true on https", () => {
      vi.stubGlobal("window", { location: { hostname: "example.com", protocol: "https:" } });
      const settings = authManager.cookieSettings();

      expect(settings.secure).toBe(true);
    });

    it("should set secure to false on http", () => {
      vi.stubGlobal("window", { location: { hostname: "example.com", protocol: "http:" } });
      const settings = authManager.cookieSettings();

      expect(settings.secure).toBe(false);
    });
  });
});
