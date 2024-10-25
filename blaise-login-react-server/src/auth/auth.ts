import jwt from "jsonwebtoken";
import { User } from "blaise-api-node-client";
import { Request, Response, NextFunction } from "express";
import { AuthConfig } from "../config/config";


export class Auth {
  config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
    this.SignToken = this.SignToken.bind(this);
    this.ValidateToken = this.ValidateToken.bind(this);
    this.UserHasRole = this.UserHasRole.bind(this);
    this.Middleware = this.Middleware.bind(this);
  }

  SignToken(user: User): string {
    return jwt.sign({
      user: user
    }, this.config.SessionSecret, { expiresIn: this.config.SessionTimeout });
  }

  ValidateToken(token: string | undefined): boolean {
    if (!token) {
      return false;
    }
    try {
      const decodedToken = jwt.verify(token, this.config.SessionSecret);
      if (typeof decodedToken === 'object' && decodedToken !== null) {
        return this.UserHasRole(decodedToken["user"]);
      }
      return false;
    } catch {
      return false;
    }
  }

  UserHasRole(user: User): boolean {
    return this.config.Roles.includes(user.role);
  }

  GetUser(token: string | undefined): User {
    if (!token) {
      throw "Must provide a token to get a user";
    }
    const decodedToken = jwt.verify(token, this.config.SessionSecret);
    return decodedToken["user"];
  }

  GetToken(request: Request): string | undefined {
    let token = request.get("authorization");
    if (!token) {
      token = request.get("Authorization");
    }
    return token;
  }

  async Middleware(request: Request, response: Response, next: NextFunction): Promise<Response | void> {

    if (!this.ValidateToken(this.GetToken(request))) {
      return response.status(403).json();
    }
    next();
  }
}
