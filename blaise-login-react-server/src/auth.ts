import jwt, { type JwtPayload } from "jsonwebtoken";

import { sanitise } from "./sanitise.js";

import type { AuthConfig } from "./auth.types.js";
import type { User } from "blaise-api-node-client";
import type { NextFunction, Request, Response } from "express";

interface AuthenticatedResponseLocals {
  authenticatedUser?: User;
}

interface AuthTokenPayload extends JwtPayload {
  user: User;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isUser(value: unknown): value is User {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.name === "string" &&
    typeof candidate.role === "string" &&
    typeof candidate.defaultServerPark === "string" &&
    isStringArray(candidate.serverParks)
  );
}

function redactAuditBody(body: unknown): string {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return JSON.stringify({});
  }

  const auditBody = { ...body } as Record<string, unknown>;

  for (const key of ["password", "token", "authorization"]) {
    if (key in auditBody) {
      auditBody[key] = "***";
    }
  }

  return JSON.stringify(auditBody);
}

export class Auth {
  readonly config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
    this.middleware = this.middleware.bind(this);
  }

  private verifyToken(token: string): string | JwtPayload {
    return jwt.verify(token, this.config.SessionSecret, {
      issuer: this.config.TokenIssuer,
    });
  }

  private hasUserPayload(decodedToken: string | JwtPayload): decodedToken is AuthTokenPayload {
    return typeof decodedToken === "object" && decodedToken !== null && isUser(decodedToken.user);
  }

  signToken(user: User): string {
    return jwt.sign({ user: user }, this.config.SessionSecret, {
      expiresIn: this.config.SessionTimeout,
      issuer: this.config.TokenIssuer,
    });
  }

  validateToken(token: string | undefined): boolean {
    return this.getUser(token) !== null;
  }

  userHasRole(user: Pick<User, "role"> | null | undefined): boolean {
    return typeof user?.role === "string" && this.config.Roles.includes(user.role);
  }

  getUser(token: string | undefined): User | null {
    if (!token) {
      return null;
    }

    try {
      const decodedToken = this.verifyToken(token);

      if (!this.hasUserPayload(decodedToken) || !this.userHasRole(decodedToken.user)) {
        return null;
      }

      return decodedToken.user;
    } catch {
      return null;
    }
  }

  getToken(request: Request): string | undefined {
    return request.get("authorization");
  }

  // Changed: keep authenticated identity in response locals so middleware does not rewrite untrusted request bodies.
  async middleware(
    request: Request,
    response: Response<Record<string, never>, AuthenticatedResponseLocals>,
    next: NextFunction,
  ): Promise<Response | void> {
    const authenticatedUser = this.getUser(this.getToken(request));

    if (!authenticatedUser) {
      return response.status(403).json({});
    }

    response.locals.authenticatedUser = authenticatedUser;

    const referer = sanitise(request.headers.referer, "unknown-referer");
    const safeUrl = sanitise(request.originalUrl, "unknown-url");
    const safeMethod = sanitise(request.method, "unknown-method");
    const safeUser = sanitise(authenticatedUser.name, "Unknown User");

    console.log(
      `AUDIT_LOG: ${safeUser} is making the following request: ${safeMethod} ${safeUrl} ${referer} with body: ${redactAuditBody(request.body)}`,
    );

    next();
  }
}

export type { AuthenticatedResponseLocals };
