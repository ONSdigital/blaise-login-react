import { type BlaiseApiClient } from "blaise-api-node-client";
import express, { type Request, type Response, type Router } from "express";

import { type Auth, type AuthenticatedResponseLocals } from "./auth.js";
import { sanitise } from "./sanitise.js";

function getStringValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }

  return typeof value === "string" ? value : undefined;
}

export function newLoginHandler(auth: Auth, blaiseApiClient: BlaiseApiClient): Router {
  const router = express.Router();

  // Changed: apply a small JSON body limit at the router boundary to reduce avoidable request-body abuse.
  router.use(express.json({ limit: "10kb" }));

  const loginHandler = new LoginHandler(auth, blaiseApiClient);

  // Changed: protect user lookup routes at registration time so handlers stay focused on their own responsibility.
  router.get("/api/login/users/:username", auth.middleware, loginHandler.getUser);
  router.get("/api/login/current-user", auth.middleware, loginHandler.getCurrentUser);
  router.post("/api/login", loginHandler.login);
  router.post("/api/login/token/validate", loginHandler.validateToken);

  return router;
}

export class LoginHandler {
  readonly auth: Auth;
  readonly blaiseApiClient: BlaiseApiClient;

  constructor(auth: Auth, blaiseApiClient: BlaiseApiClient) {
    this.auth = auth;
    this.blaiseApiClient = blaiseApiClient;
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.getUser = this.getUser.bind(this);
    this.login = this.login.bind(this);
    this.validateToken = this.validateToken.bind(this);
  }

  async getUser(req: Request, res: Response): Promise<Response> {
    try {
      const username = getStringValue(req.params.username);

      if (!username) {
        return res.status(400).json({ error: "Username not provided" });
      }

      const user = await this.blaiseApiClient.getUser(username);

      return res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", sanitise(req.params.username), error);

      return res.status(500).json({ error: "Internal server error" });
    }
  }

  getCurrentUser(
    _req: Request,
    res: Response<unknown, AuthenticatedResponseLocals>,
  ): Promise<Response> {
    const authenticatedUser = res.locals.authenticatedUser;

    if (!authenticatedUser) {
      console.error("Authenticated route executed without an authenticated user");

      return Promise.resolve(res.status(500).json({ error: "Internal server error" }));
    }

    return Promise.resolve(res.status(200).json(authenticatedUser));
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const username = getStringValue(req.body?.username);
      const password = getStringValue(req.body?.password);

      if (!username || !password) {
        return res.status(400).json({ error: "Username or password has not been supplied" });
      }

      const isValid = await this.blaiseApiClient.validatePassword(username, password);

      if (!isValid) {
        console.warn("Failed login attempt for user:", sanitise(username));

        return res.status(401).json({ error: "Incorrect username or password" });
      }

      const user = await this.blaiseApiClient.getUser(username);

      if (!this.auth.userHasRole(user)) {
        return res.status(403).json({ error: "Not authorized" });
      }

      return res.status(200).json({ token: this.auth.signToken(user) });
    } catch (error) {
      console.error("Error authenticating user:", error);

      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async validateToken(req: Request, res: Response): Promise<Response> {
    try {
      const token = getStringValue(req.body?.token);

      if (!token) {
        return res.sendStatus(403);
      }

      if (this.auth.validateToken(token)) {
        return res.sendStatus(200);
      }

      return res.sendStatus(403);
    } catch (error) {
      console.error("Error validating token:", error);

      return res.sendStatus(500);
    }
  }
}
