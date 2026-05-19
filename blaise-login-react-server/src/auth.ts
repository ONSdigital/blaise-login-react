import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

import { sanitise } from "./sanitise.js";

import type { AuthConfig } from "./auth.types.js";
import type { User } from "blaise-api-node-client";
import type { NextFunction, Request, Response } from "express";

interface AuthTokenPayload extends JwtPayload {
  user?: User;
}

export class Auth {
  readonly config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  private VerifyToken = (token: string): string | JwtPayload => {
    return jwt.verify(token, this.config.SessionSecret, {
      issuer: this.config.TokenIssuer,
    });
  };

  private HasUserPayload = (
    decodedToken: string | JwtPayload,
  ): decodedToken is AuthTokenPayload & { user: User } => {
    return typeof decodedToken === "object" && decodedToken !== null && "user" in decodedToken;
  };

  SignToken = (user: User): string => {
    return jwt.sign({ user: user }, this.config.SessionSecret, {
      expiresIn: this.config.SessionTimeout as SignOptions["expiresIn"],
      issuer: this.config.TokenIssuer,
    });
  };

  ValidateToken = (token: string | undefined): boolean => {
    if (!token) {
      return false;
    }

    try {
      const decodedToken = this.VerifyToken(token);

      if (this.HasUserPayload(decodedToken)) {
        return this.UserHasRole(decodedToken.user as User);
      }

      return false;
    } catch {
      return false;
    }
  };

  UserHasRole = (user: User): boolean => {
    if (!user || !user.role) {
      return false;
    }

    return this.config.Roles.includes(user.role as string);
  };

  GetUser = (token: string | undefined): User => {
    const fallbackUser: User = { name: "", role: "", serverParks: [], defaultServerPark: "" };

    if (!token) {
      console.error("Must provide a token to get a user");

      return fallbackUser;
    }

    try {
      const decodedToken = this.VerifyToken(token);

      if (!this.HasUserPayload(decodedToken)) {
        return fallbackUser;
      }

      return decodedToken.user || fallbackUser;
    } catch {
      console.error("Must provide a valid token to get a user");

      return fallbackUser;
    }
  };

  GetToken = (request: Request): string | undefined => {
    return request.get("authorization");
  };

  Middleware = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    const token = this.GetToken(request);

    if (!this.ValidateToken(token)) {
      return response.status(403).json();
    }

    const currentlyloggedinuser = this.GetUser(token)?.name || "Unknown User";

    const body = { ...request.body };

    if (body.password) {
      body.password = "***";
    }

    const sanitisedBody = JSON.stringify(body);

    const referer = sanitise(request.headers.referer, "unknown-referer");
    const safeUrl = sanitise(request.originalUrl, "unknown-url");
    const safeMethod = sanitise(request.method, "unknown-method");
    const safeUser = sanitise(currentlyloggedinuser, "Unknown User");

    console.log(
      `AUDIT_LOG: ${safeUser} is making the following request: ${safeMethod} ${safeUrl} ${referer} with body: ${sanitisedBody}`,
    );

    if (currentlyloggedinuser !== "Unknown User") {
      response.setHeader("currentlyloggedinuser", currentlyloggedinuser);

      if (typeof request.body === "object" && request.body !== null) {
        request.body.currentlyloggedinuser = currentlyloggedinuser;
      }
    }

    next();
  };
}
