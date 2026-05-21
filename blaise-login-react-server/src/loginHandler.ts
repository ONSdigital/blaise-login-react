import { type BlaiseApiClient } from "blaise-api-node-client";
import express, { type Request, type Response, type Router } from "express";
import rateLimit from "express-rate-limit";

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

  router.use(express.json({ limit: "10kb" }));

  const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later" },
  });

  const currentUserRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
  });

  const loginHandler = new LoginHandler(auth, blaiseApiClient);

  router.get(
    "/api/login/current-user",
    currentUserRateLimiter,
    auth.middleware,
    loginHandler.getCurrentUser,
  );
  router.post("/api/login", loginRateLimiter, loginHandler.login);

  return router;
}

export class LoginHandler {
  readonly auth: Auth;
  readonly blaiseApiClient: BlaiseApiClient;

  constructor(auth: Auth, blaiseApiClient: BlaiseApiClient) {
    this.auth = auth;
    this.blaiseApiClient = blaiseApiClient;
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.login = this.login.bind(this);
  }

  getCurrentUser(_req: Request, res: Response<unknown, AuthenticatedResponseLocals>): Response {
    const authenticatedUser = res.locals.authenticatedUser;

    if (!authenticatedUser) {
      console.error("Authenticated route executed without an authenticated user");

      return res.status(500).json({ error: "Internal server error" });
    }

    return res.status(200).json(authenticatedUser);
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
}
