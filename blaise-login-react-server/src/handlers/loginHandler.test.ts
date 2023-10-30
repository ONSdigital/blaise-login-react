import supertest, { Response } from "supertest";
import jwt from "jsonwebtoken";
import { Auth, AuthConfig } from "../blaise-login-react-server";
import BlaiseApiClient from "blaise-api-node-client";
import newLoginHandler from "./loginHandler";
import express, { Express, Request, Response as ExpressResponse } from "express";

const mockGetUser = jest.fn();
const mockValidatePassword = jest.fn();
jest.mock("blaise-api-node-client");
BlaiseApiClient.prototype.getUser = mockGetUser;
BlaiseApiClient.prototype.validatePassword = mockValidatePassword;

const config: AuthConfig = {
  SessionSecret: "fake-secret",
  SessionTimeout: "10m",
  Roles: ["DST", "BDSS", "TO Manager"],
  BlaiseApiUrl: "localhost:80"
};

const auth = new Auth(config);
const blaiseApiClient = new BlaiseApiClient(config.BlaiseApiUrl);

function newServer(): Express {
  const server = express();
  const loginHandler = newLoginHandler(auth, blaiseApiClient);
  server.use(loginHandler);

  server.get("/authtest", auth.Middleware, async function (_request: Request, response: ExpressResponse) {
    response.status(200).json("Hello, world!");
  });

  return server;
}

const app = newServer();
const request = supertest(app);


describe("LoginHandler", () => {
  beforeEach(() => {
    mockGetUser.mockClear();
    mockValidatePassword.mockClear();
  });

  describe("Get user", () => {
    it("should return a 200 and the user details", async () => {
      mockGetUser.mockImplementation(async () => {
        return Promise.resolve({ "role": "test" });
      });

      const response: Response = await request.get("/api/login/users/bob");

      expect(response.status).toEqual(200);
      expect(mockGetUser).toHaveBeenCalled();
      expect(response.body).toEqual({ "role": "test" });
    });
  });

  describe("Get current user", () => {
    it("should return a 200 and the user details", async () => {
      const token = auth.SignToken({
        name: "test",
        role: "DST",
        defaultServerPark: "gusty",
        serverParks: ["gusty"]
      });
      const response: Response = await request.get("/api/login/current-user").set("authorization", token);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        name: "test",
        role: "DST",
        defaultServerPark: "gusty",
        serverParks: ["gusty"]
      });
    });
  });


  describe("Validate Password", () => {
    it("should return a 200 and true", async () => {
      // arrange
      const body = {username: "Jake", password: "2342388" };

      mockValidatePassword.mockImplementation(async () => {
        return Promise.resolve(true);
      });

      // act
      const response: Response = await request.post("/api/login/users/password/validate").send(body);

      // assert
      expect(response.status).toEqual(200);
      expect(response.body).toBeTruthy();
    });

    it.each(["", undefined])("should return a 400 and true if username is empty or undefined", async (value) => {
      // arrange
      const body = {username: value, password: "2342388" };

      mockValidatePassword.mockImplementation(async () => {
        return Promise.resolve(true);
      });

      // act
      const response: Response = await request.post("/api/login/users/password/validate").send(body);

      // assert
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({"error": "Username or password has not been supplied"});
    });   
    
    it("should return a 400 and true if username is not supplied", async () => {
      // arrange
      const body = {password: "2342388" };

      mockValidatePassword.mockImplementation(async () => {
        return Promise.resolve(true);
      });

      // act
      const response: Response = await request.post("/api/login/users/password/validate").send(body);

      // assert
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({"error": "Username or password has not been supplied"});
    });    

    it.each(["", undefined])("should return a 400 and true if password is empty or undefined", async (value) => {
      // arrange
      const body = {username: "Jake", password: value };

      mockValidatePassword.mockImplementation(async () => {
        return Promise.resolve(true);
      });

      // act
      const response: Response = await request.post("/api/login/users/password/validate").send(body);

      // assert
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({"error": "Username or password has not been supplied"});
    });     

    it("should return a 400 and true if password is not supplied", async () => {
      // arrange
      const body = {username: "Jake"};

      mockValidatePassword.mockImplementation(async () => {
        return Promise.resolve(true);
      });

      // act
      const response: Response = await request.post("/api/login/users/password/validate").send(body);

      // assert
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({"error": "Username or password has not been supplied"});
    });       
  });

  describe("Validate Roles", () => {
    describe("with an invalid role", () => {
      it("should return a 403", async () => {
        mockGetUser.mockImplementation(async () => {
          return Promise.resolve({ "role": "test" });
        });

        const response: Response = await request.get("/api/login/users/bob/authorised");

        expect(response.status).toEqual(403);
        expect(mockGetUser).toHaveBeenCalled();
        expect(response.body).toEqual({ "error": "Not authorised" });
      });
    });

    describe("with an valid role", () => {
      it("should return a 200 and the user details as an encoded jwt", async () => {
        mockGetUser.mockImplementation(async () => {
          return Promise.resolve({ "role": "DST" });
        });

        const response: Response = await request.get("/api/login/users/bob/authorised");

        expect(response.status).toEqual(200);
        expect(mockGetUser).toHaveBeenCalled();
        const myJwt = response.body.token;
        const decodedJwt = jwt.decode(myJwt);
        if (decodedJwt) {
          expect(decodedJwt["user"]).toEqual({ "role": "DST" });
        } else {
          expect(decodedJwt).not.toBeNull();
        }
      });
    });
  });

  describe("ValidateToken", () => {
    describe("with an no token", () => {
      it("should return a 403", async () => {
        const response: Response = await request.post("/api/login/token/validate")
          .send({})
          .set("Content-Type", "application/json");

        expect(response.status).toEqual(403);
      });
    });

    describe("with an invalid token", () => {
      it("should return a 403", async () => {
        const response: Response = await request.post("/api/login/token/validate")
          .send({ token: "not a token and that" })
          .set("Content-Type", "application/json");

        expect(response.status).toEqual(403);
      });
    });

    describe("with a valid token but no role", () => {
      it("should return a 403", async () => {
        const token = jwt.sign("random token", config.SessionSecret);
        const response: Response = await request.post("/api/login/token/validate")
          .send({ token: token })
          .set("Content-Type", "application/json");

        expect(response.status).toEqual(403);
      });
    });

    describe("with a valid token but invalid role", () => {
      it("should return a 403", async () => {
        const token = jwt.sign({ user: { role: "TO Interviewer" } }, config.SessionSecret);
        const response: Response = await request.post("/api/login/token/validate")
          .send({ token: token })
          .set("Content-Type", "application/json");

        expect(response.status).toEqual(403);
      });
    });

    describe("with a valid token and role", () => {
      it("should return a 200", async () => {
        const token = jwt.sign({ user: { role: "DST" } }, config.SessionSecret);
        const response: Response = await request.post("/api/login/token/validate")
          .send({ token: token })
          .set("Content-Type", "application/json");

        expect(response.status).toEqual(200);
      });
    });
  });

  describe("Middleware", () => {
    describe("with no auth header", () => {
      it("should return a 403", async () => {
        const response: Response = await request.get("/authtest");

        expect(response.status).toEqual(403);
      });
    });

    describe("with an invalid jwt auth header", () => {
      it("should return a 403", async () => {
        const token = jwt.sign({ user: { role: "TO Interviewer" } }, config.SessionSecret);
        const response: Response = await request.get("/authtest")
          .set("authorization", token);

        expect(response.status).toEqual(403);
      });
    });

    describe("with an valid jwt auth header", () => {
      it("should enter the wrapped function", async () => {
        const token = jwt.sign({ user: { role: "DST" } }, config.SessionSecret);
        const response: Response = await request.get("/authtest")
          .set("Authorization", token);

        expect(response.status).toEqual(200);
        expect(response.body).toEqual("Hello, world!");
      });
    });
  });
});
