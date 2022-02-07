import BlaiseApiClient from "blaise-api-node-client";
import { Router, Request, Response } from "express";
import { Auth } from "../auth/auth";
export default function newLoginHandler(auth: Auth, blaiseApiClient: BlaiseApiClient): Router;
export declare class LoginHandler {
    auth: Auth;
    blaiseApiClient: BlaiseApiClient;
    constructor(auth: Auth, blaiseApiClient: BlaiseApiClient);
    GetUser(req: Request, res: Response): Promise<Response>;
    GetCurrentUser(req: Request, res: Response): Promise<Response>;
    ValidatePassword(req: Request, res: Response): Promise<Response>;
    ValidateRoles(req: Request, res: Response): Promise<Response>;
    ValidateToken(req: Request, res: Response): Promise<Response>;
}
