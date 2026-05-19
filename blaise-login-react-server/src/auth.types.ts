export interface AuthConfig {
  SessionSecret: string;
  SessionTimeout: string;
  TokenIssuer: string;
  Roles: string[];
  BlaiseApiUrl: string;
}
