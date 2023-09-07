import Cookies, { CookieSetOptions } from "universal-cookie";
export declare class AuthManager {
    cookies: Cookies;
    constructor();
    getToken(): string | null;
    setToken(token: string | null): void;
    clearToken(): void;
    loggedIn(): Promise<boolean>;
    authHeader(): Record<string, string>;
    cookieSettings(): CookieSetOptions;
}
