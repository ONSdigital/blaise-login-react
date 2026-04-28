import { getStringValue } from "./loginHandler";

describe("getStringValue", () => {
  it("returns the first string if value is a string array", () => {
    expect(getStringValue(["foo", "bar"])).toBe("foo");
  });

  it("returns undefined if value is an array but first element is not a string", () => {
    expect(getStringValue([123, "bar"])).toBeUndefined();
  });

  it("returns the string if value is a string", () => {
    expect(getStringValue("baz")).toBe("baz");
  });

  it("returns undefined for non-string, non-array values", () => {
    expect(getStringValue(123)).toBeUndefined();
    expect(getStringValue({})).toBeUndefined();
    expect(getStringValue(undefined)).toBeUndefined();
    expect(getStringValue(null)).toBeUndefined();
  });
});
import supertest from "supertest";
import jwt from "jsonwebtoken";
import { Auth } from "./auth";
import type { AuthConfig } from "./config";
import type { BlaiseApiClient, User } from "blaise-api-node-client";
import newLoginHandler, { LoginHandler } from "./loginHandler";
import express, { type Express, type Request, type Response as ExpressResponse } from "express";
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";

const config: AuthConfig = {
  SessionSecret: "fake-secret",
  SessionTimeout: "10m",
  Roles: ["DST", "BDSS", "TO Manager"],
  BlaiseApiUrl: "localhost:80",
};

const auth = new Auth(config);

const mockBlaiseApiClient = {
  getUser: vi.fn(),
  validatePassword: vi.fn(),
};

function newServer(): Express {
  const server = express();

  const loginHandler = newLoginHandler(auth, mockBlaiseApiClient as unknown as BlaiseApiClient);

  server.use(loginHandler);
  server.get(
    "/authtest",
    auth.Middleware,
    async function (_request: Request, response: ExpressResponse) {
      response.status(200).json("Hello, world!");
    },
  );

  return server;
}

const app = newServer();
const request = supertest(app);

describe("LoginHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Get user", () => {
    it("should return a 200 and the user details", async () => {
      mockBlaiseApiClient.getUser.mockResolvedValue({ role: "test" } as unknown as User);

      const response = await request.get("/api/login/users/bob");

      expect(response.status).toEqual(200);
      expect(mockBlaiseApiClient.getUser).toHaveBeenCalledWith("bob");
      expect(response.body).toEqual({ role: "test" });
    });

    it("should return a 500 if the api client throws an error", async () => {
      mockBlaiseApiClient.getUser.mockRejectedValue(new Error("API Client Error"));

      const response = await request.get("/api/login/users/bob");

      expect(response.status).toEqual(500);
      expect(response.body).toEqual({ error: "Internal server error" });
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Get current user", () => {
    it("should return a 200 and the user details", async () => {
      const token = auth.SignToken({
        name: "test",
        role: "DST",
        defaultServerPark: "gusty",
        serverParks: ["gusty"],
      } as unknown as User);

      const response = await request.get("/api/login/current-user").set("authorization", token);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        name: "test",
        role: "DST",
        defaultServerPark: "gusty",
        serverParks: ["gusty"],
      });
    });

    it("should return a 500 if an error occurs parsing the token", async () => {
      vi.spyOn(auth, "GetToken").mockImplementation(() => {
        throw new Error("Token extraction failed");
      });

      const response = await request.get("/api/login/current-user");

      expect(response.status).toEqual(500);
      expect(response.body).toEqual({ error: "Internal server error" });
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Login", () => {
    it("should return a token when the credentials are valid and the user has a permitted role", async () => {
      const body = { username: "Jake", password: "2342388" };
      const user = {
        name: "Jake",
        role: "DST",
        defaultServerPark: "gusty",
        serverParks: ["gusty"],
      } as unknown as User;

      mockBlaiseApiClient.validatePassword.mockResolvedValue(true);
      mockBlaiseApiClient.getUser.mockResolvedValue(user);

      const response = await request.post("/api/login").send(body);

      expect(response.status).toEqual(200);
      expect(mockBlaiseApiClient.validatePassword).toHaveBeenCalledWith("Jake", "2342388");
      expect(mockBlaiseApiClient.getUser).toHaveBeenCalledWith("Jake");

      const decodedJwt = jwt.verify(response.body.token, config.SessionSecret) as { user: User };

      expect(decodedJwt.user).toEqual(user);
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
      const user = {
        name: "Jake",
        role: "Interviewer",
        defaultServerPark: "gusty",
        serverParks: ["gusty"],
      } as unknown as User;

      mockBlaiseApiClient.validatePassword.mockResolvedValue(true);
      mockBlaiseApiClient.getUser.mockResolvedValue(user);

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
      expect(console.error).toHaveBeenCalled();
    });

    it("should return a 500 if user lookup throws an error", async () => {
      const body = { username: "Jake", password: "2342388" };

      mockBlaiseApiClient.validatePassword.mockResolvedValue(true);
      mockBlaiseApiClient.getUser.mockRejectedValue(new Error("API Client Error"));

      const response = await request.post("/api/login").send(body);

      expect(response.status).toEqual(500);
      expect(response.body).toEqual({ error: "Internal server error" });
      expect(console.error).toHaveBeenCalled();
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

  describe("ValidateToken", () => {
    describe("with no token", () => {
      it("should return a 403", async () => {
        const response = await request
          .post("/api/login/token/validate")
          .send({})
          .set("Content-Type", "application/json");

        expect(response.status).toEqual(403);
      });
    });

    describe("with an invalid token", () => {
      it("should return a 403", async () => {
        const response = await request
          .post("/api/login/token/validate")
          .send({ token: "not a token and that" })
          .set("Content-Type", "application/json");

        expect(response.status).toEqual(403);
      });
    });

    describe("with a valid token but no role", () => {
      it("should return a 403", async () => {
        const token = jwt.sign("random token", config.SessionSecret);
        const response = await request
          .post("/api/login/token/validate")
          .send({ token })
          .set("Content-Type", "application/json");

        expect(response.status).toEqual(403);
      });
    });

    describe("with a valid token but invalid role", () => {
      it("should return a 403", async () => {
        const token = jwt.sign({ user: { role: "TO Interviewer" } }, config.SessionSecret);
        const response = await request
          .post("/api/login/token/validate")
          .send({ token })
          .set("Content-Type", "application/json");

        expect(response.status).toEqual(403);
      });
    });

    describe("with a valid token and role", () => {
      it("should return a 200", async () => {
        const token = jwt.sign({ user: { role: "DST" } }, config.SessionSecret);
        const response = await request
          .post("/api/login/token/validate")
          .send({ token })
          .set("Content-Type", "application/json");

        expect(response.status).toEqual(200);
      });
    });

    describe("when an unexpected error occurs", () => {
      it("should return a 500", async () => {
        vi.spyOn(auth, "ValidateToken").mockImplementation(() => {
          throw new Error("Unexpected auth failure");
        });
        const token = jwt.sign({ user: { role: "DST" } }, config.SessionSecret);
        const response = await request
          .post("/api/login/token/validate")
          .send({ token })
          .set("Content-Type", "application/json");

        expect(response.status).toEqual(500);
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe("Middleware", () => {
    describe("with no auth header", () => {
      it("should return a 403", async () => {
        const response = await request.get("/authtest");

        expect(response.status).toEqual(403);
      });
    });

    describe("with an invalid jwt auth header", () => {
      it("should return a 403", async () => {
        const token = jwt.sign({ user: { role: "TO Interviewer" } }, config.SessionSecret);
        const response = await request.get("/authtest").set("authorization", token);

        expect(response.status).toEqual(403);
      });
    });

    describe("with a valid jwt auth header", () => {
      it("should enter the wrapped function", async () => {
        const token = jwt.sign({ user: { name: "Benny", role: "DST" } }, config.SessionSecret);
        const response = await request.get("/authtest").set("Authorization", token);

        expect(response.status).toEqual(200);
        expect(response.body).toEqual("Hello, world!");
      });
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

        const token = jwt.sign({ user: { name: "Benny", role: "DST" } }, config.SessionSecret);

        const response = await request.get("/authtest").send(body).set("Authorization", token);

        expect(response.status).toEqual(200);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'AUDIT_LOG: Benny is making the following request: GET /authtest unknown-referer with body: {"username":"Benny","password":"***"}',
          ),
        );
      });

      it("should log message with both username and role", async () => {
        const body = { username: "Benny", role: "super role" };

        const token = jwt.sign({ user: { name: "Benny", role: "DST" } }, config.SessionSecret);

        const response = await request.get("/authtest").send(body).set("Authorization", token);

        expect(response.status).toEqual(200);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'AUDIT_LOG: Benny is making the following request: GET /authtest unknown-referer with body: {"username":"Benny","role":"super role"}',
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
        sendStatus: vi.fn() as unknown as ExpressResponse["sendStatus"],
      };
    });

    it("GetUser should extract the first item if username is an array", async () => {
      mockReq = { params: { username: ["array-user", "other"] } } as unknown as Request;
      mockBlaiseApiClient.getUser.mockResolvedValue({ role: "test" } as unknown as User);

      await directHandler.GetUser(mockReq as Request, mockRes as ExpressResponse);

      expect(mockBlaiseApiClient.getUser).toHaveBeenCalledWith("array-user");
    });

    it("GetCurrentUser should extract the first item if token is an array", async () => {
      mockReq = {};
      vi.spyOn(auth, "GetToken").mockReturnValue(["array-token"] as unknown as string);
      vi.spyOn(auth, "GetUser").mockReturnValue({ name: "ArrayUser" } as unknown as User);

      await directHandler.GetCurrentUser(mockReq as Request, mockRes as ExpressResponse);

      expect(auth.GetUser).toHaveBeenCalledWith("array-token");
      expect(mockRes.json).toHaveBeenCalledWith({ name: "ArrayUser" });
    });

    it("Login should extract the first item if username and password are arrays", async () => {
      mockReq = { body: { username: ["Jake", "other"], password: ["2342388", "other"] } };
      mockBlaiseApiClient.validatePassword.mockResolvedValue(true);
      mockBlaiseApiClient.getUser.mockResolvedValue({ role: "DST" } as unknown as User);

      await directHandler.Login(mockReq as Request, mockRes as ExpressResponse);

      expect(mockBlaiseApiClient.validatePassword).toHaveBeenCalledWith("Jake", "2342388");
      expect(mockBlaiseApiClient.getUser).toHaveBeenCalledWith("Jake");
    });

    it("ValidateToken should extract the first item if token is an array", async () => {
      mockReq = { body: { token: ["array-token"] } };
      vi.spyOn(auth, "ValidateToken").mockReturnValue(true);

      await directHandler.ValidateToken(mockReq as Request, mockRes as ExpressResponse);

      expect(auth.ValidateToken).toHaveBeenCalledWith("array-token");
      expect(mockRes.sendStatus).toHaveBeenCalledWith(200);
    });
  });
});
