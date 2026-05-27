import type { SignOptions } from "jsonwebtoken";

export interface AuthConfig {
  SessionSecret: string;
  SessionTimeout: SignOptions["expiresIn"];
  TokenIssuer: string;
  Roles: string[];
}
