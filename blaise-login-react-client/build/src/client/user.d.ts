import { User } from "blaise-api-node-client";
import { AuthManager } from "./token";
export declare function getCurrentUser(authManager: AuthManager): Promise<User | null>;
export declare function getUser(username: string): Promise<User | undefined>;
export declare function validatePassword(username: string, password: string): Promise<boolean>;
export declare function validateUserPermissions(username: string): Promise<[boolean, string | null]>;
export declare function validateToken(token: string | null): Promise<boolean>;
