import BlaiseApiClient from "blaise-api-node-client";
import { Router, Request, Response } from "express";
export default function newLoginHandler(blaiseApiClient: BlaiseApiClient): Router;
export declare class LoginHandler {
    blaiseApiClient: BlaiseApiClient;
    constructor(blaiseApiClient: BlaiseApiClient);
    GetUser(req: Request, res: Response): Promise<Response>;
    ValidatePassword(req: Request, res: Response): Promise<Response>;
}
