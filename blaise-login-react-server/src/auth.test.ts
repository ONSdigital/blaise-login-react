import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
  type Mock,
} from "vitest";
import jwt from "jsonwebtoken";
import { Auth } from "./auth.js";
import type { AuthConfig } from "./config.js";
import type { Request, Response, NextFunction } from "express";
import type { User } from "blaise-api-node-client";

const mockConfig: AuthConfig = {
  SessionSecret: "super-secret-test-key",
  SessionTimeout: "1h",
  Roles: ["DST", "Admin"],
  BlaiseApiUrl: "localhost:80",
};

describe("Auth", () => {
  let auth: Auth;

  beforeEach(() => {
    auth = new Auth(mockConfig);
    vi.clearAllMocks();
  });

  describe("SignToken", () => {
    it("should generate a valid JWT containing the user payload", () => {
      const mockUser = { name: "Bob", role: "DST", serverParks: [], defaultServerPark: "" };
      const token = auth.SignToken(mockUser);
      const decoded = jwt.verify(token, mockConfig.SessionSecret) as unknown as {
        user: User;
        exp: number;
      };

      expect(decoded.user).toEqual(mockUser);
      expect(decoded.exp).toBeDefined();
    });
  });

  describe("ValidateToken", () => {
    it("should return false if token is undefined", () => {
      expect(auth.ValidateToken(undefined)).toBe(false);
    });

    it("should return false if token is invalid or tampered with", () => {
      expect(auth.ValidateToken("invalid.token.here")).toBe(false);
    });

    it("should return false if the token is valid but the user lacks a valid role", () => {
      const token = jwt.sign({ user: { role: "UnauthorizedRole" } }, mockConfig.SessionSecret);

      expect(auth.ValidateToken(token)).toBe(false);
    });

    it("should return true if the token is valid and user has a valid role", () => {
      const token = jwt.sign({ user: { role: "DST" } }, mockConfig.SessionSecret);

      expect(auth.ValidateToken(token)).toBe(true);
    });
  });

  describe("UserHasRole", () => {
    it("should return false if user object is malformed or missing role", () => {
      expect(auth.UserHasRole({} as unknown as User)).toBe(false);
      expect(auth.UserHasRole(null as unknown as User)).toBe(false);
    });

    it("should return false if user role is not in the configured list", () => {
      const user = { name: "Bob", role: "Guest", serverParks: [], defaultServerPark: "" };

      expect(auth.UserHasRole(user)).toBe(false);
    });

    it("should return true if user role is in the configured list", () => {
      const user = { name: "Bob", role: "Admin", serverParks: [], defaultServerPark: "" };

      expect(auth.UserHasRole(user)).toBe(true);
    });
  });

  describe("GetUser", () => {
    let consoleErrorSpy: MockInstance;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("should return a fallback user and log an error if token is undefined", () => {
      const user = auth.GetUser(undefined);

      expect(user).toEqual({ name: "", role: "", serverParks: [], defaultServerPark: "" });
      expect(consoleErrorSpy).toHaveBeenCalledWith("Must provide a token to get a user");
    });

    it("should return a fallback user and log an error if token is invalid", () => {
      const user = auth.GetUser("bad.token");

      expect(user).toEqual({ name: "", role: "", serverParks: [], defaultServerPark: "" });
      expect(consoleErrorSpy).toHaveBeenCalledWith("Must provide a valid token to get a user");
    });

    it("should extract and return the user object from a valid token", () => {
      const expectedUser = {
        name: "Alice",
        role: "DST",
        serverParks: ["park1"],
        defaultServerPark: "park1",
      };
      const token = jwt.sign({ user: expectedUser }, mockConfig.SessionSecret);

      const user = auth.GetUser(token);

      expect(user).toEqual(expectedUser);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should return a fallback user if the token is valid but completely missing the 'user' payload", () => {
      const token = jwt.sign({ completelyDifferentData: true }, mockConfig.SessionSecret);

      const user = auth.GetUser(token);

      expect(user).toEqual({ name: "", role: "", serverParks: [], defaultServerPark: "" });
    });
  });

  describe("GetToken", () => {
    it("should return the authorization header from the request", () => {
      const mockRequest = {
        get: vi.fn().mockReturnValue("Bearer my-token"),
      } as unknown as Request;

      const token = auth.GetToken(mockRequest);

      expect(mockRequest.get).toHaveBeenCalledWith("authorization");
      expect(token).toBe("Bearer my-token");
    });
  });

  describe("Middleware", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
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
        setHeader: vi.fn(),
      };
      mockNext = vi.fn();
    });

    it("should return 403 if token validation fails", async () => {
      (mockRequest.get as Mock).mockReturnValue("bad-token");

      await auth.Middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should attach user to body and headers, log the audit, and call next() on success", async () => {
      const validToken = jwt.sign(
        { user: { name: "AdminUser", role: "Admin" } },
        mockConfig.SessionSecret,
      );

      (mockRequest.get as Mock).mockReturnValue(validToken);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await auth.Middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith("currentlyloggedinuser", "AdminUser");
      expect(mockRequest.body.currentlyloggedinuser).toBe("AdminUser");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "AUDIT_LOG: AdminUser is making the following request: POST /api/data http://localhost with body: {}",
        ),
      );
      expect(mockNext).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should sanitise passwords in the audit log payload", async () => {
      const validToken = jwt.sign(
        { user: { name: "AdminUser", role: "Admin" } },
        mockConfig.SessionSecret,
      );

      (mockRequest.get as Mock).mockReturnValue(validToken);
      mockRequest.body = { username: "AdminUser", password: "cleartext-password" };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await auth.Middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"username":"AdminUser","password":"***"}'),
      );
      expect(mockNext).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should fallback to 'Unknown User' in audit logs if token is valid but missing a name", async () => {
      const validToken = jwt.sign({ user: { role: "Admin", name: "" } }, mockConfig.SessionSecret);

      (mockRequest.get as Mock).mockReturnValue(validToken);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await auth.Middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("AUDIT_LOG: Unknown User is making the following request:"),
      );
      expect(mockResponse.setHeader).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
