import jwt, { type JwtPayload } from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Auth, type AuthenticatedResponseLocals } from "./auth.js";

import type { AuthConfig } from "./auth.types.js";
import type { User } from "blaise-api-node-client";
import type { NextFunction, Request, Response } from "express";

const mockConfig = {
  SessionSecret: "super-secret-test-key",
  SessionTimeout: "1h",
  TokenIssuer: "ons-blaise-v2-test",
  Roles: ["DST", "Admin"],
} satisfies AuthConfig;

const allowedUser = {
  name: "Bob",
  role: "DST",
  serverParks: [],
  defaultServerPark: "",
} satisfies User;

function hasDecodedUserPayload(
  decoded: string | JwtPayload,
): decoded is JwtPayload & { user: User } {
  return typeof decoded === "object" && decoded !== null && "user" in decoded;
}

function expectDecodedUserPayload(
  decoded: string | JwtPayload,
): asserts decoded is JwtPayload & { user: User } {
  expect(hasDecodedUserPayload(decoded)).toBe(true);
}

describe("Auth", () => {
  let auth: Auth;

  beforeEach(() => {
    auth = new Auth(mockConfig);
    vi.clearAllMocks();
  });

  describe("signToken", () => {
    it("should generate a valid JWT containing the user payload", () => {
      const token = auth.signToken(allowedUser);
      const decoded = jwt.verify(token, mockConfig.SessionSecret, {
        issuer: mockConfig.TokenIssuer,
      });

      expectDecodedUserPayload(decoded);

      expect(decoded.user).toEqual(allowedUser);
      expect(decoded.iss).toBe(mockConfig.TokenIssuer);
      expect(decoded.exp).toBeDefined();
    });
  });

  describe("validateToken", () => {
    it("should return false if token is undefined", () => {
      expect(auth.validateToken(undefined)).toBe(false);
    });

    it("should return false if token is invalid or tampered with", () => {
      expect(auth.validateToken("invalid.token.here")).toBe(false);
    });

    it("should return false if the token is valid but the user lacks a valid role", () => {
      const token = jwt.sign(
        { user: { ...allowedUser, role: "UnauthorizedRole" } },
        mockConfig.SessionSecret,
        { issuer: mockConfig.TokenIssuer },
      );

      expect(auth.validateToken(token)).toBe(false);
    });

    it("should return false if the token issuer does not match", () => {
      const token = jwt.sign({ user: allowedUser }, mockConfig.SessionSecret, {
        issuer: "ons-blaise-v2-other",
      });

      expect(auth.validateToken(token)).toBe(false);
    });

    it("should return false if a verified token does not contain a user payload", () => {
      const token = jwt.sign({ completelyDifferentData: true }, mockConfig.SessionSecret, {
        issuer: mockConfig.TokenIssuer,
      });

      expect(auth.validateToken(token)).toBe(false);
    });

    it("should return false if a verified token contains an incomplete user payload", () => {
      const token = jwt.sign({ user: { role: "DST" } }, mockConfig.SessionSecret, {
        issuer: mockConfig.TokenIssuer,
      });

      expect(auth.validateToken(token)).toBe(false);
    });

    it("should return true if the token is valid and user has a valid role", () => {
      const token = jwt.sign({ user: allowedUser }, mockConfig.SessionSecret, {
        issuer: mockConfig.TokenIssuer,
      });

      expect(auth.validateToken(token)).toBe(true);
    });
  });

  describe("userHasRole", () => {
    it("should return false if the user is missing or malformed", () => {
      expect(auth.userHasRole(undefined)).toBe(false);
      expect(auth.userHasRole(null)).toBe(false);
    });

    it("should return false if user role is not in the configured list", () => {
      expect(auth.userHasRole({ role: "Guest" })).toBe(false);
    });

    it("should return true if user role is in the configured list", () => {
      expect(auth.userHasRole({ role: "Admin" })).toBe(true);
    });
  });

  describe("getUser", () => {
    it("should return null if token is undefined", () => {
      expect(auth.getUser(undefined)).toBeNull();
    });

    it("should return null if token is invalid", () => {
      expect(auth.getUser("bad.token")).toBeNull();
    });

    it("should extract and return the user object from a valid token", () => {
      const token = jwt.sign({ user: allowedUser }, mockConfig.SessionSecret, {
        issuer: mockConfig.TokenIssuer,
      });

      expect(auth.getUser(token)).toEqual(allowedUser);
    });

    it("should extract and return the user object from a bearer token", () => {
      const token = jwt.sign({ user: allowedUser }, mockConfig.SessionSecret, {
        issuer: mockConfig.TokenIssuer,
      });

      expect(auth.getUser(`Bearer ${token}`)).toEqual(allowedUser);
    });

    it("should return null if the token issuer does not match", () => {
      const token = jwt.sign({ user: allowedUser }, mockConfig.SessionSecret, {
        issuer: "ons-blaise-v2-other",
      });

      expect(auth.getUser(token)).toBeNull();
    });

    it("should return null if the token is valid but completely missing the user payload", () => {
      const token = jwt.sign({ completelyDifferentData: true }, mockConfig.SessionSecret, {
        issuer: mockConfig.TokenIssuer,
      });

      expect(auth.getUser(token)).toBeNull();
    });

    it("should return null if the token contains a malformed user payload", () => {
      const token = jwt.sign({ user: { role: "DST" } }, mockConfig.SessionSecret, {
        issuer: mockConfig.TokenIssuer,
      });

      expect(auth.getUser(token)).toBeNull();
    });

    it("should return null if the token user does not have a permitted role", () => {
      const token = jwt.sign(
        { user: { ...allowedUser, role: "UnauthorizedRole" } },
        mockConfig.SessionSecret,
        { issuer: mockConfig.TokenIssuer },
      );

      expect(auth.getUser(token)).toBeNull();
    });
  });

  describe("getToken", () => {
    it("should return the token from a bearer authorization header", () => {
      const mockRequest = {
        get: vi.fn().mockReturnValue("Bearer my-token"),
      } as unknown as Request;

      expect(auth.getToken(mockRequest)).toBe("my-token");
      expect(mockRequest.get).toHaveBeenCalledWith("authorization");
    });

    it("should return a raw token unchanged", () => {
      const mockRequest = {
        get: vi.fn().mockReturnValue("my-token"),
      } as unknown as Request;

      expect(auth.getToken(mockRequest)).toBe("my-token");
      expect(mockRequest.get).toHaveBeenCalledWith("authorization");
    });
  });

  describe("middleware", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response<Record<string, never>, AuthenticatedResponseLocals>>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        get: vi.fn(),
        method: "POST",
        originalUrl: "/api/data",
        headers: { referer: "http://localhost" },
        body: {},
      };
      mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        locals: {},
      };
      mockNext = vi.fn();
    });

    it("should return 403 if token validation fails", async () => {
      mockRequest.get = vi.fn().mockReturnValue("bad-token");

      await auth.middleware(
        mockRequest as Request,
        mockResponse as Response<Record<string, never>, AuthenticatedResponseLocals>,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({});
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should attach user to response locals, log the audit, and call next() on success", async () => {
      const adminUser = { ...allowedUser, name: "AdminUser", role: "Admin" } satisfies User;

      mockRequest.get = vi.fn().mockReturnValue(auth.signToken(adminUser));

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await auth.middleware(
        mockRequest as Request,
        mockResponse as Response<Record<string, never>, AuthenticatedResponseLocals>,
        mockNext,
      );

      expect(mockResponse.locals?.authenticatedUser).toEqual(adminUser);
      expect(mockRequest.body).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "AUDIT_LOG: AdminUser is making the following request: POST /api/data http://localhost with body: {}",
        ),
      );
      expect(mockNext).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should sanitise passwords and tokens in the audit log payload", async () => {
      mockRequest.get = vi.fn().mockReturnValue(auth.signToken(allowedUser));
      mockRequest.body = {
        username: "Bob",
        password: "cleartext-password",
        token: "secret-token",
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await auth.middleware(
        mockRequest as Request,
        mockResponse as Response<Record<string, never>, AuthenticatedResponseLocals>,
        mockNext,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"username":"Bob","password":"***","token":"***"}'),
      );

      consoleSpy.mockRestore();
    });

    it("should recursively sanitise nested secrets in the audit log payload", async () => {
      mockRequest.get = vi.fn().mockReturnValue(auth.signToken(allowedUser));
      mockRequest.body = {
        username: "Bob",
        nested: {
          Authorization: "Bearer secret-token",
          credentials: [{ apiKey: "secret-api-key", username: "Nested User" }],
        },
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await auth.middleware(
        mockRequest as Request,
        mockResponse as Response<Record<string, never>, AuthenticatedResponseLocals>,
        mockNext,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '{"username":"Bob","nested":{"Authorization":"***","credentials":[{"apiKey":"***","username":"Nested User"}]}}',
        ),
      );

      consoleSpy.mockRestore();
    });

    it("should fallback to Unknown User in audit logs when the authenticated user name is blank", async () => {
      const blankNameUser = { ...allowedUser, name: "" } satisfies User;

      mockRequest.get = vi.fn().mockReturnValue(auth.signToken(blankNameUser));

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await auth.middleware(
        mockRequest as Request,
        mockResponse as Response<Record<string, never>, AuthenticatedResponseLocals>,
        mockNext,
      );

      expect(mockResponse.locals?.authenticatedUser).toEqual(blankNameUser);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("AUDIT_LOG: Unknown User is making the following request:"),
      );

      consoleSpy.mockRestore();
    });

    it("should log an empty audit body when the request body is not an object", async () => {
      mockRequest.get = vi.fn().mockReturnValue(auth.signToken(allowedUser));
      mockRequest.body = undefined;

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await auth.middleware(
        mockRequest as Request,
        mockResponse as Response<Record<string, never>, AuthenticatedResponseLocals>,
        mockNext,
      );

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("with body: {}"));

      consoleSpy.mockRestore();
    });

    it("should log an empty audit body when the request body is an array", async () => {
      mockRequest.get = vi.fn().mockReturnValue(auth.signToken(allowedUser));
      mockRequest.body = ["unexpected", "array"];

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await auth.middleware(
        mockRequest as Request,
        mockResponse as Response<Record<string, never>, AuthenticatedResponseLocals>,
        mockNext,
      );

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("with body: {}"));

      consoleSpy.mockRestore();
    });
  });
});
