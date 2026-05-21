import express, { type Express, type Response as ExpressResponse, type Request } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

import { Auth, type AuthenticatedResponseLocals } from "./auth.js";
import { LoginHandler, newLoginHandler } from "./loginHandler.js";

import type { AuthConfig } from "./auth.types.js";
import type { BlaiseApiClient, User } from "blaise-api-node-client";

const config = {
  SessionSecret: "fake-secret",
  SessionTimeout: "10m",
  TokenIssuer: "ons-blaise-v2-test",
  Roles: ["DST", "BDSS", "TO Manager"],
} satisfies AuthConfig;

const allowedUser = {
  name: "Jake",
  role: "DST",
  defaultServerPark: "gusty",
  serverParks: ["gusty"],
} satisfies User;

const auth = new Auth(config);

const mockBlaiseApiClient = {
  getUser: vi.fn(),
  validatePassword: vi.fn(),
};

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

function createAuthorisationToken(user: User = allowedUser): string {
  return auth.signToken(user);
}

function newServer(): Express {
  const server = express();
  const loginHandler = newLoginHandler(auth, mockBlaiseApiClient as unknown as BlaiseApiClient);

  server.use(loginHandler);

  return server;
}

const app = newServer();
const request = supertest(app);

describe("LoginHandler", () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCurrentUser", () => {
    it("should return a 200 and the user details", async () => {
      const currentUser = { ...allowedUser, name: "test" } satisfies User;
      const token = auth.signToken(currentUser);

      const response = await request.get("/api/login/current-user").set("authorization", token);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual(currentUser);
    });

    it("should return a 403 if the token is missing or invalid", async () => {
      const response = await request.get("/api/login/current-user");

      expect(response.status).toEqual(403);
      expect(response.body).toEqual({});
    });

    it("should return a 500 if the route is executed without middleware locals", async () => {
      const handler = new LoginHandler(auth, mockBlaiseApiClient as unknown as BlaiseApiClient);
      const mockReq = {} as Request;
      const mockRes = {
        locals: {},
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as ExpressResponse<unknown, AuthenticatedResponseLocals>;

      await handler.getCurrentUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Internal server error" });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should return a token when the credentials are valid and the user has a permitted role", async () => {
      const body = { username: "Jake", password: "2342388" };

      mockBlaiseApiClient.validatePassword.mockResolvedValue(true);
      mockBlaiseApiClient.getUser.mockResolvedValue(allowedUser);

      const response = await request.post("/api/login").send(body);

      expect(response.status).toEqual(200);
      expect(mockBlaiseApiClient.validatePassword).toHaveBeenCalledWith("Jake", "2342388");
      expect(mockBlaiseApiClient.getUser).toHaveBeenCalledWith("Jake");

      const decodedJwt = jwt.verify(response.body.token, config.SessionSecret, {
        issuer: config.TokenIssuer,
      });

      expectDecodedUserPayload(decodedJwt);

      expect(decodedJwt.user).toEqual(allowedUser);
    });

    const invalidInputs = [
      { condition: "username is empty", body: { username: "", password: "123" } },
      { condition: "username is undefined", body: { password: "123" } },
      { condition: "password is empty", body: { username: "Jake", password: "" } },
      { condition: "password is undefined", body: { username: "Jake" } },
    ];

    it.each(invalidInputs)("should return a 400 if $condition", async ({ body }) => {
      mockBlaiseApiClient.validatePassword.mockResolvedValue(true);

      const response = await request.post("/api/login").send(body);

      expect(response.status).toEqual(400);
      expect(response.body).toEqual({ error: "Username or password has not been supplied" });
      expect(mockBlaiseApiClient.validatePassword).not.toHaveBeenCalled();
      expect(mockBlaiseApiClient.getUser).not.toHaveBeenCalled();
    });

    it("should return a 401 when the password is invalid", async () => {
      const body = { username: "Jake", password: "wrong-password" };

      mockBlaiseApiClient.validatePassword.mockResolvedValue(false);

      const response = await request.post("/api/login").send(body);

      expect(response.status).toEqual(401);
      expect(response.body).toEqual({ error: "Incorrect username or password" });
      expect(mockBlaiseApiClient.getUser).not.toHaveBeenCalled();
    });

    it("should return a 403 when the user does not have a permitted role", async () => {
      const body = { username: "Jake", password: "2342388" };
      const unauthorisedUser = { ...allowedUser, role: "Interviewer" } satisfies User;

      mockBlaiseApiClient.validatePassword.mockResolvedValue(true);
      mockBlaiseApiClient.getUser.mockResolvedValue(unauthorisedUser);

      const response = await request.post("/api/login").send(body);

      expect(response.status).toEqual(403);
      expect(response.body).toEqual({ error: "Not authorized" });
    });

    it("should return a 500 if password validation throws an error", async () => {
      const body = { username: "Jake", password: "2342388" };

      mockBlaiseApiClient.validatePassword.mockRejectedValue(new Error("API Client Error"));

      const response = await request.post("/api/login").send(body);

      expect(response.status).toEqual(500);
      expect(response.body).toEqual({ error: "Internal server error" });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should return a 500 if user lookup throws an error", async () => {
      const body = { username: "Jake", password: "2342388" };

      mockBlaiseApiClient.validatePassword.mockResolvedValue(true);
      mockBlaiseApiClient.getUser.mockRejectedValue(new Error("API Client Error"));

      const response = await request.post("/api/login").send(body);

      expect(response.status).toEqual(500);
      expect(response.body).toEqual({ error: "Internal server error" });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should not expose the legacy split login endpoints", async () => {
      const validatePasswordResponse = await request
        .post("/api/login/users/password/validate")
        .send({ username: "Jake", password: "2342388" });
      const authorizeUserResponse = await request.get("/api/login/users/Jake/authorized");

      expect(validatePasswordResponse.status).toEqual(404);
      expect(authorizeUserResponse.status).toEqual(404);
    });
  });

  describe("removed endpoints", () => {
    it("should return 404 for the removed direct user lookup endpoint", async () => {
      const response = await request.get("/api/login/users/bob");

      expect(response.status).toEqual(404);
      expect(mockBlaiseApiClient.getUser).not.toHaveBeenCalled();
    });

    it("should return 404 for the removed token validation endpoint", async () => {
      const response = await request
        .post("/api/login/token/validate")
        .send({ token: createAuthorisationToken() })
        .set("Content-Type", "application/json");

      expect(response.status).toEqual(404);
    });
  });

  describe("middleware", () => {
    it("should return a 403 with no auth header", async () => {
      const response = await request.get("/api/login/current-user");

      expect(response.status).toEqual(403);
    });

    it("should return a 403 with an invalid jwt auth header", async () => {
      const token = jwt.sign(
        { user: { ...allowedUser, role: "TO Interviewer" } },
        config.SessionSecret,
        { issuer: config.TokenIssuer },
      );
      const response = await request.get("/api/login/current-user").set("authorization", token);

      expect(response.status).toEqual(403);
    });

    it("should return a 403 with a token from another environment", async () => {
      const token = jwt.sign({ user: allowedUser }, config.SessionSecret, {
        issuer: "ons-blaise-v2-other",
      });
      const response = await request.get("/api/login/current-user").set("authorization", token);

      expect(response.status).toEqual(403);
    });

    it("should enter the wrapped function with a valid jwt auth header", async () => {
      const bennysUser = { name: "Benny", role: "DST", serverParks: [], defaultServerPark: "" };
      const token = auth.signToken(bennysUser);
      const response = await request.get("/api/login/current-user").set("Authorization", token);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual(bennysUser);
    });

    describe("Audit Logging", () => {
      let consoleSpy: MockInstance;

      beforeEach(() => {
        consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      });

      afterEach(() => {
        consoleSpy.mockRestore();
      });

      it("should log message blanking out password", async () => {
        const body = { username: "Benny", password: "super secret" };
        const token = auth.signToken({
          name: "Benny",
          role: "DST",
          serverParks: [],
          defaultServerPark: "",
        });

        const response = await request
          .get("/api/login/current-user")
          .send(body)
          .set("Authorization", token);

        expect(response.status).toEqual(200);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'AUDIT_LOG: Benny is making the following request: GET /api/login/current-user unknown-referer with body: {"username":"Benny","password":"***"}',
          ),
        );
      });

      it("should log message with both username and role", async () => {
        const body = { username: "Benny", role: "super role" };
        const token = auth.signToken({
          name: "Benny",
          role: "DST",
          serverParks: [],
          defaultServerPark: "",
        });

        const response = await request
          .get("/api/login/current-user")
          .send(body)
          .set("Authorization", token);

        expect(response.status).toEqual(200);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'AUDIT_LOG: Benny is making the following request: GET /api/login/current-user unknown-referer with body: {"username":"Benny","role":"super role"}',
          ),
        );
      });
    });
  });

  describe("Defensive Array Handling (Branch Coverage)", () => {
    let directHandler: LoginHandler;
    let mockReq: Partial<Request>;
    let mockRes: Partial<ExpressResponse>;

    beforeEach(() => {
      directHandler = new LoginHandler(auth, mockBlaiseApiClient as unknown as BlaiseApiClient);
      mockRes = {
        status: vi.fn().mockReturnThis() as unknown as ExpressResponse["status"],
        json: vi.fn() as unknown as ExpressResponse["json"],
      };
    });

    it("getCurrentUser should return the authenticated user from response locals", async () => {
      mockReq = {};
      const mockResponse = {
        locals: { authenticatedUser: { ...allowedUser, name: "ArrayUser" } },
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as ExpressResponse<unknown, AuthenticatedResponseLocals>;

      await directHandler.getCurrentUser(mockReq as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ ...allowedUser, name: "ArrayUser" });
    });

    it("login should extract the first item if username and password are arrays", async () => {
      mockReq = { body: { username: ["Jake", "other"], password: ["2342388", "other"] } };
      mockBlaiseApiClient.validatePassword.mockResolvedValue(true);
      mockBlaiseApiClient.getUser.mockResolvedValue(allowedUser);

      await directHandler.login(mockReq as Request, mockRes as ExpressResponse);

      expect(mockBlaiseApiClient.validatePassword).toHaveBeenCalledWith("Jake", "2342388");
      expect(mockBlaiseApiClient.getUser).toHaveBeenCalledWith("Jake");
    });

    it("login should reject array values whose first item is not a string", async () => {
      mockReq = {
        body: {
          username: [123, "Jake"],
          password: [false, "2342388"],
        },
      };

      await directHandler.login(mockReq as Request, mockRes as ExpressResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Username or password has not been supplied",
      });
      expect(mockBlaiseApiClient.validatePassword).not.toHaveBeenCalled();
      expect(mockBlaiseApiClient.getUser).not.toHaveBeenCalled();
    });
  });

  describe("rate limiting", () => {
    it("should return 429 after exceeding 10 login attempts within the window", async () => {
      const rateLimitedApp = newServer();
      const rateLimitedRequest = supertest(rateLimitedApp);
      const body = { username: "Jake", password: "wrong-password" };

      mockBlaiseApiClient.validatePassword.mockResolvedValue(false);

      for (let i = 0; i < 10; i++) {
        const response = await rateLimitedRequest.post("/api/login").send(body);

        expect(response.status).toEqual(401);
      }

      const response = await rateLimitedRequest.post("/api/login").send(body);

      expect(response.status).toEqual(429);
      expect(response.body).toEqual({ error: "Too many login attempts, please try again later" });
    });
  });
});
