import jwt, { type SignOptions } from "jsonwebtoken";
import type { User } from "blaise-api-node-client";
import type { Request, Response, NextFunction } from "express";
import type { AuthConfig } from "./config";

export class Auth {
  readonly config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  SignToken = (user: User): string => {
    return jwt.sign({ user: user }, this.config.SessionSecret, {
      expiresIn: this.config.SessionTimeout as SignOptions["expiresIn"],
    });
  };

  ValidateToken = (token: string | undefined): boolean => {
    if (!token) {
      return false;
    }

    try {
      const decodedToken = jwt.verify(token, this.config.SessionSecret);

      if (typeof decodedToken === "object" && decodedToken !== null && "user" in decodedToken) {
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
      const decodedToken = jwt.verify(token, this.config.SessionSecret) as { user: User };

      return decodedToken?.user || fallbackUser;
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

    const sanitizedBody = JSON.stringify(body);

    const referer = request.headers.referer || "unknown-referer";

    console.log(
      `AUDIT_LOG: ${currentlyloggedinuser} is making the following request: ${request.method} ${request.originalUrl} ${referer} with body: ${sanitizedBody}`,
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
