import { User } from "blaise-api-node-client";
import { Request, Response, NextFunction } from "express";
import { AuthConfig } from "../config/config";
export declare class Auth {
    config: AuthConfig;
    constructor(config: AuthConfig);
    SignToken(user: User): string;
    ValidateToken(token: string | undefined): boolean;
    UserHasRole(user: User): boolean;
    GetUser(token: string | undefined): User;
    GetToken(request: Request): string | undefined;
    Middleware(request: Request, response: Response, next: NextFunction): Promise<Response | void>;
}
