import { BlaiseApiClient } from "blaise-api-node-client";
import express, { Router, Request, Response } from "express";
import { Auth } from "./auth";

function getStringValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }

  return typeof value === "string" ? value : undefined;
}

export default function newLoginHandler(auth: Auth, blaiseApiClient: BlaiseApiClient): Router {
  const router = express.Router();

  router.use(express.json());

  const loginHandler = new LoginHandler(auth, blaiseApiClient);

  router.get("/api/login/users/:username", loginHandler.GetUser);
  router.get("/api/login/current-user", loginHandler.GetCurrentUser);
  router.post("/api/login", loginHandler.Login);
  router.post("/api/login/token/validate", loginHandler.ValidateToken);

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
      const username = getStringValue(req.params.username);

      if (!username) {
        return res.status(400).json({ error: "Username not provided" });
      }

      console.log("Getting user:", username);
      const user = await this.blaiseApiClient.getUser(username);

      return res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", req.params.username, error);

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

  Login = async (req: Request, res: Response): Promise<Response> => {
    try {
      console.log("Authenticating user");

      const username = getStringValue(req.body?.username);
      const password = getStringValue(req.body?.password);

      if (!username || !password) {
        return res.status(400).json({ error: "Username or password has not been supplied" });
      }

      const isValid = await this.blaiseApiClient.validatePassword(username, password);

      if (!isValid) {
        return res.status(401).json({ error: "Incorrect username or password" });
      }

      const user = await this.blaiseApiClient.getUser(username);

      if (!this.auth.UserHasRole(user)) {
        return res.status(403).json({ error: "Not authorized" });
      }

      return res.status(200).json({ token: this.auth.SignToken(user) });
    } catch (error) {
      console.error("Error authenticating user:", error);

      return res.status(500).json({ error: "Internal server error" });
    }
  };

  ValidateToken = async (req: Request, res: Response): Promise<Response> => {
    try {
      const token = getStringValue(req.body?.token);

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
