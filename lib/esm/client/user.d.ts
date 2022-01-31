import { User } from "blaise-api-node-client";
export declare function getUser(username: string): Promise<User>;
export declare function validatePassword(username: string, password: string): Promise<boolean>;
