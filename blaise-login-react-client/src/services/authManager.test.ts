import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthManager, createSessionKey, normaliseCookieDomain } from "./authManager";
import * as userModule from "./user";

vi.mock("./user");

const baseSessionKey = "blaise-user-test";

describe("AuthManager", () => {
  let authManager: AuthManager;

  beforeEach(() => {
    authManager = new AuthManager({ sessionKey: baseSessionKey });
    authManager.clearToken();
    vi.clearAllMocks();
  });

  describe("createSessionKey", () => {
    it("should prefix the environment key", () => {
      expect(createSessionKey("ons-blaise-v2-dev-ben1")).toBe("blaise-user-ons-blaise-v2-dev-ben1");
    });

    it("should trim surrounding whitespace", () => {
      expect(createSessionKey("  ons-blaise-v2-dev-ben1  ")).toBe(
        "blaise-user-ons-blaise-v2-dev-ben1",
      );
    });

    it("should throw when the environment key is blank", () => {
      expect(() => createSessionKey("   ")).toThrow("environmentKey must be provided");
    });

    it("should throw when the environment key is undefined at runtime", () => {
      expect(() => createSessionKey(undefined as unknown as string)).toThrow(
        "environmentKey must be provided",
      );
    });
  });

  describe("normaliseCookieDomain", () => {
    it("should remove a leading dot", () => {
      expect(normaliseCookieDomain(".social-surveys.gcp.onsdigital.uk")).toBe(
        "social-surveys.gcp.onsdigital.uk",
      );
    });

    it("should throw when the cookie domain is blank", () => {
      expect(() => normaliseCookieDomain("   ")).toThrow("cookieDomain must be provided");
    });

    it("should reject cookie domains that include a protocol", () => {
      expect(() => normaliseCookieDomain("https://social-surveys.gcp.onsdigital.uk")).toThrow(
        "cookieDomain must be a bare domain name without a protocol, path, or port",
      );
    });

    it("should reject cookie domains that include a path", () => {
      expect(() => normaliseCookieDomain("social-surveys.gcp.onsdigital.uk/login")).toThrow(
        "cookieDomain must be a bare domain name without a protocol, path, or port",
      );
    });

    it("should reject cookie domains that include a port", () => {
      expect(() => normaliseCookieDomain("social-surveys.gcp.onsdigital.uk:443")).toThrow(
        "cookieDomain must be a bare domain name without a protocol, path, or port",
      );
    });
  });

  describe("constructor", () => {
    it("should store the supplied session key", () => {
      const manager = new AuthManager({ sessionKey: "editing-service" });

      expect(manager.sessionKey).toBe("editing-service");
    });

    it("should normalise the supplied cookie domain", () => {
      const manager = new AuthManager({
        sessionKey: baseSessionKey,
        cookieDomain: ".social-surveys.gcp.onsdigital.uk",
      });

      expect(manager.cookieDomain).toBe("social-surveys.gcp.onsdigital.uk");
    });

    it("should throw when the session key is blank", () => {
      expect(() => new AuthManager({ sessionKey: "  " })).toThrow("sessionKey must be provided");
    });
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
    it("should include the configured cookie domain when supplied", () => {
      const manager = new AuthManager({
        sessionKey: baseSessionKey,
        cookieDomain: ".social-surveys.gcp.onsdigital.uk",
      });
      const settings = manager.cookieSettings();

      expect(settings.domain).toBe("social-surveys.gcp.onsdigital.uk");
    });

    it("should omit the cookie domain when not supplied", () => {
      const settings = authManager.cookieSettings();

      expect(settings.domain).toBeUndefined();
    });

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
