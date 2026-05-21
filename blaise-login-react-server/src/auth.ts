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

const redactedAuditKeys = new Set([
  "apikey",
  "api-key",
  "api_key",
  "authorization",
  "cookie",
  "password",
  "secret",
  "session",
  "set-cookie",
  "token",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isUser(value: unknown): value is User {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === "string" &&
    typeof value.role === "string" &&
    typeof value.defaultServerPark === "string" &&
    isStringArray(value.serverParks)
  );
}

function redactAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactAuditValue(item));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      if (redactedAuditKeys.has(key.toLowerCase())) {
        return [key, "***"];
      }

      return [key, redactAuditValue(entryValue)];
    }),
  );
}

function extractToken(authorizationHeader: string | undefined): string | undefined {
  return authorizationHeader?.replace(/^Bearer\s+/i, "").trim() || undefined;
}

function redactAuditBody(body: unknown): string {
  if (!isRecord(body)) {
    return JSON.stringify({});
  }

  return JSON.stringify(redactAuditValue(body));
}

export class Auth {
  private readonly config: AuthConfig;

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

  private authenticatedUserFor(request: Request): User | null {
    return this.getUser(this.getToken(request));
  }

  private logAuthenticatedRequest(request: Request, authenticatedUser: User): void {
    const referer = sanitise(request.headers.referer, "unknown-referer");
    const safeUrl = sanitise(request.originalUrl, "unknown-url");
    const safeMethod = sanitise(request.method, "unknown-method");
    const safeUser = sanitise(authenticatedUser.name, "Unknown User");

    console.log(
      `AUDIT_LOG: ${safeUser} is making the following request: ${safeMethod} ${safeUrl} ${referer} with body: ${redactAuditBody(request.body)}`,
    );
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
    const authToken = extractToken(token);

    if (!authToken) {
      return null;
    }

    try {
      const decodedToken = this.verifyToken(authToken);

      if (!this.hasUserPayload(decodedToken) || !this.userHasRole(decodedToken.user)) {
        return null;
      }

      return decodedToken.user;
    } catch {
      return null;
    }
  }

  getToken(request: Request): string | undefined {
    return extractToken(request.get("authorization"));
  }

  middleware(
    request: Request,
    response: Response<Record<string, never>, AuthenticatedResponseLocals>,
    next: NextFunction,
  ): Response | void {
    const authenticatedUser = this.authenticatedUserFor(request);

    if (!authenticatedUser) {
      return response.status(403).json({});
    }

    response.locals.authenticatedUser = authenticatedUser;
    this.logAuthenticatedRequest(request, authenticatedUser);

    next();
  }
}

export type { AuthenticatedResponseLocals };
