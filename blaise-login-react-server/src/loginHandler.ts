import { BlaiseApiClient } from "blaise-api-node-client";
import express, { Router, Request, Response } from "express";
import { Auth } from "./auth";

export default function newLoginHandler(auth: Auth, blaiseApiClient: BlaiseApiClient): Router {
  const router = express.Router();

  router.use(express.json());

  const loginHandler = new LoginHandler(auth, blaiseApiClient);

  router.get("/api/login/users/:username", loginHandler.GetUser);
  router.get("/api/login/current-user", loginHandler.GetCurrentUser);
  router.get("/api/login/users/:username/authorised", loginHandler.ValidateRoles);
  router.post("/api/login/token/validate", loginHandler.ValidateToken);
  router.post("/api/login/users/password/validate", loginHandler.ValidatePassword);

  return router;
}

export class LoginHandler {
  readonly auth: Auth;
  readonly blaiseApiClient: BlaiseApiClient;

  constructor(auth: Auth, blaiseApiClient: BlaiseApiClient) {
    this.auth = auth;
    this.blaiseApiClient = blaiseApiClient;
  }

  GetUser = async (req: Request, res: Response): Promise<Response> => {
    try {
      const username = Array.isArray(req.params.username)
        ? req.params.username[0]
        : req.params.username;

      console.log(`Getting user: ${username}`);
      const user = await this.blaiseApiClient.getUser(username);

      return res.status(200).json(user);
    } catch (error) {
      console.error(`Error fetching user ${req.params.username}:`, error);

      return res.status(500).json({ error: "Internal server error" });
    }
  };

  GetCurrentUser = async (req: Request, res: Response): Promise<Response> => {
    try {
      const rawToken = this.auth.GetToken(req);
      const token = Array.isArray(rawToken) ? rawToken[0] : (rawToken as string);

      const user = this.auth.GetUser(token);

      console.log("User from jwt token:", user);

      return res.status(200).json(user);
    } catch (error) {
      console.error("Error getting current user:", error);

      return res.status(500).json({ error: "Internal server error" });
    }
  };

  ValidatePassword = async (req: Request, res: Response): Promise<Response> => {
    try {
      console.log("Validating password");

      const username = req.body?.username as string | undefined;
      const password = req.body?.password as string | undefined;

      if (!username || !password) {
        return res.status(400).json({ error: "Username or password has not been supplied" });
      }

      const safeUsername = Array.isArray(username) ? username[0] : username;
      const safePassword = Array.isArray(password) ? password[0] : password;

      const isValid = await this.blaiseApiClient.validatePassword(safeUsername, safePassword);

      return res.status(200).json(isValid);
    } catch (error) {
      console.error("Error validating password:", error);

      return res.status(500).json({ error: "Internal server error" });
    }
  };

  ValidateRoles = async (req: Request, res: Response): Promise<Response> => {
    try {
      const username = Array.isArray(req.params.username)
        ? req.params.username[0]
        : req.params.username;

      console.log(`Validating user roles for: ${username}`);

      const user = await this.blaiseApiClient.getUser(username);

      if (this.auth.UserHasRole(user)) {
        return res.status(200).json({ token: this.auth.SignToken(user) });
      }

      return res.status(403).json({ error: "Not authorised" });
    } catch (error) {
      console.error(`Error validating roles for user ${req.params.username}:`, error);

      return res.status(500).json({ error: "Internal server error" });
    }
  };

  ValidateToken = async (req: Request, res: Response): Promise<Response> => {
    try {
      const rawToken = req.body?.token;
      const token = Array.isArray(rawToken) ? rawToken[0] : (rawToken as string);

      if (!token) {
        return res.sendStatus(403);
      }

      if (this.auth.ValidateToken(token)) {
        return res.sendStatus(200);
      }

      return res.sendStatus(403);
    } catch (error) {
      console.error("Error validating token:", error);

      return res.sendStatus(500);
    }
  };
}
