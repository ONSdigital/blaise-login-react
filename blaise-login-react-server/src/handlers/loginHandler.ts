import BlaiseApiClient from "blaise-api-node-client";
import express, { Router, Request, Response } from "express";
import { Auth } from "../auth/auth";


export default function newLoginHandler(auth: Auth, blaiseApiClient: BlaiseApiClient): Router {
  const router = express.Router();

  router.use(express.json());

  const loginHandler = new LoginHandler(auth, blaiseApiClient);
  router.get("/api/login/users/:username", loginHandler.GetUser);
  router.get("/api/login/current-user", loginHandler.GetCurrentUser);
  router.get("/api/login/users/:username/authorised", loginHandler.ValidateRoles);
  router.post("/api/login/token/validate", loginHandler.ValidateToken);
  router.post("/api/login/users/password/validate", loginHandler.ValidatePassword);
  return router;
}

export class LoginHandler {
  auth: Auth;
  blaiseApiClient: BlaiseApiClient;

  constructor(auth: Auth, blaiseApiClient: BlaiseApiClient) {
    this.auth = auth;
    this.blaiseApiClient = blaiseApiClient;

    this.GetUser = this.GetUser.bind(this);
    this.GetCurrentUser = this.GetCurrentUser.bind(this);
    this.ValidatePassword = this.ValidatePassword.bind(this);
    this.ValidateRoles = this.ValidateRoles.bind(this);
    this.ValidateToken = this.ValidateToken.bind(this);
  }

  async GetUser(req: Request, res: Response): Promise<Response> {
    console.log("Getting user");
    return res.status(200).json(await this.blaiseApiClient.getUser(req.params.username));
  }

  async GetCurrentUser(req: Request, res: Response): Promise<Response> {
    return res.status(200).json(this.auth.GetUser(this.auth.GetToken(req)));
  }

  async ValidatePassword(req: Request, res: Response): Promise<Response> {
    console.log("Validating password");
    const { username, password } = req.body;

    console.log(`username ${username} password ${password}`);

    if(username === undefined || username === "" || password === undefined || password === "") {
      return res.status(400).json({"error": "Username or password has not been supplied"});
    }

    return res.status(200).json(await this.blaiseApiClient.validatePassword(username, password));
  }

  async ValidateRoles(req: Request, res: Response): Promise<Response> {
    console.log("Validating user roles");
    const user = await this.blaiseApiClient.getUser(req.params.username);
    if (this.auth.UserHasRole(user)) {
      return res.status(200).json({ token: this.auth.SignToken(user) });
    }

    return res.status(403).json({ "error": "Not authorised" });
  }

  async ValidateToken(req: Request, res: Response): Promise<Response> {
    if (this.auth.ValidateToken(req.body.token)) {
      return res.status(200).json();
    }
    return res.status(403).json();
  }
}
