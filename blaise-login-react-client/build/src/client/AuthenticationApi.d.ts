import { User } from "blaise-api-node-client";
import { AuthManager } from "./token";
export default class AuthenticationApi extends AuthManager {
    constructor();
    logOut(setLoggedIn: (loggedIn: boolean) => void): void;
    getLoggedInUser(): Promise<User | null>;
}
